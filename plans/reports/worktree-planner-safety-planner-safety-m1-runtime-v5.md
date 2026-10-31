# PlannerSafety M1 wire runtime — SourceEvidence

Work item `planner-safety-m1-runtime-v5`; role `planner-safety`.
CWD `/Users/vominhlong/seahackathon-worktrees/06-planner-safety`; branch `feat/floodops-planner-safety`.
Source C `e8275f527cf2accb3464fd1f8fcd9772eb704740`; observed Git signature **G**.
The report-only direct-child delivery SHA is returned separately.

## Startup and frozen authority

Exact authorized launch `c30dd59defde31e222e4a52416ad3e6f553d0bb0`;
BASE `2a440311b4a8a78f1dc3303e7aa9c8c35d097f40`.
Receipt `worktree-execution/launch/planner-safety/planner-safety-m1-runtime-v5.json`;
amendment `m1-wire-rollout-v3`.
Read current AGENTS, start-here, exact role packet, PRD v0.5/phase context and
contracts/m1-cutover.md plus actual197-schema public source.
Historical definition/root surface/README were not treated as M1 authority.

Verified clean signed previous delivery, expected worktree/branch, own checkpoint
and BASE ancestry, all5 required gate ancestors, metadata-only BASE-to-launch,
pinned AGENTS/index SHA256. All **1,017 indexed artifacts** matched raw bytes at
source/index/launch (**3,051 hash checks**).
Fast-forwarded preserving history only to the exact supplied launch; no moving HEAD,
rolloutv1/v2, main pull, reset, stash, rebase or sibling WIP.
Frozen Bun1.4.0 install with scripts disabled checked1,102 installs/1,261 packages,
no dependency/lock changes. Existing deterministic C7730846/R04a7934 was reused.

Required ancestors: contracts `1f2b77e88be0a5ebd1644ad11c3cb5c3bfe5f5ca`;
simulation `30e058252d4176c76a8b17b40e25786f34b50b4c`;
bootstrap/policy `aea042b5fdb5100e826672111f326d3a03847ee7`;
plan `dee4dfb00af173eb3cccc2a0df75e67fa1577734`;
platform `3cebe9e8d8b4fd4fd11cd319b1549952c119caa5`.
This source does not manufacture an updated combined backend/consumer gate.

## Changes and public composition

`createPlanningRuntime({persistence,search?,deadlineMs?,...})` still returns registry,
router and genuine committedPolicy, and now also exposes **planner** metadata:

```ts
{
  kind: "deterministic",
  algorithm_version: "deterministic-bounded-v1",
  config_hash: "<SHA256 of actual algorithm/bounds/deadline/contract>",
  search_limit: limits.maxCandidates
}
```

Metadata is parsed/frozen server-side at construction and captured in each queued
job. PlanningJob serialization contains planner only, **no model/model_config_hash**.
The actual bounded v4 algorithm, stable structural tie-break, physical/evidence/
capacity/tier/objective evaluation and source/current/proposal/baseline isolation
are preserved. Default16 candidate budget and30s deadline remain explicit, caps128/60s.

Internal service code uses public InternalServiceName/Input/Output and strict
parseInternalServiceInput/Output. Contract definitions remain internal-only:
getToolDefinitions deliberately throws RuntimeCommanderDisabledError; the preserved
legacy controller now checks that registry before timer/transport allocation.
OpenAI adapters/modules are preserved unchanged, not imported by the M1 job or
planning entrypoint. Separate photo AI is outside this task; no live call occurred.

Bounded search exhaustion now yields a failed PlanningJob with
**NO_FEASIBLE_PLAN**, null plan_id and terminal timestamp. It retains private search
audit, stores no empty blocked Plan/routes and emits no proposal_changed/latest-plan
publication. It means no candidate within declared search bounds, not global infeasibility.
no_change remains distinct: completed with a real immutable empty/no-op Plan and
no operational effect. Deadline completion and owned watchdog hook use
**PLANNER_TIMEOUT**. Complete/cancel/expire terminal jobs are parsed against strict
current PlanningJob constraints. Cancelled/superseded preserve null plan/error plus
terminal time. Failure completion records failed lease/new reason, not a fake model result.

