# PlannerSafety deterministic M1 core — SourceEvidence

Work item `planner-safety-deterministic-core-v4`; role `planner-safety`.
CWD `/Users/vominhlong/seahackathon-worktrees/06-planner-safety`; branch `feat/floodops-planner-safety`.
Source C `7730846450b9dad2c1381b65555f3ba559c3c37c`; observed Git signature **G**.
Report-only direct-child delivery SHA is returned separately.

## Startup and authority

Exact launch `b686741d5b5273526f5eb5657a290c4df6fde746`;
BASE `afb8f9c167ce48d8886644af5a8b29899ee1446b`.
Receipt `worktree-execution/launch/planner-safety/planner-safety-deterministic-core-v4.json`;
amendment `m1-deterministic-cutover-v1`, pinned source PRD
`9036f6332f810eda5366dd63a60d4bb615f38374` (v0.5).
Explicit user/parent M1 scope supersedes historical full-roadmap/Commander requirements.

Verified clean own previous signed delivery, expected real worktree/branch, exact
receipt, BASE/launch and own-checkpoint ancestry, metadata-only BASE-to-launch,
all five gate ancestors and policy/index hashes.
All **721 indexed artifacts** matched raw bytes at source/index/exact launch:
**2,163 historical hash checks pass**.
Fast-forwarded preserving history only to the authorized exact launch.
`bun install --frozen-lockfile --ignore-scripts` checked1,102 installs/1,261 packages
with no changes. No main pull, reset, stash, rebase or moving sibling source.

Required ancestors: contracts `1f2b77e88be0a5ebd1644ad11c3cb5c3bfe5f5ca`;
simulation `30e058252d4176c76a8b17b40e25786f34b50b4c`;
bootstrap/policy `aea042b5fdb5100e826672111f326d3a03847ee7`;
plan `dee4dfb00af173eb3cccc2a0df75e67fa1577734`;
platform `3cebe9e8d8b4fd4fd11cd319b1549952c119caa5`.
These are existing prerequisites, not a newly refrozen M1 public-contract gate.
Index commit is BASE; exact hashes are recorded below.

## Delivered algorithm and runtime cutover

`createPlanningRuntime({persistence, search?, deadlineMs?, observationProposal?, validateCause?})`
returns `{registry,router,committedPolicy}`. **No provider/model/key prerequisite**.
The actual durable job calls `runDeterministicPlanner` and typed
`createPlanningServices` directly. The production planning entrypoint/job imports
neither Commander nor OpenAI adapter/model-tool definitions; its provider/model
legacy options are ignored. No driver free-text parser was introduced. A strict
unknown text field is rejected422 and cannot grant operational authority.
The historical Commander/adapter tests/files remain isolated legacy regressions;
integrations/openai was not edited and is not re-exported from the planning entrypoint.

Search version `deterministic-bounded-v1`:
- Default16 candidate variants,8 drivers,16 unpicked orders,12 stops/driver.
- Hard caps128 candidates,16 drivers,32 orders,24 stops.
- Explicit durable deadline30s, cap60s. Bounds/version/deadline/contract are config-hashed.
- Drivers sort by source ID; orders by tier, actual projected lateness descending, source ID.
- Consider combined/single-driver existing-stop reroutes, then bounded single unpicked
  reassignment with pickup-before-delivery insertion patterns. Breadth across pairs
  precedes another insertion pattern. Hub changes/defer are excluded from M1 search.
- Evaluate strict and soft-risk paths with real route/assignment/ETA/physics and the
  whole dependency group, including old-driver cleanup. No canned plan or global optimum.
- Rank real lexicographic objective, Ready before pending when equal, fewer actions,
  then canonical source driver/order/stop/assignment IDs. Minted job/route/action IDs
  never decide ties.
- Pending candidates retain pending status and must satisfy POL05 using their actual
  soft projection, without synthetic approvals.
- Check cancellation/current-job/deadline between candidates and again before publish.
  Preserve persisted single attempt, nonce/lease/revision/generation/latest-pointer fences.

Private SearchEvidence records selected structural key, evaluated count, bounds,
and truncation for candidate budget AND driver/order/stop scope bounds.
It distinguishes candidate, **no_feasible_plan within searched bounds**, and
**no_change** when work is already delivered. Neither empty outcome changes operations.
The no-change fixture is validated with actual validateOperations and correct delivered
custody/stock, rather than an inconsistent test shortcut.

