# ResultsEvaluation runtime foundations v2 — SourceEvidence

Status: **code-ready-for-integration for the assigned v2 slice**. No full phase08/results-ready/backend-ready/release gate is asserted.

- Role/work item: `results-evaluation` / `results-evaluation-runtime-foundations-v2`
- Worktree: `/Users/vominhlong/seahackathon-worktrees/08-results-evaluation`; branch: `feat/floodops-results-evaluation`
- Base: `223a58654210e934dfb1eda1092be33a7fdc30fe`; observed launch: `2364a58e271a738790fe2a70fd47f67ad0befb52`
- Source C: `87b17baec2472411627c26b2f878ed4c27db57ea`; report is its direct child and does not identify its enclosing commit.
- Receipt: active plan `worktree-execution/launch/results-evaluation/results-evaluation-runtime-foundations-v2.json`; amendment: `backend-repairs-client-runtime-v1`.

## Implemented behavior

Evaluation regression was reproduced test-first: a nonfailed invalid-first-proposal sample with MODEL_TIMEOUT previously aggregated successfully. A nonnull execution error now requires failed=true. Legitimate invalid first proposals without execution errors remain in the denominator. Measured failed latency remains included in p95; missing measurements remain null, never filtered or zero-filled.

The real clock feature contributes synchronous reducers, views, a router and a bounded asynchronous driver. After platform auth/replay/CAS, start atomically reserves secure lease material, active pointer, queued job and frozen pending target before async work. Random material never changes the public idempotency payload. Private execution material is stripped from all canonical HTTP responses.

Each chunk runs the public real simulator with an explicitly injected committed policy, atomically persists bounded event progress and updates clock/job/lease to the post-command revision. Its reducer independently checks nonce, lease/job status, deadline, generation, revision and current pointer even when the generic Call fence was omitted. Safe stable hash keys allow platform command validation and replay. Budgets are bounded; transport interruption leaves the durable checkpoint for watchdog/explicit resume.

Expired or superseded leases only update owned job metadata. Platform access/alarm reconciliation unlocks without moving time or changing revision. A fresh CAS request explicitly resumes exactly the persisted target with a new lease; old continuations remain denied. Results read the same persisted simulator state and bind session horizon, time, scenario/version and bundle before existing comparable branch projection. Missing committed policy is CONFIG_INCOMPLETE; there is no permissive production fallback.

## Actual verification

Startup verified all **654 raw-byte indexed artifacts** at source/index/launch, policy/index hashes,5 required gate ancestors, and15 metadata-only launch paths. Previous signed delivery was an ancestor of the exact launch. The clean worktree fast-forwarded preserving history; frozen Bun1.4.0 install with ignored lifecycle scripts completed (67 packages newly installed). No package/lock/config edit was made by this worker.

Final independent checks:

| Check | Result |
|---|---|
| Pure metrics/evaluation | 30 passed,0 failed,90 assertions |
| Simulation strict types | exit0 |
| Metrics/evaluation strict types | exit0 |
| Scoped ESLint | exit0,zero warnings |
| Actual local Workerd/SQLite | 11 passed,2 files,exit0;36.38 seconds |
| Executable public simulator/math smoke on C | pass |
| Staged whitespace/ownership/amendment scope | pass,21 source/doc/test paths |
| Source signature | verified |

Workerd config has remoteBindings=false, remote R2 disabled and only disclosed synthetic local test keys. The worker uses an explicit deterministic public simulator policy; this is not the unfinished production business policy. The final run had no warnings, uncaught errors or teardown interruption. Read-only reviewer reported no residual substantive findings.

Coverage includes actual HTTP202/background progression/clock/results, idempotent start and chunk replays, bounded checkpoints and DO eviction, stale CAS, bad nonce with omitted generic fence, superseded revision, old/new pointer isolation, access watchdog, actual DO alarm, explicit same-target resume with identical final event log, Reset/new generation, missing policy, role privacy and mismatched-H rejection.

