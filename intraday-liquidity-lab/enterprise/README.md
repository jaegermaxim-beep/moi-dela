# FLOWSTATE 12 — Enterprise Readiness Sandbox

**Scope: synthetic, local-only proof of concept.** This is not a bank production system, not an externally accessible service, not a secure identity provider, and not a real payment or repo execution system.

## Run locally

```bash
# From the intraday-liquidity-lab directory:
python -m pip install -r enterprise/requirements.txt
python -m enterprise.server
# Open http://127.0.0.1:8765/ in a local browser
```

Requires Python 3.11+ and Node.js 20+ for deterministic replay. The database is created outside the website directory at `~/.flowstate/enterprise-demo.sqlite`. The server binds to `127.0.0.1` and does not enable cross-origin access. To isolate a new synthetic demonstration, set `FLOWSTATE_DB=/absolute/path/sandbox.sqlite`. No credentials required or accepted: all identities are **explicitly self-selected illustrations**.

For tests:

```bash
python -m pytest -q tests/test_enterprise_server.py tests/test_enterprise_replay.py
node tests/test_decision_state.js
python tests/browser_qa_v12.py
```

## Workflow and separation of duties

1. **Treasury preparer** captures immutable-through-the-API payment and model result snapshot, pinned to scenario revision, model version, engine version, seed, and SHA-256 digest. Model output is copied from the browser and saved; the server does not execute the forest or validate banking data.
2. A **model run** captures the output with a separate fingerprint and is linked to the scenario. No proposal can be submitted without evidence linked to its active scenario.
3. **Treasury preparer** creates a draft funding plan and submits to independent second line.
4. **Risk reviewer** records a written opinion and approves or rejects the plan.
5. **Different Treasury approver** makes the final simulation decision; the preparer cannot self-approve. Only one final approved plan per scenario remains current; a newer approval supersedes older approvals.
6. A **scenario fork** creates a new immutable revision and invalidates all live proposals on the previous revision. Optimistic version checks prevent stale decisions.
7. An application-level **hash-chained SQLite ledger** captures transitions and checksums. The endpoint `/api/ledger/verify` verifies chain consistency. `/api/evidence/verify` verifies saved scenario and run fingerprints. Neither is a signed or cryptographically anchored immutable log.
8. For deterministic numerical replay, run `python -m enterprise.replay --scenario <UUID>` (with the same `FLOWSTATE_DB`). This executes the existing JavaScript Group/Entity cashflow engine using stored payment inputs and compares it to stored curves and indicators. It does **not** retrain the Random Forest or independently validate model quality.

### Illustrative identities (not authentication)

| Demo identity | Nominal role | Responsibilities |
| --- | --- | --- |
| `treasury_alex` | Treasury | Scenario creation, drafting, submission |
| `risk_morgan` or `risk_sam` | Risk Management | Independent challenge and approval or rejection |
| `treasury_chris` | Treasury | Final approval distinct from proposal preparer |

The `X-Demo-Actor` header is editable by the client. **Anyone with access to the localhost demo can choose any identity. This is not RBAC, SSO, MFA or real four-eyes enforcement against a malicious user.** It illustrates workflow constraints only.

## Architectural overview

```text
Python Random Forest training (offline) -> exported trees
                        |
          Browser model inference + cashflow engine (synthetic)
                        |
         Scenario snapshot + result / model-run fingerprint
                        |
            Local FastAPI REST API (127.0.0.1)
                        |
              SQLite WAL + per-event hash chain
                        |
       Treasury Draft -> Risk Review -> Treasury Final Approval
                        |
                  Audit Verification / Replay
```

## Scope and material gaps to production

- **No authentication**: API trusts a caller-provided actor header. Implement enterprise SSO/OIDC, bearer-token validation, CSRF controls, auditable claims and scoped authorization before any shared deployment.
- **No secure multi-tenant isolation, secrets management or access logging**: database is a local development artifact, not a controlled bank data platform.
- **No immutable audit**: SQLite rows are mutable by OS-level access; a mutable hash chain cannot defend against wholesale deletion or sophisticated rewrite. Use append-only externally anchored/WORM storage, retention policy and signed integrity checkpoints.
- **No automatic cross-system approval enforcement**: v11.2 in-browser simulation approvals remain separate from this server workflow. The server's final approval does not grant permission to execute, transfer, settle or pledge anything.
- **No model replay of Random Forest training**: numerical replay covers deterministic cashflow aggregation from stored settlement timestamps. The Python ML training/evaluation is a separate offline workflow.
- **No backend eligibility engine**: proposal limits, collateral eligibility, cut-offs and repo funding costs remain demonstrative, and user-submitted plans are not independently bank validated.
- **No live integration** to TARGET services, nostro, collateral, Treasury funding, SmartPredict, Azure, bank books or central-bank facilities.
- **No actual payments or repo execution**. There is intentionally no execution endpoint.
- **No production security assessment, model validation or operational resilience**: all inputs are synthetic and bank-specific controls require design and independent review.

GitHub Pages presents the browser-only interactive demo. The FastAPI service and SQLite persistence **are not running on GitHub Pages**, and its Enterprise Sandbox panel visibly reports browser-only mode. The user must run the local service to demonstrate persistent workflow.