The genuine public authority factory is unchanged:
`createCommittedMovementPolicy(context: TransitionContext, run: Readonly<SimulationRun>): SimulationPolicy`.
Pass it to Results simulation runtime. It derives canonical Source knowledge and
persisted executed-action/route grants with branch/driver/path/vehicle/epoch/evidence/
expiry binding. Proposals/approvals grant no current or baseline movement before Execute.
Human decision remains metadata-only. Atomic Execute and exact replay-before-new-
eligibility/CAS, latest plan/job, Reset and no hard-rule override remain intact.

Actual simulator duplication was removed without omitting validation: physical results
are cached only for the exact GroupSelection within one evaluation; ready assembly
uses its actual gate projection, while pending retains actual soft scoring. A search
reuses its captured internal-service session without merging candidate selections.
Independent read-only review found no safety blocker in this memoization.

## Wire boundary and public ports

Current valid strict wire is preserved until Contracts publishes M1 refreeze.
No new Plan/Job enum or response/event field was invented.
The old required job model/model_config_hash fields carry algorithm version/config hash.
Historical MODEL_TIMEOUT/MODEL_INVALID_OUTPUT wire failure literals remain compatibility
names; no model call occurs. Empty outcomes use a completed job with an empty blocked
proposal, with exact no_change/no_feasible_plan in private search metadata until
the producer publishes new typed outcome fields.

Public exports: createPlanningRuntime; createCommittedMovementPolicy;
createPlanningServices; runDeterministicPlanner; searchLimits; DEFAULT_SEARCH_LIMITS;
PLANNER_VERSION; PlanningSearchStopped; SearchLimits/SearchEvidence/DeterministicProposal;
existing planning command/view/dispatch ports.
Lead constructor example and limits are in apps/api/src/features/planning/README.md.
Optional Source observation proposal/cause validation ports remain typed, explicit and
fail closed when required; deterministic route search does not require Source writes.

## Actual verification

Bun1.4.0 application/tool checks; Node26.8.1 launches the documented Workerd tooling
exception. All commands use the CWD above.

- `bun test apps/api/test/planning apps/api/test/policy`:
  **110 pass,0 fail,272 assertions,9 files**, final14.70s.
  Includes preserved103 regressions plus7 deterministic tests: varied capacity,
  stable choices across jobs/reordered arrays, bounds, unsafe/no feasible, no-change,
  scope truncation and cancellation/deadline.
- `node node_modules/vitest/vitest.mjs run --config apps/api/test/planning/vitest.config.ts`:
  **9 pass,0 fail,2 files**, final20.63s. Actual Hono/SQLite DO, actual simulator/evaluator;
  no mocked successful plan/Execute and no provider transport.
- Standard domain tsc and owned planning/runtime test tsc: pass.
- Scoped ESLint for owned domain/planning/incidents/operations/planning/policy tests:
  pass, zero warnings. git diff and cached diff checks: pass.
- Public runtime creation uses frozen **functional-v2**, explicitly asserted in harness.
  Immutable v1 unit fixtures are preserved; production v1 creation was not reopened.
  V2 changes source/config/version, not existing route physics.

The9 Workerd cases preserve explicit soft E27 approval/Execute422/no pre-Execute effect,
then actual delivery2.75 and no static grant inheritance; provider-free planning,
CAS428/role403/text422/privacy401; same-revision supersession; exact Execute replay
after latest-pointer change; durable coalescing/cancel/lease expiry; real historical
P1 hub pickup/delivery/SLA regression; accepted conflict versus stale cached-high plus
non-overridable Execute422; actual deterministic job->manual approval/Execute->advance
matching projection; and Reset with unpublished actual search result rejecting old
completion410 while replacement generation1 restores seed and no old proposal.

Two helpers were read-only, not duplicate writers. They found/followed up no_change,
scope truncation, fixture validity and final cache/session safety. No remaining blocking
MVP source finding. Historical P1 hub test is retained M2 regression, not an M1 requirement.

## Actual localhost HTTP smoke

Started own local server:
`CI=true WRANGLER_SEND_METRICS=false node apps/api/node_modules/wrangler/bin/wrangler.js dev --config apps/api/test/planning/wrangler.planning.jsonc --local --ip 127.0.0.1 --port 8786 --persist-to .wrangler/planning-m1-smoke --log-level warn`.
Executed `bun apps/api/test/planning/runtime-smoke.ts`, then stopped that server.
New v2 session -> actual deterministic job -> manual decision -> dry-run -> atomic Execute
-> exact replay -> clock advance -> operations -> valid frozen incident/impact/list.
Credentials stayed only in memory and were not printed.

