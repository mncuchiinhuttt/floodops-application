# PlannerSafety authority correction — SourceEvidence

Work item `planner-safety-domain-correction-v2`; role PlannerSafety; implementation/correction mode.
CWD `/Users/vominhlong/seahackathon-worktrees/06-planner-safety`; branch `feat/floodops-planner-safety`.
Source C `ec55648c3ecc3e7ada9ca0db33ccc05cc3c9907f`; observed Git signature **G**. The report's own commit SHA is submitted separately.

## Startup and pinned inputs

Parent supplied exact launch `2364a58e271a738790fe2a70fd47f67ad0befb52`,
BASE `223a58654210e934dfb1eda1092be33a7fdc30fe`.
Receipt `worktree-execution/launch/planner-safety/planner-safety-domain-correction-v2.json`;
amendment `backend-repairs-client-runtime-v1`.
Existing signed own report checkpoint `963f61ccaace9a7c2cd2743665b96986f1c4bda7` was clean and an ancestor.
Verified expected root/branch, exact receipt/policy/index hashes, metadata-only BASE-to-launch and
all five required gate ancestors before fast-forwarding to the exact authorized launch.

Required gates: contracts-ready `1f2b77e88be0a5ebd1644ad11c3cb5c3bfe5f5ca`;
simulation-ready `30e058252d4176c76a8b17b40e25786f34b50b4c`;
workspace-bootstrap `aea042b5fdb5100e826672111f326d3a03847ee7`;
plan-published `dee4dfb00af173eb3cccc2a0df75e67fa1577734`;
platform-ready `3cebe9e8d8b4fd4fd11cd319b1549952c119caa5`.

All **654 artifacts** at index source/index/exact launch matched raw-byte SHA256 (**1,962 checks**).
Index commit is BASE; policy/index hashes are in the JSON evidence below.
Post-correction verification also confirmed all **650 unchanged indexed checkout artifacts** match;
the other four are intentionally owned correction files (planning README/evaluator/index/road-policy).
An initial post-edit equality probe encountered the intentionally changed README; it was not treated
as frozen-input drift or bypassed. Full delivery verification checks the three pinned historical trees.

Scope: planning domain plus apps/api/test/planning and policy, exact own report. No full runtime ownership
was opened. Remote grants none; assigned diagnostic port8786 was not used. Frozen own-worktree
Bun1.4.0 install --ignore-scripts passed (67 additional pinned packages). No state/env/credential copy.

Parent requested sol/ultra/fast; runtime self-introspection remains unavailable, so actual model/tier
metadata is unverified. A read-only helper independently reproduced/reviewed/tested; no duplicate writer.

## Root causes and corrections

1. Proposal policy previously ignored branch, so a FloodOps action approval could authorize static and
   reroute_only. It also removed current grants from untouched FloodOps drivers.
   The adapter now applies proposed authority only to selected physical-action drivers in FloodOps.
   Other paths delegate to separately captured committed/current policy before inspecting proposal
   identity/approvals or allowPending. Own baseline grants remain branch/driver specific.

2. Evaluator previously used the new proposal policy to project both before and after, so approval
   changed hypothetical current metrics and could hide critical loss. Before now uses only the
   independent committed/current policy. After composes committed authority for untouched drivers
   with selected proposal authority, using the same captured run/H/physics.

`createCurrentPolicy` shares captured hard/conflict/expiry/epoch guards with the proposal predicate;
a committed grant cannot revive simulator-erased expired evidence. It reads no latest proposal
identity or proposal approvals. It passes detached canonical DTOs to the injected policy, preventing
nested-array mutation through delegated arguments. Missing real current policy fails CONFIG_INCOMPLETE.
No wire field/schema change or constant “before” metric was introduced.

Consumer cutover at `@floodops/domain/planning`:
- New `createCurrentPolicy(run, authority: SimulationPolicy)`.
- `createPlanningPolicy` requires `currentPolicy` as its fourth argument; optional allowPending/observer follow.
- `CandidateEvaluationInput.currentPolicy` is required.
- All discovered existing consumers were owned tests/smokes and were updated. No application consumer
  outside this slice was found by scoped import search. Current authority is a trusted server port,
  never new proposal approvals or a permissive fallback.