Source-C smoke identity: scenario `scn_functional1` version1,H20; bundle `42d25cad85adb3e11939b8496469f0b2ba7891003ae89d0be5049dd54fb7ec46`; config `2dfe0b778bab983d5621e07e249203e1fbb3db6f849369e560d7abacd9127f38`; seed `a5ed2d18708f37f1021225af64236140b32f43d19e902558b2f4bb9ebbdc56c9`; graph `a5bf0eb6d7e57bc3f80fd11571cf21d19d870da91d56cac34b62191859f2c86c`. Synthetic fixture calibration remains incomplete. No real-world KPI, real-model or full main-scenario T01/K4 acceptance follows from these checks.

## Handoff and limitations

Public exports and exact registry/router requests appear below and in `apps/api/src/features/simulation/README.md`. No remaining blocker inside the assigned v2 code slice. The Lead-owned production composition and genuine Sources/Planner/Review policy integration remain pending; no action was denied or left with uncertain execution. Full evaluation/provider endpoints were not fabricated.

Only21 owned source/doc/test files plus this report changed relative to launch. No secrets,credential/env copies,central/protected writes,push,main merge,deploy,provider/model/device or account/resource actions. Signing and identity configuration were preserved. Actual model/service-tier settings were not exposed for independent verification.

## SourceEvidence

