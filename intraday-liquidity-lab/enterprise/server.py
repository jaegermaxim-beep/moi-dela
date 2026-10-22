"""FLOWSTATE v12 enterprise sandbox, SYNTHETIC DEMO ONLY.

Run on loopback only. X-Demo-Actor is a SELF-SELECTED identity, not authentication.
Ledger is hash-chained and durable in local SQLite, not regulator-grade immutable storage.
"""
from __future__ import annotations

import hashlib
import json
import os
import sqlite3
import uuid
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal

from fastapi import FastAPI, Header, HTTPException
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, ConfigDict, Field, field_validator

USERS = {"treasury_alex": "TREASURY", "treasury_chris": "TREASURY", "risk_morgan": "RISK", "risk_sam": "RISK"}
ZERO_HASH = "0" * 64


def compact(value: Any) -> str:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False, allow_nan=False)


def digest(value: Any) -> str:
    return hashlib.sha256(compact(value).encode("utf-8")).hexdigest()


def utc() -> str:
    return datetime.now(timezone.utc).isoformat(timespec="milliseconds")


class ScenarioInput(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=3, max_length=120)
    input: dict[str, Any]
    output: dict[str, Any]
    model_version: str = Field(min_length=1, max_length=120)
    engine_version: str = Field(min_length=1, max_length=120)
    seed: int = Field(ge=0, le=2**31 - 1)

    @field_validator("input", "output")
    @classmethod
    def limit_json(cls, obj: dict) -> dict:
        try:
            size = len(compact(obj))
        except (ValueError, TypeError) as exc:
            raise ValueError("Finite JSON numbers required") from exc
        if size > 256_000:
            raise ValueError("Scenario JSON exceeds 256 KB demo limit")
        return obj


class RunInput(BaseModel):
    engine: str = Field(min_length=1, max_length=120)
    result: dict[str, Any]
    seed: int = Field(ge=0, le=2**31 - 1)
    notes: str = Field(default="", max_length=500)


class ProposalInput(BaseModel):
    scenario_id: str
    run_id: str
    title: str = Field(min_length=4, max_length=150)
    plan: dict[str, Any]
    rationale: str = Field(min_length=5, max_length=2000)


class Transition(BaseModel):
    expected_version: int = Field(ge=1)
    comment: str = Field(default="", max_length=2000)
    decision: Literal["APPROVE", "REJECT"] | None = None


class ScenarioFork(BaseModel):
    payload: ScenarioInput


