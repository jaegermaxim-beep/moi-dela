"""Synthetic local FastAPI Enterprise Sandbox invariants."""
import json
import sqlite3
import tempfile
from pathlib import Path
import pytest
from fastapi.testclient import TestClient
from enterprise.server import create_app

@pytest.fixture()
def lab(tmp_path):
    db=tmp_path/'demo.sqlite'
    return TestClient(create_app(db_path=db)), db


def call(client,verb,path,actor='treasury_alex',**kw):
    return client.request(verb,path,headers={'X-Demo-Actor':actor},**kw)


def data(name='Synthetic USD BAU',seed=2026):
    return {'name':name,'seed':seed,'model_version':'RF32-synthetic-demo','engine_version':'FLOWSTATE-12.0',
            'input':{'seed':seed,'opening':2300,'delay':0,'accel':0,'book':[{'id':'SIM-0001','kind':'IN','amount_musd':80,'forecast_minute':755,'actual_minute':790}]},
            'output':{'group_lnncp_musd':750.4,'group_surplus_musd':1549.6,'calculation':'illustrative JS snapshot, not recomputed by server'}}


def prepare(client):
    r=call(client,'POST','/api/scenarios',json=data());assert r.status_code==201,r.text
    scenario=r.json();sr=call(client,'POST',f'/api/scenarios/{scenario["id"]}/runs',json={'engine':'RF32-forecast','seed':2026,'result':{'group_lnncp':750.4}})
    assert sr.status_code==201,sr.text
    r=call(client,'POST','/api/proposals',json={'scenario_id':scenario['id'],'run_id':sr.json()['id'],'title':'Repo funding 50m T+1',
                                                     'plan':{'kind':'repo','notional_musd':50,'repayment':'T+1'},'rationale':'Synthetic reserve shortfall mitigation'})
    assert r.status_code==201,r.text
    return scenario,r.json()


def step(client,p,endpoint,actor='treasury_alex',decision=None,comment='Model risk checked'):
    body={'expected_version':p['version'],'comment':comment}
    if decision:body['decision']=decision
    return call(client,'POST',f'/api/proposals/{p["id"]}/{endpoint}',actor,json=body)


def test_four_eyes_approval_and_snapshot_integrity(lab):
    client,db=lab
    scenario,p=prepare(client)
    assert client.get(f'/api/scenarios/{scenario["id"]}').json()['fingerprint_valid']
    assert step(client,p,'treasury-decision',actor='treasury_chris',decision='APPROVE').status_code==409
    assert step(client,p,'submit',actor='risk_morgan').status_code==403
    p=step(client,p,'submit').json()
    assert p['status']=='PENDING_RISK'
    assert step(client,p,'risk-review',actor='treasury_chris',decision='APPROVE').status_code==403
    assert step(client,p,'risk-review',actor='risk_morgan').status_code==422
    p=step(client,p,'risk-review',actor='risk_morgan',decision='APPROVE').json()
    assert p['status']=='PENDING_TREASURY' and p['risk_approver']=='risk_morgan'
    assert step(client,p,'treasury-decision',actor='treasury_alex',decision='APPROVE').status_code==403
    p=step(client,p,'treasury-decision',actor='treasury_chris',decision='APPROVE').json()
    assert p['status']=='APPROVED' and p['treasury_approver']=='treasury_chris'
    assert step(client,p,'treasury-decision',actor='treasury_chris',decision='APPROVE').status_code==409
    audit=client.get('/api/ledger/verify').json()
    assert audit['valid'] and audit['verified_events']==6
    assert client.get('/api/overview').json()['approved']==1
    # Frozen evidence: submitted input is precisely retrievable
    stored=client.get(f'/api/scenarios/{scenario["id"]}').json()
    assert stored['input']==data()['input'] and stored['output']==data()['output']


