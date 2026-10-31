# ResultsEvaluation partial source evidence

Work item `results-evaluation-domain-foundations-v1`, role `results-evaluation`, branch `feat/floodops-results-evaluation`.
Worktree: `/Users/vominhlong/seahackathon-worktrees/08-results-evaluation`. Status: **code-ready-for-integration for this partial only**.

Source commit C: `4bcdfded94eb7d3281f65cdc6d7d245a09d1fd69`. This report is the report-only child of C and does not identify its enclosing commit.
Base: `112d539da6cf36b2b08ff3499b5eb93416a73bb4`. Observed launch: `c2216f9610cb7fb6a71279e4357a70896f86fa3c`.
Receipt: `worktree-execution/launch/results-evaluation/results-evaluation-domain-foundations-v1.json` under the active plan. Approved amendment: `results-client-independent-foundations-v1`.

## Completed behavior

- Results adapter requires static/FloodOps once each and optional reroute-only. It rejects differing scenario/version, H/observation time, config/seed/graph/bundle identity, run/shared input state, missing branches and changed original order cohort/tier/SLA.
- Branch logs are filtered before the public simulator computes metrics. Observed deliveries remain separate from projected ETA; unfinished/unreachable counts and raw counts persist. Zero baseline gives a null ratio. Calibration is assessed by the simulator; synthetic fixture remains incomplete. Horizon completion can coexist with unfinished orders.
- Ten-trial aggregation validates unique IDs1-10 and frozen model config, retains failures/blocked plan audit IDs/nullable errors, and counts only valid first proposals. Nearest-rank p95 includes measured failed responses; any absent measurement makes it unavailable. No retries, clock/network/provider calls or state mutation occur.
- Feature-local public entrypoints and README files document consumers' server authorization/revision and execution-provenance obligations. No central config/dependency/API changes were needed.

## Actual validation

Bun version: `1.4.0`. Frozen install with lifecycle scripts disabled completed (1011 packages installed); manifest/lock remained unchanged.
Byte-safe startup verifier checked all **433** indexed artifacts at source commit, index commit, launch and working tree; policy/index hashes,4 required gate ancestors and7 metadata-only launch paths verified. Branch/launch/root matched and worktree was clean before implementation.

Focused tests: **29 passed,0 failed,85 assertions**,2 files. Strict scoped TypeScript and scoped ESLint both exited0. Executable smoke ran again on source C and passed. `git diff --cached --check` passed. Source signature verified successfully.

Read-only tester and reviewer independently checked the slice. Initial ES2023-array/type-test issues were fixed; failed records now preserve canonical audit IDs. Final review reported no residual findings. No full-repository suite, Workerd/API E2E, UI/device, real-model or calibration acceptance was claimed.

Smoke fixture identity:

- scenario/version: `scn_functional1` / `1`;H=20 minutes
- config: `2dfe0b778bab983d5621e07e249203e1fbb3db6f849369e560d7abacd9127f38`
- bundle: `42d25cad85adb3e11939b8496469f0b2ba7891003ae89d0be5049dd54fb7ec46`
- seed: `a5ed2d18708f37f1021225af64236140b32f43d19e902558b2f4bb9ebbdc56c9`
- graph: `a5bf0eb6d7e57bc3f80fd11571cf21d19d870da91d56cac34b62191859f2c86c`

Observed static/FloodOps results at H: critical late1,total late2,total delay21 minutes,unfinished2,unreachable2,blocked movement1,executed violations0. Reroute-only: critical late0,total late1,delay8,unfinished1. This is synthetic functional evidence, not a real-world KPI claim.

Deterministic evaluation smoke retained10 records,including a timeout without latency: valid first proposals9,p95=null,real-model=false. Its numeric latencies are synthetic test inputs,not provider measurements.

## Integration and remaining gates

The two public paths are listed in SourceEvidence below. Lead owns router/composition and any continuation receipt. No remaining blocker inside this pure partial; full runtime jobs/model/D04 prerequisites stay deferred as listed. This delivery grants no full phase08/results-ready/backend-ready/release gate.

Only12 owned source/doc/test files plus this report changed. No secrets,env copies,central/protected writes,push,main merge,deploy,provider/model/device or account/resource actions. Commit signing and identity configuration were preserved. Actual runtime model/service-tier fields were not exposed for independent verification; no settings were changed.