```json
{
  "work_item_id": "results-evaluation-runtime-foundations-v2",
  "role_id": "results-evaluation",
  "base_sha": "223a58654210e934dfb1eda1092be33a7fdc30fe",
  "observed_launch_sha": "2364a58e271a738790fe2a70fd47f67ad0befb52",
  "status": "code-ready-for-integration",
  "contract_sha256": "bda263b1d21bfa26994d857da94f97b8974a3cfee08059e805e889f765202527",
  "changed_paths": [
    "apps/api/src/features/evaluations/pure/README.md",
    "apps/api/src/features/evaluations/pure/aggregate-evaluation.ts",
    "apps/api/src/features/results/index.ts",
    "apps/api/src/features/results/runtime.ts",
    "apps/api/src/features/simulation/README.md",
    "apps/api/src/features/simulation/advance-service.ts",
    "apps/api/src/features/simulation/continue-advance.ts",
    "apps/api/src/features/simulation/index.ts",
    "apps/api/src/features/simulation/router.ts",
    "apps/api/src/features/simulation/runtime-types.ts",
    "apps/api/src/features/simulation/start-advance.ts",
    "apps/api/src/features/simulation/state.ts",
    "apps/api/src/features/simulation/views.ts",
    "apps/api/test/evaluations/aggregate-evaluation.test.ts",
    "apps/api/test/simulation/advance.workerd.ts",
    "apps/api/test/simulation/http.workerd.ts",
    "apps/api/test/simulation/runtime-fixtures.ts",
    "apps/api/test/simulation/runtime-worker.ts",
    "apps/api/test/simulation/tsconfig.json",
    "apps/api/test/simulation/vitest.config.ts",
    "apps/api/test/simulation/wrangler.simulation.jsonc",
    "plans/reports/worktree-results-evaluation-results-evaluation-runtime-foundations-v2.md"
  ],
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-runtime-foundations-v2.md"
    },
    {
      "command": "bun test apps/api/test/metrics apps/api/test/evaluations",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-runtime-foundations-v2.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/simulation/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-runtime-foundations-v2.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/metrics/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-runtime-foundations-v2.md"
    },
    {
      "command": "bun --bun run eslint apps/api/src/features/simulation apps/api/src/features/results apps/api/src/features/evaluations apps/api/test/simulation apps/api/test/metrics apps/api/test/evaluations --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-runtime-foundations-v2.md"
    },
    {
      "command": "bun --bun run vitest run --config apps/api/test/simulation/vitest.config.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-runtime-foundations-v2.md"
    },
    {
      "command": "bun apps/api/test/metrics/pure-results-smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-runtime-foundations-v2.md"
    },
    {
      "command": "git diff --cached --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-runtime-foundations-v2.md"
    },
    {
      "command": "git verify-commit HEAD (at source C)",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-runtime-foundations-v2.md"
    }
  ],
  "smoke": [
    {
      "scenario": "Actual local Workerd Hono router -> SQLite SessionDO -> durable reservation -> async bounded chunks -> canonical clock/job/results HTTP views.",
      "observed_result": "POST202 exposed only canonical AdvanceJob; real deterministic simulator reached H20, job completed, clock paused, results observed_until20/incomplete calibration/ratio0. Replays did not duplicate work and contained no nonce/execution material.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-runtime-foundations-v2.md"
    },
    {
      "scenario": "Actual DO bounded checkpoint/eviction/watchdog/access/alarm/explicit same-target resume/Reset and old-A/new-B pointer fencing.",
      "observed_result": "Interrupted/resumed simulator state and final event log exactly matched uninterrupted advance; expiry/alarm changed no simulation time or revision; stale lease/generation/pointer/revision/nonce paths denied; replacement generation started fresh.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-runtime-foundations-v2.md"
    },
    {
      "scenario": "Executable public pure-results smoke at source C; deterministic evaluation inputs.",
      "observed_result": "Static/FloodOps H20 each critical_late1,total_late2,delay21,unfinished2,violations0; reroute_only late1,delay8,unfinished1; calibration incomplete. All10 synthetic evaluation samples retained,9 valid,p95null,real-model false.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-runtime-foundations-v2.md"
    }
  ],
  "public_exports": [
    "apps/api/src/features/simulation/index.ts: createSimulationRuntime, driveAdvance, ADVANCE_START, ADVANCE_CHUNK, CLOCK_VIEW, JOBS_VIEW; SimulationRuntimeOptions, AdvanceMaterial, AdvanceReservation, ChunkInput, RuntimeDispatch types",
    "apps/api/src/features/results/index.ts: createResultsView, createResultsRouter, RESULTS_VIEW, projectComparableResults and projection input types",
    "apps/api/src/features/evaluations/pure/index.ts: aggregateEvaluation, nearestRankP95, EvaluationAggregationInput (corrected execution-error consistency)"
  ],
  "integration_requests": [
    "Lead injects public SimulationPersistence plus genuine synchronous committedPolicy into createSimulationRuntime. Missing policy deliberately returns503 CONFIG_INCOMPLETE; do not use the test policy as production fallback.",
    "Lead spreads simulation.registry.commands/views into the DO registry, adds RESULTS_VIEW:createResultsView(persistence), and mounts simulation.router plus createResultsRouter() in createApp. Canonical mounted paths are simulation GET, advances POST202, advances/:id GET and results GET.",
    "Lead composes the single onLeaseExpired hook with Planning rather than replacing either owner hook. Pass values from preceding hooks; the advance hook touches only owned job metadata.",
    "Other operational feature owners must reject incompatible mutations while status=advancing. Generic platform auth does not enforce that business lock; any unrelated revision safely supersedes this bound advance lease but is not a substitute for all business command guards.",
    "Full evaluation runtime/provider and final full-results/backend gates need authorized integrated Sources/Planner/Review business ports and actual model/rehearsal evidence; none are fabricated here."
  ],
  "blocked_prerequisites": [
    "Pending: Lead-owned production registry/router composition and genuine committed-policy/business integration after Sources/Planner/Review predecessor gates. This slice did not edit apps/api/src/index.ts or central config.",
    "Pending: full real-provider evaluation/K4 rehearsal and D04/T14 source/licence/holdout evidence. No live provider/model, UI/device, deployment or release action authorized or attempted."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "87b17baec2472411627c26b2f878ed4c27db57ea",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```