```json
{
  "incidentRecorded": true,
  "runtime": "actual local Hono/SQLite DO HTTP",
  "planner": "actual deterministic bounded search; no model transport",
  "jobStatus": "completed",
  "proposalStatus": "ready",
  "executeReplaySameId": true,
  "executeRevision": 1,
  "advancedTo": 3.1,
  "predictedCriticalCompletion": 3,
  "actualCriticalCompletion": 3,
  "qualification": "Local deterministic M1 core smoke; public M1 refreeze/full web acceptance remain separate."
}
```

The selected actual search result differs from the explicit E27 risk fixture because
the algorithm searches assignments/stops and ranks the actual objective. The separate
targeted E27 regression still verifies exact2.75 physics and mandatory approval.

## Recoveries and approval state

An initial parallel unit/Workerd run hit test timeouts under contention. Subsequent
serial checks found one real20s planning deadline failure. Duplicate projections were
removed, bounded search defaults reduced/breadth ordered, explicit durable deadline
set30s, and final unit/Workerd/HTTP checks above passed. Test harness allows60s per case
for cases creating multiple jobs; deadline/cancellation guards remain directly tested.
A new Reset regression initially parsed SessionCreatedResponse; corrected to the frozen
ResetResultResponse.replacement, without production change.

Automatic approval review **denied** an early proposed edit command targeting
apps/api/test/planning/mvp.workerd.ts because it removed an unapproved-Execute assertion
before adding equivalent coverage. That command did not execute. The safe alternative
kept the original422 assertion intact and supplied a genuine explicit softPlan helper;
it also kept conflict approval/Execute guards with a targeted motoPlan while a separate
test exercises unrestricted deterministic search. The replacement was approved and
executed. No permission request or denied operation remains pending/uncertain.
A restricted process-status read failed in sandbox; a permitted read-only inspection
confirmed only this task's process status. No process belonging to others was stopped.

## Handoff and remaining boundaries

Code-ready for this independent deterministic core. Lead must merge the exact signed
delivery, compose/mount the existing public planning registry/router and genuine
committedPolicy with Results, preserving other lease hooks. No provider configuration
or new paid secret is needed for planner. Full public M1 DTO/status/event adoption
still waits the Contracts owner/Lead controlled continuation; no moving contract was used.
Full browser/cookie/CSRF/source-media/review/points/E2E acceptance belongs to combined
M1 integration and is not claimed here. Wider search/global optimization, polish and
extended matrices are deferred under fast correct MVP scope. Native/campaign/student/
forecast and new hub/defer search are not M1 work.

No blocker remains for this authorized source slice. No central manifest/lock/APIindex/
Wrangler/policy/schema/fixture/gate change, no integrations/openai write, no source/main
promotion, remote push, deployment, account/key/resource/paid/model/device/EAS action.
Own source modules remain below200 lines. Parent requested sol/ultra/fast; actual runtime
model/tier self-introspection remains unavailable and is not asserted as evidence.

## SourceEvidence