## SourceEvidence

```json
{
  "work_item_id": "results-evaluation-domain-foundations-v1",
  "role_id": "results-evaluation",
  "base_sha": "112d539da6cf36b2b08ff3499b5eb93416a73bb4",
  "observed_launch_sha": "c2216f9610cb7fb6a71279e4357a70896f86fa3c",
  "status": "code-ready-for-integration",
  "contract_sha256": "bf181e09bb24b462d22ca867a61ff42559d59a3b72d55c20222e08a6f234a688",
  "changed_paths": [
    "apps/api/src/features/evaluations/pure/README.md",
    "apps/api/src/features/evaluations/pure/aggregate-evaluation.ts",
    "apps/api/src/features/evaluations/pure/index.ts",
    "apps/api/src/features/results/pure/README.md",
    "apps/api/src/features/results/pure/comparable-snapshots.ts",
    "apps/api/src/features/results/pure/index.ts",
    "apps/api/src/features/results/pure/project-results.ts",
    "apps/api/test/evaluations/aggregate-evaluation.test.ts",
    "apps/api/test/metrics/project-results.test.ts",
    "apps/api/test/metrics/pure-results-smoke.ts",
    "apps/api/test/metrics/result-fixtures.ts",
    "apps/api/test/metrics/tsconfig.json",
    "plans/reports/worktree-results-evaluation-results-evaluation-domain-foundations-v1.md"
  ],
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-domain-foundations-v1.md"
    },
    {
      "command": "bun test apps/api/test/metrics apps/api/test/evaluations",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-domain-foundations-v1.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/metrics/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-domain-foundations-v1.md"
    },
    {
      "command": "bun --bun run eslint apps/api/src/features/results/pure apps/api/src/features/evaluations/pure apps/api/test/metrics apps/api/test/evaluations --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-domain-foundations-v1.md"
    },
    {
      "command": "bun apps/api/test/metrics/pure-results-smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-domain-foundations-v1.md"
    },
    {
      "command": "git diff --cached --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-domain-foundations-v1.md"
    },
    {
      "command": "git verify-commit HEAD (at source commit)",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/08-results-evaluation",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-domain-foundations-v1.md"
    }
  ],
  "smoke": [
    {
      "scenario": "Public functional fixture -> seal/load/create/advance to H20 -> public pure result projection; deterministic ten-trial aggregation with one missing-latency timeout.",
      "observed_result": "Static/FloodOps each critical_late=1,total_late=2,delay=21,unfinished=2,violations=0; reroute_only critical_late=0,total_late=1,delay=8,unfinished=1. Ratio=0; calibration=incomplete. Deterministic evaluation:10 retained,9 valid,p95=null,is_real_model=false.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-results-evaluation-results-evaluation-domain-foundations-v1.md"
    }
  ],
  "public_exports": [
    "apps/api/src/features/results/pure/index.ts: projectComparableResults, ResultsProjectionInput, ResultBranchSnapshot",
    "apps/api/src/features/evaluations/pure/index.ts: aggregateEvaluation, nearestRankP95, EvaluationAggregationInput"
  ],
  "integration_requests": [
    "Lead may consume the two feature-local pure/index.ts entrypoints when runtime continuation is authorized; no package or central export changes needed for this partial.",
    "Future results adapter must supply server-authorized same-revision snapshots; pure comparison is not an authorization/CAS guard.",
    "Future evaluation runner must independently collect exactly ten first responses under approved model/config/budget and retain failures; math aggregation does not establish provenance or independence."
  ],
  "blocked_prerequisites": [
    "Full runtime continuation awaits platform-ready, sources-ready, planner-ready, review-ready and backend composition. No routers, advance jobs, lease/watchdog or DO wiring authorized in this receipt.",
    "Real-model/K4 evidence requires separately authorized provider execution and independent ten-run rehearsal, including wall-clock accepted-report-to-displayed-plan and demo evidence.",
    "D04/T14 remains incomplete without real geometry/operational data, licences/provenance, frozen tolerances and independent holdout; functional fixture is synthetic."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "source_sha": "4bcdfded94eb7d3281f65cdc6d7d245a09d1fd69",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a"
}
```