Owned state access checks runtime_contract serialization m1-v1/version0.5.0-m1
before reading/initializing jobs. Uncached old/missing markers return409 STATE_CONFLICT
without rewriting old values. The feature expiry hook leaves legacy values unchanged
rather than parsing/upgrading old DTOs or breaking generic lifecycle calls.
**This reducer-level guard is not a substitute for the missing generic pre-replay
serialization fence; that integration limitation is listed below.**

The genuine public callback remains
`createCommittedMovementPolicy(context:TransitionContext,run:Readonly<SimulationRun>):SimulationPolicy`.
Root should compose its actual persistence with planning registry/router and inject
this callback into Results simulation. Registry views/hooks remain available through
the public returned registry; preserve other Source/Review/Results hooks. No provider
configuration/key is needed for planning, and no model can gain Execute authority.
Human approval remains metadata-only; atomic manual Execute/replay/current IDs/Reset
and committed route/grant guards are unchanged.

## Actual checks

Bun1.4.0; Node26.8.1 launches the approved Workerd tooling exception. Commands use
the worktree CWD above. Checks are reported separately from producer/integration gates.

- `bun test apps/api/test/planning apps/api/test/policy`:
  **112 pass,0 fail,284 assertions,10 files**, final8.66s.
- `node node_modules/vitest/vitest.mjs run --config apps/api/test/planning/vitest.config.ts`:
  **13 pass,0 fail,3 files**, final24.34s.
- Scoped ESLint including owned planning/domain/incidents/operations/retained OpenAI
  adapter and planning/policy tests: **pass**, zero warnings.
- git diff and cached diff checks: **pass**.
- Standard `bun --bun run tsc --noEmit -p apps/api/test/planning/tsconfig.json`:
  **FAIL outside owner scope**, only diagnostic TS2739 at
  packages/domain/src/reporting/submit-report.ts:14 missing reward/review_result_id/reviewed_at.
- Standard `bun --bun run tsc --noEmit -p packages/domain/tsconfig.json`:
  **same external TS2739 failure**, no owned planning diagnostic.
  This is the assigned Sources migration, not waived or fixed through casts/test exclusions.
  Baseline also reported the two owned MODEL_TIMEOUT type errors; those are resolved here.

New actual DO cases verify strict planner metadata, no old model fields, stable captured
budget/config, no-feasible failed/null-plan/no-proposal/no-ops, no-change completion,
PLANNER_TIMEOUT acceptance and rejection of planning MODEL_TIMEOUT, and uncached legacy
marker refusal without migration. Preserved genuine DO cases cover deterministic
job/approval/dry-run/Execute/replay/clock, explicit soft E27 approval/no static inheritance,
accepted conflict against stale cache, CAS/auth/privacy, coalescing/cancel/expiry,
same-revision latest-pointer supersession, Reset-before-publication and rejected late
completion. Historical P1 hub test stays regression coverage, not an M1 blocker.

The harness already requests/asserts canonical functional-v2 at this exact launch;
the packet's historical create404 note did not apply and no catalog/v1 reopening occurred.
Pure immutable v1 policy fixtures remain. Two helpers performed bounded read-only audits/
transition review without writes or another matrix. Final review found no owned transition
blocker; central/source dependencies are qualified below.

## Real HTTP smoke

Started only own localhost server on assigned port8786:
`CI=true WRANGLER_SEND_METRICS=false node apps/api/node_modules/wrangler/bin/wrangler.js dev --config apps/api/test/planning/wrangler.planning.jsonc --local --ip 127.0.0.1 --port 8786 --persist-to .wrangler/planning-m1-wire-smoke --log-level warn`.
Ran `bun apps/api/test/planning/runtime-smoke.ts`, then stopped that server.
No credentials were printed or saved to report; actual synthetic session tokens stayed
in memory. New M1/v2 session -> real deterministic job -> human decision -> dry-run ->
atomic Execute -> exact replay -> policy advance -> actual completion -> incident/impact.