The Lead-supplied dependency/export resolve the earlier v1 integration request. Standard checks now
run without temporary tsconfig path overrides. Existing group/hub/defer/objective guards are retained.

## Actual tests and runtime smoke

Test-first new suite on old source showed **4 pass / 6 fail**: before-objective corruption, untouched
driver authority loss and missing-current-policy behavior failed; two branch cases also exposed old/new
signature mismatch. Independent legacy-signature simulator repro confirmed all3 branches entered from
one proposal grant, and the same critical-loss proposal flipped Ready to blocked solely on approval.
After correction all regression assertions and all prior81 tests pass.

Final focused suite: **95 pass, 0 fail, 223 assertions**, six files.
Standard domain tsc, focused test tsc, scoped ESLint and diff checks all pass.
All new/changed source/test modules remain under200 lines.
Independent read-only review: **ready9.6/10**, no blocking source finding, including detached port DTOs.
No prior safety assertion was weakened/deleted.

Authority CLI:
`bun apps/api/test/planning/authority-smoke.ts`
```json
{
  "datasetKind": "functional_fixture",
  "bundleHash": "647069229e623e2e23bb1f850c97f852ebd87d56cce03a498b72a18779327e81",
  "branchDecisions": {
    "floodops": {"allowed": true, "reason": "SOFT_RISK_APPROVED"},
    "static": {"allowed": false, "reason": "TEST_HIGH_ONLY"},
    "reroute_only": {"allowed": false, "reason": "TEST_HIGH_ONLY"}
  },
  "actualProjectedEntries": [{"branch": "floodops", "segment": "seg_edge17", "at": 0.25}],
  "currentCriticalEta": 4.75,
  "currentCriticalUnreachable": 0,
  "proposalOutcomes": [
    {"approved": false, "status": "blocked", "rule": "POL-05"},
    {"approved": true, "status": "blocked", "rule": "POL-05"}
  ],
  "inputUnchanged": true
}
```

Original event-fixture hub CLI:
`bun apps/api/test/planning/planning-smoke.ts`.
Bundle `42d25cad85adb3e11939b8496469f0b2ba7891003ae89d0be5049dd54fb7ec46`;
seed `a5ed2d18708f37f1021225af64236140b32f43d19e902558b2f4bb9ebbdc56c9`;
config `2dfe0b778bab983d5621e07e249203e1fbb3db6f849369e560d7abacd9127f38`;
graph `a5bf0eb6d7e57bc3f80fd11571cf21d19d870da91d56cac34b62191859f2c86c`.
Ready projected hub_beta01 pickup6.25/completion9.75, original standard driver null, input unchanged,
same-revision newer job needs_replan. No Bun /tmp mapping diagnostic occurs in these standard commands.

## Limits and handoff

No blocker remains for this pure correction. No action was denied/pending/uncertain.
Full Sources-ready continuation is still required before full Commander/controllers/jobs/routers/
durable Execute and business-composition work. This report is not planner-ready/backend-ready or
durable race/model/device/client E2E/calibration proof. Generic simulator no-route diagnostics and
upstream producer knowledge validation remain qualified in the owned README.

Only the exact authorized baseline was fast-forwarded; no main/integration promotion, push,
deploy, provider/model/paid/account/key/resource/device/EAS/store call, central manifest/config/lock/
policy/schema/fixture/simulator/gate edit or out-of-scope write occurred. Plan/gates remain Lead-owned.
Source C is followed by one report-only direct child; exact delivery SHA is returned out of band.

## SourceEvidence