def test_fork_invalidates_and_stale_cannot_approve(lab):
    client,db=lab
    s,p=prepare(client)
    p=step(client,p,'submit').json()
    revised=data('USD stress',seed=2027)
    fork=call(client,'POST',f'/api/scenarios/{s["id"]}/fork',json={'payload':revised})
    assert fork.status_code==201,fork.text
    new=fork.json()
    assert new['family']==s['family'] and new['revision']==2
    assert client.get(f'/api/scenarios/{s["id"]}').json()['active']==0
    assert step(client,p,'risk-review',actor='risk_morgan',decision='APPROVE').status_code==409
    props=client.get('/api/proposals').json()['proposals']
    assert props[0]['status']=='INVALIDATED'
    assert client.get('/api/ledger/verify').json()['valid']
    assert call(client,'POST',f'/api/scenarios/{s["id"]}/runs',json={'engine':'RF','seed':2026,'result':{}}).status_code==409


def test_rejection_missing_role_and_wrong_run(lab):
    client,db=lab
    assert call(client,'POST','/api/scenarios',actor='risk_morgan',json=data()).status_code==403
    s,p=prepare(client)
    p=step(client,p,'submit').json()
    p=step(client,p,'risk-review',actor='risk_sam',decision='REJECT',comment='Assumed collateral unavailable').json()
    assert p['status']=='REJECTED'
    assert step(client,p,'treasury-decision',actor='treasury_chris',decision='APPROVE').status_code==409
    assert call(client,'POST','/api/proposals',json={'scenario_id':s['id'],'run_id':'not-the-run',
     'title':'Invalid proposal','plan':{'kind':'repo'},'rationale':'No valid model evidence'}).status_code==409
    assert client.get('/api/ledger/verify').json()['valid']


def test_tamper_detection_and_concurrent_version(lab):
    client,db=lab
    s,p=prepare(client)
    outdated={'expected_version':p['version'],'comment':'submit'}
    assert call(client,'POST',f'/api/proposals/{p["id"]}/submit',json=outdated).status_code==200
    assert call(client,'POST',f'/api/proposals/{p["id"]}/submit',json=outdated).status_code==409
    with sqlite3.connect(db) as c:
        c.execute("UPDATE ledger SET data_json=? WHERE seq=1",(json.dumps({'malicious':True}),))
    assert client.get('/api/ledger/verify').json()['valid'] is False


def test_no_execution_api_and_static_frontend(lab):
    client,_=lab
    assert client.get('/').status_code==200
    assert 'Enterprise Readiness' in client.get('/').text or 'FLOWSTATE' in client.get('/').text
    assert client.post('/api/execute-repo').status_code in (404,405)
    assert client.get('/api/health').json()['authentication'].startswith('NONE')


def test_final_approval_supersedes_previous_on_same_scenario(lab):
    client,_=lab
    s,first=prepare(client)
    def finish(proposal):
        proposal=step(client,proposal,'submit').json()
        proposal=step(client,proposal,'risk-review',actor='risk_morgan',decision='APPROVE').json()
        proposal=step(client,proposal,'treasury-decision',actor='treasury_chris',decision='APPROVE').json()
        return proposal
    assert finish(first)['status']=='APPROVED'
    model_run=client.get(f'/api/scenarios/{s["id"]}/runs').json()['runs'][0]['id']
    second=call(client,'POST','/api/proposals',json={'scenario_id':s['id'],'run_id':model_run,
          'title':'Central bank contingency liquidity','plan':{'kind':'central_bank','amount_musd':20},
          'rationale':'Alternate illustrative contingency action'}).json()
    assert finish(second)['status']=='APPROVED'
    statuses={p['id']:p['status'] for p in client.get('/api/proposals').json()['proposals']}
    assert statuses[first['id']]=='SUPERSEDED'
    assert statuses[second['id']]=='APPROVED'
    assert client.get('/api/overview').json()['approved']==1
    assert client.get('/api/ledger/verify').json()['valid']


def test_saved_model_run_integrity_evidence(lab):
    client,db=lab
    s,p=prepare(client)
    assert client.get('/api/evidence/verify').json()['valid']
    with sqlite3.connect(db) as c:
        c.execute("UPDATE runs SET result_json=?",(json.dumps({'group_lnncp':999999}),))
    report=client.get('/api/evidence/verify').json()
    assert not report['valid']
    assert report['invalid_records'][0]['kind']=='run'