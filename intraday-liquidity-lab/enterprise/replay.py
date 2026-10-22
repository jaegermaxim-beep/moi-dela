"""Verify a recorded FLOWSTATE Group/Entity cashflow snapshot by independently re-running the same JavaScript model.

NOTE: This is deterministic computational replay, not independent model validation or ML retraining.
"""
from __future__ import annotations
import argparse
import json
import sqlite3
import subprocess
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
RUNNER=Path(__file__).with_name('replay_runner.cjs')


def replay(input_data:dict, expected_output:dict, tolerance=1e-6):
    result=subprocess.run(['node',str(RUNNER)],input=json.dumps(input_data),text=True,capture_output=True,timeout=20,check=True)
    actual=json.loads(result.stdout)
    differences=[]
    def recurse(path,expect,got):
        if isinstance(expect,(int,float)) and not isinstance(expect,bool) and isinstance(got,(int,float)) and not isinstance(got,bool):
            if abs(expect-got)>tolerance:differences.append({'field':path,'expected':expect,'actual':got})
        elif isinstance(expect,dict) and isinstance(got,dict):
            for key in expect:
                if key not in got:differences.append({'field':path+'.'+str(key),'error':'missing'})
                else:recurse(path+'.'+str(key),expect[key],got[key])
        elif isinstance(expect,list) and isinstance(got,list):
            if len(expect)!=len(got):differences.append({'field':path,'error':'length mismatch'})
            else:
                for i,(a,b) in enumerate(zip(expect,got)):recurse(f'{path}[{i}]',a,b)
        elif expect!=got:differences.append({'field':path,'expected':expect,'actual':got})
    recurse('output',expected_output,actual)
    return {'match':not differences,'checked_fields':'group, entity positions and intraday cash curves','differences':differences[:20]}


def load(db_path:str,sid:str):
    with sqlite3.connect(db_path) as c:
        c.row_factory=sqlite3.Row
        row=c.execute('SELECT * FROM scenarios WHERE id=?',(sid,)).fetchone()
        if not row:raise ValueError('Scenario ID not found')
        return json.loads(row['input_json']),json.loads(row['output_json'])


if __name__=='__main__':
    parser=argparse.ArgumentParser(description='Recalculate saved synthetic Group/Entity cash flows')
    parser.add_argument('--db',default=str(Path.home()/'.flowstate'/'enterprise-demo.sqlite'))
    parser.add_argument('--scenario',required=True,help='Scenario UUID from the Enterprise Sandbox')
    args=parser.parse_args()
    x,y=load(args.db,args.scenario)
    report=replay(x,y)
    print(json.dumps(report,indent=2))
    sys.exit(0 if report['match'] else 2)