```json
{
  "work_item_id": "planner-safety-domain-correction-v2",
  "role_id": "planner-safety",
  "base_sha": "223a58654210e934dfb1eda1092be33a7fdc30fe",
  "observed_launch_sha": "2364a58e271a738790fe2a70fd47f67ad0befb52",
  "status": "code-ready-for-integration",
  "contract_sha256": "bda263b1d21bfa26994d857da94f97b8974a3cfee08059e805e889f765202527",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a",
  "source_sha": "ec55648c3ecc3e7ada9ca0db33ccc05cc3c9907f",
  "changed_paths": [
    "apps/api/test/planning/authority-isolation.test.ts",
    "apps/api/test/planning/authority-smoke.ts",
    "apps/api/test/planning/candidate-evaluator.test.ts",
    "apps/api/test/planning/candidate-groups.test.ts",
    "apps/api/test/planning/candidate-operations.test.ts",
    "apps/api/test/planning/planning-smoke.ts",
    "apps/api/test/planning/tsconfig.json",
    "apps/api/test/policy/road-policy.test.ts",
    "packages/domain/src/planning/README.md",
    "packages/domain/src/planning/current-policy.ts",
    "packages/domain/src/planning/evaluate-candidate.ts",
    "packages/domain/src/planning/index.ts",
    "packages/domain/src/planning/road-knowledge.ts",
    "packages/domain/src/planning/road-policy.ts",
    "plans/reports/worktree-planner-safety-planner-safety-domain-correction-v2.md"
  ],
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-domain-correction-v2.md"
    },
    {
      "command": "bun test apps/api/test/planning apps/api/test/policy",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-domain-correction-v2.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p packages/domain/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-domain-correction-v2.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/planning/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-domain-correction-v2.md"
    },
    {
      "command": "bun --bun run eslint packages/domain/src/planning apps/api/test/planning apps/api/test/policy --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-domain-correction-v2.md"
    },
    {
      "command": "git diff --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-domain-correction-v2.md"
    },
    {
      "command": "git diff --cached --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-domain-correction-v2.md"
    }
  ],
  "smoke": [
    {
      "scenario": "bun apps/api/test/planning/authority-smoke.ts",
      "observed_result": "Only floodops enters seg_edge17 at0.25; static/reroute_only denied. Independently authorized current critical ETA4.75/unreachable0. Empty-route critical-loss proposal is POL05 blocked both without and with new approval. Input unchanged.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-domain-correction-v2.md"
    },
    {
      "scenario": "bun apps/api/test/planning/planning-smoke.ts",
      "observed_result": "Original event functional fixture remains Ready projected; hub_beta01 pickup6.25/completion9.75; committed standard driver remains null; same-revision superseded job needs_replan; input unchanged.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-domain-correction-v2.md"
    }
  ],
  "public_exports": [
    "createCurrentPolicy(run: SimulationRun, authority: SimulationPolicy): SimulationPolicy",
    "createPlanningPolicy(run, proposalAuthority, actionIdsByDriver, currentPolicy: SimulationPolicy, allowPending?, observe?): SimulationPolicy",
    "CandidateEvaluationInput.currentPolicy: SimulationPolicy (required)",
    "Existing evaluateRoadEntry/checkProposalIdentity/selectDependencyGroups/compileCandidate/evaluateCandidate and types retained at @floodops/domain/planning"
  ],
  "integration_requests": [
    "Lead merge exact report delivery; no central manifest/export change needed (provided in launch).",
    "Future full Planner/Results consumers must supply independently captured committed/current SimulationPolicy; it owns branch/driver current grants and must not derive them from new proposal approvals.",
    "Future controller/DO transaction must keep proposed and committed authority separate and recheck current evidence/latest pointers at actual commit. Full runtime requires fresh sources-ready continuation.",
    "Optional existing public simulator seam request for exact route-failure traces remains; no private simulator/schema/fixture edits performed."
  ],
  "blocked_prerequisites": [
    "No blocker remains for this authorized pure correction slice.",
    "Full phase06 Commander/controllers/jobs/routers/durable Execute and business composition remain deferred until actual sources-ready and a fresh full receipt.",
    "No real model/device/preview/deployment/calibration/full backend/client E2E acceptance was authorized or claimed."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false
}
```