```json
{
  "work_item_id": "planner-safety-deterministic-core-v4",
  "role_id": "planner-safety",
  "base_sha": "afb8f9c167ce48d8886644af5a8b29899ee1446b",
  "observed_launch_sha": "b686741d5b5273526f5eb5657a290c4df6fde746",
  "status": "code-ready-for-integration",
  "contract_sha256": "e7065b1e2a71db2d58a0dc4f5acf06c77026da1dee990c2678785589909b6777",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a",
  "source_sha": "7730846450b9dad2c1381b65555f3ba559c3c37c",
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-deterministic-core-v4.md"
    },
    {
      "command": "bun test apps/api/test/planning apps/api/test/policy",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-deterministic-core-v4.md"
    },
    {
      "command": "node node_modules/vitest/vitest.mjs run --config apps/api/test/planning/vitest.config.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-deterministic-core-v4.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p packages/domain/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-deterministic-core-v4.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/planning/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-deterministic-core-v4.md"
    },
    {
      "command": "bun --bun run eslint packages/domain/src/planning apps/api/src/features/planning apps/api/src/features/operations apps/api/src/features/incidents apps/api/test/planning apps/api/test/policy --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-deterministic-core-v4.md"
    },
    {
      "command": "git diff --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-deterministic-core-v4.md"
    },
    {
      "command": "git diff --cached --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-deterministic-core-v4.md"
    },
    {
      "command": "bun apps/api/test/planning/runtime-smoke.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-deterministic-core-v4.md"
    }
  ],
  "smoke": [
    {
      "scenario": "actual localhost deterministic Hono/SQLite DO HTTP",
      "observed_result": "Ready generated proposal; explicit manual decision/dry-run/Execute revision1; same execution replay ID; projected and actual critical completion3.0; clock3.1; frozen incident recorded and impact/list readable; no model transport.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-deterministic-core-v4.md"
    },
    {
      "scenario": "explicit server-computed E27 approval and conflict regressions",
      "observed_result": "Unapproved soft Execute422/no mutation, approved E27 real completion2.75/no static grant inheritance. Accepted moto conflict blocks explicit moto proposal and Execute even with approval despite stale high cache.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-deterministic-core-v4.md"
    },
    {
      "scenario": "actual deterministic result unpublished across Reset",
      "observed_result": "Genuine bounded search result from old job rejected410 at completion after Reset; replacement generation1 seed operations restored and old proposal list empty.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-deterministic-core-v4.md"
    }
  ],
  "public_exports": [
    "createPlanningRuntime<State>(options) => {registry,router,committedPolicy}",
    "createCommittedMovementPolicy(context: TransitionContext, run: Readonly<SimulationRun>): SimulationPolicy",
    "createPlanningServices<State>(context,run,jobId,planId,options)",
    "runDeterministicPlanner(context,run,jobId,planId,options,limits,{deadline,current,signal?}): Promise<DeterministicProposal>",
    "DEFAULT_SEARCH_LIMITS, PLANNER_VERSION, searchLimits, PlanningSearchStopped; SearchLimits, SearchEvidence, DeterministicProposal"
  ],
  "integration_requests": [
    "Merge exact C/R and compose planning registry/router plus genuine committedPolicy with Results, preserving other expiry hooks.",
    "Planner requires only genuine public simulation persistence; provider/model/key are not prerequisites and legacy options are ignored.",
    "Publish fresh M1 contract continuation before adopting new public outcomes/engine fields; existing legacy wire compatibility fields are qualified in README/report.",
    "Do not import/re-export historical Commander or OpenAI adapter into the M1 planning runtime."
  ],
  "blocked_prerequisites": [
    "No blocker remains for this independent deterministic algorithm/runtime slice.",
    "Contracts M1 refreeze and full combined web/browser/source-media/review/points E2E acceptance are separate pending owner gates; no M1-complete claim.",
    "Search is explicitly bounded, not globally optimal; M2 extensions and optional polish/matrices are deferred."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "changed_paths": [
    "apps/api/src/features/planning/README.md",
    "apps/api/src/features/planning/assemble-plan.ts",
    "apps/api/src/features/planning/commander.ts",
    "apps/api/src/features/planning/deterministic-planner.ts",
    "apps/api/src/features/planning/deterministic-types.ts",
    "apps/api/src/features/planning/drive-planning.ts",
    "apps/api/src/features/planning/index.ts",
    "apps/api/src/features/planning/internal-services.ts",
    "apps/api/src/features/planning/job-leases.ts",
    "apps/api/src/features/planning/job-transitions.ts",
    "apps/api/src/features/planning/runtime-types.ts",
    "apps/api/src/features/planning/search-candidates.ts",
    "apps/api/src/features/planning/start-job.ts",
    "apps/api/src/features/planning/tool-session.ts",
    "apps/api/test/planning/commander.test.ts",
    "apps/api/test/planning/deterministic.test.ts",
    "apps/api/test/planning/jobs.workerd.ts",
    "apps/api/test/planning/mvp.workerd.ts",
    "apps/api/test/planning/runtime-fixtures.ts",
    "apps/api/test/planning/runtime-smoke.ts",
    "apps/api/test/planning/runtime-worker.ts",
    "apps/api/test/planning/soft-candidate.ts",
    "apps/api/test/planning/test-provider.ts",
    "apps/api/test/planning/vitest.config.ts",
    "packages/domain/src/planning/evaluate-candidate.ts",
    "plans/reports/worktree-planner-safety-planner-safety-deterministic-core-v4.md"
  ]
}
```