```json
{
  "incidentRecorded": true,
  "runtime": "actual local Hono/SQLite DO HTTP",
  "planner": "actual deterministic bounded search; no model transport",
  "contractVersion": "0.5.0-m1",
  "scenarioVersion": "2",
  "plannerMetadata": {
    "kind": "deterministic",
    "algorithm_version": "deterministic-bounded-v1",
    "config_hash": "b742a1cb19b5910b3c7dab0df83e18e2d4e52d509888e7c4767590487620cc39",
    "search_limit": 16
  },
  "jobStatus": "completed",
  "proposalStatus": "ready",
  "executeReplaySameId": true,
  "executeRevision": 1,
  "advancedTo": 3.1,
  "predictedCriticalCompletion": 3,
  "actualCriticalCompletion": 3,
  "qualification": "Local M1 planner wire/runtime smoke; central legacy fences, Sources migration and full web/native acceptance remain separate."
}
```

## Remaining integration blockers and action states

1. **Typecheck/Source serialization — blocked by producer.**
   Target packages/domain/src/reporting/submit-report.ts:14; Sources owner must add
   receipt-bound reward/review_result_id/reviewed_at under its current receipt.
   Standard types fail at that exact external site. No out-of-scope edit attempted.

2. **Planning expiry lease/SSE code — pending owner correction.**
   Target apps/api/src/session-runtime/leases.ts generic planning branch currently sets
   lease/error/event reason MODEL_TIMEOUT. The owned job hook now returns PLANNER_TIMEOUT,
   but cannot mutate the generic lease/event through its values-only port.
   Lead/SessionPlatform must change the planning branch to PLANNER_TIMEOUT.
   Ordinary explicit completion events are already corrected in this source.
   No central workaround or fake SSE pass.

3. **Generic serialization fence — pending published platform port.**
   Exact launch RuntimeRegistry has no serialization fence property; platform replay
   precedes reducer execution. The owned marker guard proves uncached refusal only,
   not rejection of old cached wire outcomes or all generic callbacks. SessionPlatform
   must publish and Root compose a pre-replay/read/callback fence for m1-v1/0.5.0-m1,
   preserving exact valid-new-wire replay-before-CAS. No invented WIP interface,
   old-data rewrite or claim of full legacy replay isolation.

Those actions were not attempted out of scope and have no uncertain mutation outcome.
No owned implementation blocker remains. Full combined backend/web/native/report/review/
points/photo acceptance still needs owner integration; this is not a full M1 gate.

Automatic approval review denied an initial broad edit command that would delete
OpenAI adapter/legacy modules, citing conflict with OpenAI backend requirements and
insufficient deletion authorization. **That command did not execute.** The accepted
safe alternative preserved every adapter/module, made additive M1 contract fixes, and
asserted disabled operational tools/controller before any transport. No deletion retry,
bypass, permission request or approval action remains pending. An initial test run then
exposed legacy disabled-getter timer rejections; moving the canonical registry refusal
before timer allocation resolved them, and the final112 tests passed.

## Scope and handoff

Source C then report-only direct child; return delivery SHA out of band.
No central manifests/lock/config/APIindex/schema/fixture/policy/gate writes, no other
owner edit, no main/integration promotion/push/deploy, no Claude contact/launch,
live provider/model/paid/credential/account/resource/device/SDK/EAS/store action.
OpenAI integration files were preserved and unchanged. Source modules stay below200 lines.
Parent requested sol/ultra/fast; runtime model/tier introspection is unavailable and
not claimed. Optional polish/global optimization/M2 extensions remain deferred.

## SourceEvidence