def create_app(db_path: str | Path | None = None, static_dir: str | Path | None = None) -> FastAPI:
    database = str(db_path or Path.home() / ".flowstate" / "enterprise-demo.sqlite")
    root = Path(static_dir or Path(__file__).resolve().parents[1])
    Path(database).parent.mkdir(parents=True, exist_ok=True)
    app = FastAPI(title="FLOWSTATE Enterprise Sandbox", version="12.0", description="Localhost-only synthetic approval workflow; not bank production software.")

    def connect():
        conn = sqlite3.connect(database, timeout=10, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("PRAGMA busy_timeout=10000")
        return conn

    with connect() as conn:
        conn.executescript("""
        PRAGMA journal_mode=WAL;
        CREATE TABLE IF NOT EXISTS scenarios (
           id TEXT PRIMARY KEY, family TEXT NOT NULL, revision INTEGER NOT NULL,
           active INTEGER NOT NULL, name TEXT NOT NULL, input_json TEXT NOT NULL,
           output_json TEXT NOT NULL, model_version TEXT NOT NULL, engine_version TEXT NOT NULL,
           seed INTEGER NOT NULL, fingerprint TEXT NOT NULL, created_by TEXT NOT NULL,
           created_at TEXT NOT NULL, UNIQUE(family, revision)
        );
        CREATE TABLE IF NOT EXISTS runs (
           id TEXT PRIMARY KEY, scenario_id TEXT NOT NULL REFERENCES scenarios(id),
           engine TEXT NOT NULL, seed INTEGER NOT NULL, result_json TEXT NOT NULL,
           notes TEXT NOT NULL, fingerprint TEXT NOT NULL, created_by TEXT NOT NULL, created_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS proposals (
           id TEXT PRIMARY KEY, scenario_id TEXT NOT NULL REFERENCES scenarios(id),
           run_id TEXT NOT NULL REFERENCES runs(id), title TEXT NOT NULL,
           plan_json TEXT NOT NULL, rationale TEXT NOT NULL, status TEXT NOT NULL,
           version INTEGER NOT NULL, creator TEXT NOT NULL, risk_approver TEXT,
           treasury_approver TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS ledger (
           seq INTEGER PRIMARY KEY AUTOINCREMENT, event_id TEXT NOT NULL UNIQUE, at TEXT NOT NULL,
           actor TEXT NOT NULL, role TEXT NOT NULL, action TEXT NOT NULL,
           subject TEXT NOT NULL, data_json TEXT NOT NULL, prev_hash TEXT NOT NULL, event_hash TEXT NOT NULL
        );
        """)

    @contextmanager
    def transaction():
        conn = connect()
        try:
            conn.execute("BEGIN IMMEDIATE")
            yield conn
            conn.execute("COMMIT")
        except Exception:
            conn.execute("ROLLBACK")
            raise
        finally:
            conn.close()

    def append(conn: sqlite3.Connection, actor: str, action: str, subject: str, data: dict):
        prev = conn.execute("SELECT event_hash FROM ledger ORDER BY seq DESC LIMIT 1").fetchone()
        prev_hash = prev["event_hash"] if prev else ZERO_HASH
        record = {"event_id": str(uuid.uuid4()), "at": utc(), "actor": actor, "role": USERS[actor],
                  "action": action, "subject": subject, "data": data, "prev_hash": prev_hash}
        event_hash = digest(record)
        conn.execute("INSERT INTO ledger(event_id,at,actor,role,action,subject,data_json,prev_hash,event_hash) VALUES(?,?,?,?,?,?,?,?,?)",
                     (record["event_id"], record["at"], actor, USERS[actor], action, subject, compact(data), prev_hash, event_hash))
        return event_hash

    def actor_check(actor: str, role: str | None = None):
        if actor not in USERS:
            raise HTTPException(403, "Select a recognised synthetic demo actor")
        if role and USERS[actor] != role:
            raise HTTPException(403, f"This transition requires the {role} demonstration role")

    def require_scenario(conn, sid, active=True):
        r = conn.execute("SELECT * FROM scenarios WHERE id=?", (sid,)).fetchone()
        if not r: raise HTTPException(404, "Scenario not found")
        if active and not r["active"]: raise HTTPException(409, "Superseded scenario revision")
        return r

    def require_proposal(conn, pid):
        row = conn.execute("SELECT * FROM proposals WHERE id=?", (pid,)).fetchone()
        if not row: raise HTTPException(404, "Proposal not found")
        return row

    def proposal_view(row):
        if row is None: return None
        out = dict(row)
        out["plan"] = json.loads(out.pop("plan_json"))
        return out

    def store_scenario(conn, payload: ScenarioInput, actor: str, family: str | None = None, revision=1):
        sid = str(uuid.uuid4()); fid = family or sid
        body = payload.model_dump()
        sha = digest({"family":fid, "revision":revision, "input":payload.input,
                      "output":payload.output, "model":payload.model_version, "engine":payload.engine_version, "seed":payload.seed})
        conn.execute("INSERT INTO scenarios VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
                     (sid,fid,revision,1,payload.name,compact(payload.input),compact(payload.output),payload.model_version,
                      payload.engine_version,payload.seed,sha,actor,utc()))
        append(conn,actor,"SCENARIO_SNAPSHOT",sid,{"fingerprint":sha,"family":fid,"revision":revision,"payment_count":len(payload.input.get("book",[]))})
        return {"id":sid,"family":fid,"revision":revision,"fingerprint":sha,"active":True}

    @app.get("/api/health")
    def health():
        return {"service":"FLOWSTATE Enterprise Sandbox","version":"12.0","storage":"SQLite local","authentication":"NONE — self-selected demo identity", "production_ready":False}

    @app.get("/api/actors")
    def actors():
        return {"actors":[{"id":k,"role":v} for k,v in USERS.items()]}

    @app.post("/api/scenarios", status_code=201)
    def create_scenario(payload: ScenarioInput, x_demo_actor: str = Header(default="", alias="X-Demo-Actor")):
        actor_check(x_demo_actor,"TREASURY")
        with transaction() as conn:
            return store_scenario(conn,payload,x_demo_actor)

    @app.get("/api/scenarios")
    def list_scenarios():
        with connect() as conn:
            return {"scenarios":[dict(x) for x in conn.execute("SELECT id,family,revision,active,name,model_version,engine_version,seed,fingerprint,created_by,created_at FROM scenarios ORDER BY created_at DESC LIMIT 100")]}

    @app.get("/api/scenarios/{sid}")
    def get_scenario(sid: str):
        with connect() as conn:
            row = require_scenario(conn,sid,False)
            data=dict(row);data["input"]=json.loads(data.pop("input_json"));data["output"]=json.loads(data.pop("output_json"))
            recomputed=digest({"family":row["family"],"revision":row["revision"],"input":data["input"],"output":data["output"],"model":row["model_version"],"engine":row["engine_version"],"seed":row["seed"]})
            data["fingerprint_valid"] = recomputed == row["fingerprint"]
            return data

    @app.post("/api/scenarios/{sid}/fork", status_code=201)
    def fork_scenario(sid: str, fork: ScenarioFork, x_demo_actor: str=Header(default="",alias="X-Demo-Actor")):
        actor_check(x_demo_actor,"TREASURY")
        with transaction() as conn:
            old=require_scenario(conn,sid)
            conn.execute("UPDATE scenarios SET active=0 WHERE id=?",(sid,))
            prior=conn.execute("SELECT id,status FROM proposals WHERE scenario_id=? AND status NOT IN ('REJECTED','INVALIDATED')",(sid,)).fetchall()
            for p in prior:
                conn.execute("UPDATE proposals SET status='INVALIDATED',version=version+1,updated_at=? WHERE id=?",(utc(),p["id"]))
                append(conn,x_demo_actor,"PROPOSAL_INVALIDATED",p["id"],{"previous_status":p["status"],"reason":"Scenario superseded"})
            out=store_scenario(conn,fork.payload,x_demo_actor,old["family"],old["revision"]+1)
            append(conn,x_demo_actor,"SCENARIO_SUPERSEDED",sid,{"replacement_id":out["id"],"invalidated_proposals":len(prior)})
            return out

    @app.post("/api/scenarios/{sid}/runs",status_code=201)
    def create_run(sid: str,payload: RunInput,x_demo_actor: str=Header(default="",alias="X-Demo-Actor")):
        actor_check(x_demo_actor,"TREASURY")
        if len(compact(payload.result))>256_000: raise HTTPException(422,"Result snapshot exceeds demo size limit")
        with transaction() as conn:
            scenario=require_scenario(conn,sid)
            if payload.seed!=scenario["seed"]: raise HTTPException(409,"Model run seed must match immutable scenario snapshot")
            runid=str(uuid.uuid4());fp=digest({"scenario_hash":scenario["fingerprint"],"engine":payload.engine,"seed":payload.seed,"result":payload.result})
            conn.execute("INSERT INTO runs VALUES(?,?,?,?,?,?,?,?,?)",(runid,sid,payload.engine,payload.seed,compact(payload.result),payload.notes,fp,x_demo_actor,utc()))
            append(conn,x_demo_actor,"MODEL_RUN_SAVED",runid,{"scenario_id":sid,"fingerprint":fp,"engine":payload.engine})
            return {"id":runid,"scenario_id":sid,"fingerprint":fp}

    @app.get("/api/scenarios/{sid}/runs")
    def get_runs(sid: str):
        with connect() as conn:
            require_scenario(conn,sid,False)
            return {"runs":[{**dict(r),"result":json.loads(r["result_json"])} for r in conn.execute("SELECT * FROM runs WHERE scenario_id=? ORDER BY created_at DESC",(sid,))]}

    @app.post("/api/proposals",status_code=201)
    def create_proposal(p: ProposalInput,x_demo_actor: str=Header(default="",alias="X-Demo-Actor")):
        actor_check(x_demo_actor,"TREASURY")
        if len(compact(p.plan))>16_000:raise HTTPException(422,"Plan is too large for demo")
        with transaction() as conn:
            require_scenario(conn,p.scenario_id)
            r=conn.execute("SELECT scenario_id FROM runs WHERE id=?",(p.run_id,)).fetchone()
            if not r or r["scenario_id"]!=p.scenario_id:raise HTTPException(409,"Model run must belong to the active scenario")
            pid=str(uuid.uuid4());stamp=utc()
            conn.execute("INSERT INTO proposals VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)",
                         (pid,p.scenario_id,p.run_id,p.title,compact(p.plan),p.rationale,"DRAFT",1,x_demo_actor,None,None,stamp,stamp))
            append(conn,x_demo_actor,"PROPOSAL_CREATED",pid,{"scenario_id":p.scenario_id,"run_id":p.run_id,"plan_hash":digest(p.plan)})
            return proposal_view(require_proposal(conn,pid))

    @app.get("/api/proposals")
    def list_proposals(scenario_id: str|None=None):
        with connect() as conn:
            if scenario_id: rows=conn.execute("SELECT * FROM proposals WHERE scenario_id=? ORDER BY created_at DESC",(scenario_id,)).fetchall()
            else: rows=conn.execute("SELECT * FROM proposals ORDER BY created_at DESC LIMIT 100").fetchall()
            return {"proposals":[proposal_view(r) for r in rows]}

    def transition(pid,req: Transition,actor: str,step:str):
        role="RISK" if step=="risk" else "TREASURY"
        actor_check(actor,role)
        with transaction() as conn:
            p=require_proposal(conn,pid)
            require_scenario(conn,p["scenario_id"])
            if p["version"]!=req.expected_version:raise HTTPException(409,"Stale proposal version: refresh and review current version")
            if step=="submit":
                if p["status"]!="DRAFT" or p["creator"]!=actor:raise HTTPException(409,"Only drafting Treasury user can submit draft")
                new="PENDING_RISK"
            elif step=="risk":
                if p["status"]!="PENDING_RISK":raise HTTPException(409,"Awaiting Risk review is required")
                if actor==p["creator"]:raise HTTPException(403,"Independent Risk reviewer required")
                if req.decision is None:raise HTTPException(422,"Explicit Risk decision required")
                if not req.comment.strip():raise HTTPException(422,"Risk opinion is required")
                new="PENDING_TREASURY" if req.decision=="APPROVE" else "REJECTED"
            else:
                if p["status"]!="PENDING_TREASURY":raise HTTPException(409,"Risk sign-off required before final approval")
                if actor in (p["creator"],p["risk_approver"]):raise HTTPException(403,"Final Treasury approver must be independent of preparer and Risk")
                if req.decision is None:raise HTTPException(422,"Explicit Treasury decision required")
                if not req.comment.strip():raise HTTPException(422,"Treasury decision rationale is required")
                new="APPROVED" if req.decision=="APPROVE" else "REJECTED"
            # A scenario may have only one currently effective approved demo proposal.
            # Approval of a newer proposal explicitly supersedes the previous approval.
            if step=="treasury" and new=="APPROVED":
                current=conn.execute("SELECT id,version FROM proposals WHERE scenario_id=? AND status='APPROVED' AND id<>?",(p["scenario_id"],pid)).fetchall()
                for prior in current:
                    conn.execute("UPDATE proposals SET status='SUPERSEDED',version=version+1,updated_at=? WHERE id=?",(utc(),prior["id"]))
                    append(conn,actor,"APPROVAL_SUPERSEDED",prior["id"],{"replacement_proposal":pid})
            updates={"status":new,"updated_at":utc()}
            if step=="risk":updates["risk_approver"]=actor
            if step=="treasury":updates["treasury_approver"]=actor
            cols=", ".join(f"{key}=?" for key in updates)
            cur=conn.execute(f"UPDATE proposals SET {cols},version=version+1 WHERE id=? AND version=?",(*updates.values(),pid,p["version"]))
            if cur.rowcount!=1:raise HTTPException(409,"Concurrent change detected")
            append(conn,actor,{"submit":"SUBMITTED_FOR_RISK","risk":"RISK_REVIEW","treasury":"TREASURY_DECISION"}[step],pid,
                   {"from":p["status"],"to":new,"comment":req.comment,"decision":req.decision,"version":req.expected_version+1})
            return proposal_view(require_proposal(conn,pid))

    @app.post("/api/proposals/{pid}/submit")
    def submit(pid:str,req:Transition,x_demo_actor:str=Header(default="",alias="X-Demo-Actor")):
        actor_check(x_demo_actor,"TREASURY")
        return transition(pid,req,x_demo_actor,"submit")

    @app.post("/api/proposals/{pid}/risk-review")
    def risk_review(pid:str,req:Transition,x_demo_actor:str=Header(default="",alias="X-Demo-Actor")):
        return transition(pid,req,x_demo_actor,"risk")

    @app.post("/api/proposals/{pid}/treasury-decision")
    def treasury_decision(pid:str,req:Transition,x_demo_actor:str=Header(default="",alias="X-Demo-Actor")):
        return transition(pid,req,x_demo_actor,"treasury")

    @app.get("/api/ledger")
    def audit(limit:int=100):
        if limit<1 or limit>500:raise HTTPException(422,"Limit must be 1–500")
        with connect() as conn:
            return {"events":[{**dict(r),"data":json.loads(r["data_json"])} for r in conn.execute("SELECT * FROM ledger ORDER BY seq DESC LIMIT ?",(limit,))]}

    @app.get("/api/ledger/verify")
    def verify():
        previous=ZERO_HASH;count=0
        with connect() as conn:
            for row in conn.execute("SELECT * FROM ledger ORDER BY seq ASC"):
                body={"event_id":row["event_id"],"at":row["at"],"actor":row["actor"],"role":row["role"],
                      "action":row["action"],"subject":row["subject"],"data":json.loads(row["data_json"]),"prev_hash":row["prev_hash"]}
                if row["prev_hash"]!=previous or row["event_hash"]!=digest(body):
                    return {"valid":False,"first_invalid_seq":row["seq"],"verified_events":count}
                previous=row["event_hash"];count+=1
        return {"valid":True,"verified_events":count,"head_hash":previous,"integrity":"hash-chain only; not immutable or cryptographically signed"}

    @app.get("/api/evidence/verify")
    def verify_evidence():
        scenario_count=0;run_count=0;invalid=[]
        with connect() as conn:
            for r in conn.execute("SELECT * FROM scenarios"):
                scenario_count+=1
                inputs=json.loads(r["input_json"]);outputs=json.loads(r["output_json"])
                computed=digest({"family":r["family"],"revision":r["revision"],"input":inputs,
                                 "output":outputs,"model":r["model_version"],"engine":r["engine_version"],"seed":r["seed"]})
                if computed!=r["fingerprint"]:invalid.append({"kind":"scenario","id":r["id"]})
            for r in conn.execute("SELECT runs.*,scenarios.fingerprint AS scenario_fingerprint FROM runs JOIN scenarios ON runs.scenario_id=scenarios.id"):
                run_count+=1
                computed=digest({"scenario_hash":r["scenario_fingerprint"],"engine":r["engine"],"seed":r["seed"],"result":json.loads(r["result_json"])})
                if computed!=r["fingerprint"]:invalid.append({"kind":"run","id":r["id"]})
        return {"valid":not invalid,"scenario_snapshots":scenario_count,"model_runs":run_count,
                "invalid_records":invalid,"boundary":"Stored output hashes are verified; underlying model calculations are not recomputed."}

    @app.get("/api/overview")
    def overview():
        with connect() as conn:
            vals={}
            for name in ["scenarios","runs","proposals","ledger"]:vals[name]=conn.execute(f"SELECT COUNT(*) FROM {name}").fetchone()[0]
            vals["approved"]=conn.execute("SELECT COUNT(*) FROM proposals WHERE status='APPROVED'").fetchone()[0]
            vals["pending"]=conn.execute("SELECT COUNT(*) FROM proposals WHERE status IN ('PENDING_RISK','PENDING_TREASURY')").fetchone()[0]
            return vals

    # Only synthetic demo files are served; no arbitrary filesystem access. API routes precede static mount.
    app.mount("/", StaticFiles(directory=str(root),html=True),name="static")
    return app


app = create_app(db_path=os.environ.get("FLOWSTATE_DB"))

if __name__ == "__main__":
    import uvicorn
    # Loopback-only by design; do not expose this demo to public networks.
    uvicorn.run(app,host="127.0.0.1",port=int(os.environ.get("FLOWSTATE_PORT","8765")))