```json
{
  "work_item_id": "planner-safety-m1-runtime-v5",
  "role_id": "planner-safety",
  "base_sha": "2a440311b4a8a78f1dc3303e7aa9c8c35d097f40",
  "observed_launch_sha": "c30dd59defde31e222e4a52416ad3e6f553d0bb0",
  "status": "code-ready-for-integration",
  "contract_sha256": "90e923e9a92af548aefa38975eb3d177805521862ff68b7b16a423903eff82cd",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a",
  "source_sha": "e8275f527cf2accb3464fd1f8fcd9772eb704740",
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-m1-runtime-v5.md"
    },
    {
      "command": "bun test apps/api/test/planning apps/api/test/policy",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-m1-runtime-v5.md"
    },
    {
      "command": "node node_modules/vitest/vitest.mjs run --config apps/api/test/planning/vitest.config.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-m1-runtime-v5.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/planning/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "fail",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-m1-runtime-v5.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p packages/domain/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "fail",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-m1-runtime-v5.md"
    },
    {
      "command": "bun --bun run eslint packages/domain/src/planning apps/api/src/features/planning apps/api/src/features/operations apps/api/src/features/incidents apps/api/src/integrations/openai apps/api/test/planning apps/api/test/policy --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-m1-runtime-v5.md"
    },
    {
      "command": "git diff --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-m1-runtime-v5.md"
    },
    {
      "command": "git diff --cached --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-m1-runtime-v5.md"
    },
    {
      "command": "bun apps/api/test/planning/runtime-smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-m1-runtime-v5.md"
    }
  ],
  "smoke": [
    {
      "scenario": "actual M1 HTTP deterministic plan/decision/dry-run/Execute/replay/advance",
      "observed_result": "0.5.0-m1/v2 planner metadata exact; search_limit16/config b742a1cb19b5910b3c7dab0df83e18e2d4e52d509888e7c4767590487620cc39; ready plan; Execute revision1/same replay; predicted=actual critical3.0; clock3.1; incident/impact/list valid.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-m1-runtime-v5.md"
    },
    {
      "scenario": "actual M1 terminal outcomes and no operational side effects",
      "observed_result": "13 genuine Workerd cases pass including NO_FEASIBLE_PLAN failed/nullplan/noPlan, no_change realemptyPlan, planner-vs-photo timeout distinction, uncached marker rejection and preserved policy/auth/idempotency/Reset guards.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-m1-runtime-v5.md"
    }
  ],
  "public_exports": [
    "createPlanningRuntime(options) => {registry,router,committedPolicy,planner:DeterministicPlannerMetadata}",
    "createCommittedMovementPolicy(context:TransitionContext,run:Readonly<SimulationRun>):SimulationPolicy",
    "Existing createPlanningServices/runDeterministicPlanner/searchLimits/PLANNER_VERSION and typed direct services retained"
  ],
  "integration_requests": [
    "Merge exact source/report delivery; Root compose registry/router/genuine committedPolicy and use planning.planner for algorithm/config/search metadata.",
    "Sources owner fix submit-report.ts required M1 Report fields, then rerun standard domain/API-scoped types.",
    "SessionPlatform/Lead fix generic planning lease/SSE watchdog MODEL_TIMEOUT to PLANNER_TIMEOUT.",
    "Publish actual pre-replay/read/callback serialization fence port, then issue fresh exact consumer continuation; do not invent RuntimeRegistry fields or reinterpret old DTOs.",
    "No provider/key is needed by planning; preserved OpenAI adapter must not be composed as an operational Commander."
  ],
  "blocked_prerequisites": [
    "Standard types FAIL only at external packages/domain/src/reporting/submit-report.ts:14, TS2739 reward/review_result_id/reviewed_at missing.",
    "Central generic planning expiry lease/SSE still MODEL_TIMEOUT at exact launch; owner correction pending.",
    "Generic platform pre-replay/read/callback serialization fence absent at launch; owned marker guard proves uncached requests only.",
    "Full combined backend/web/native/source-review-points/photo E2E not claimed."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "changed_paths": [
    "apps/api/src/features/planning/README.md",
    "apps/api/src/features/planning/commander.ts",
    "apps/api/src/features/planning/deterministic-types.ts",
    "apps/api/src/features/planning/drive-planning.ts",
    "apps/api/src/features/planning/index.ts",
    "apps/api/src/features/planning/internal-services.ts",
    "apps/api/src/features/planning/job-leases.ts",
    "apps/api/src/features/planning/job-transitions.ts",
    "apps/api/src/features/planning/runtime-state.ts",
    "apps/api/src/features/planning/runtime-types.ts",
    "apps/api/src/features/planning/start-job.ts",
    "apps/api/src/features/planning/tool-stops.ts",
    "apps/api/test/planning/commander.test.ts",
    "apps/api/test/planning/internal-services.test.ts",
    "apps/api/test/planning/jobs.workerd.ts",
    "apps/api/test/planning/m1-wire.workerd.ts",
    "apps/api/test/planning/runtime-smoke.ts",
    "apps/api/test/planning/runtime-unit-context.ts",
    "plans/reports/worktree-planner-safety-planner-safety-m1-runtime-v5.md"
  ]
}
```
