# PlannerSafety MVP runtime — SourceEvidence

Work item `planner-safety-runtime-foundations-v3`; role `planner-safety`.
CWD `/Users/vominhlong/seahackathon-worktrees/06-planner-safety`;
branch `feat/floodops-planner-safety`.
Source C `958afd3718e4ea3e468ba959acb0afe5ceeed8ab`, observed Git signature **G**.
The report-only delivery commit is returned separately.

## Authorized baseline

Exact launch `3b37b97bed01f39eeec1d4201e12f2b12d30e266`;
BASE `c335056c7aec373ef5ebec2d66bd46ce820746a3`.
Receipt `worktree-execution/launch/planner-safety/planner-safety-runtime-foundations-v3.json`;
amendment `independent-business-runtime-v1`.
Verified clean own previous delivery, correct root/branch, BASE/launch ancestry and
metadata-only launch, all five receipt gate ancestors, pinned AGENTS/index hashes.
All **677 indexed artifacts** matched source/index/exact-launch raw bytes:
**2,031 historical hash checks**. All **677 checkout bytes** matched before mutation.
Fast-forwarded only to the exact launch; no moving main/integration source adopted.
Frozen Bun1.4.0 install with scripts disabled passed without manifest/lock changes.
Parent's later main PRD update is pending Lead's controlled amendment. After source C was signed, parent supplied verified main `9036f6332f810eda5366dd63a60d4bb615f38374`: M1 is web core with deterministic bounded search/stable tie-break. Runtime AI Commander, model driver-text parser and model-callable8 tools are removed from M1. Source C preserves the old authorized receipt checkpoint; its AI adapter/controller must not be composed for M1. No new model-path implementation followed this notice.

Required gate ancestors:
contracts `1f2b77e88be0a5ebd1644ad11c3cb5c3bfe5f5ca`;
simulation `30e058252d4176c76a8b17b40e25786f34b50b4c`;
bootstrap/policy `aea042b5fdb5100e826672111f326d3a03847ee7`;
plan `dee4dfb00af173eb3cccc2a0df75e67fa1577734`;
platform `3cebe9e8d8b4fd4fd11cd319b1549952c119caa5`.
Index commit is BASE. Exact index/policy hashes are recorded below.
No full Sources-ready gate is fabricated by this independent runtime authorization.

## Delivered behavior

The public factory `createPlanningRuntime<State>(options)` returns
`{registry, router, committedPolicy}`. The router implements the15 frozen
incident/impact/planning/job/decision/dry-run/Execute/operations/route/execution/
notification endpoints, with canonical request/response validation and actor scope.

**Immediate Results composition port:**
`createCommittedMovementPolicy(context: TransitionContext, run: Readonly<SimulationRun>): SimulationPolicy`.
Pass it to `createSimulationRuntime({persistence, committedPolicy})`.
It derives current knowledge from canonical Sources facts and grants from persisted
executions/actions/active route, bound to session/generation/branch/driver/route/path/
segment/vehicle/epoch/evidence/expiry. It composes the existing hard/conflict/expired
guards. Missing genuine configuration returns CONFIG_INCOMPLETE before advance.
Proposal or approval cannot authorize movement; only atomic Execute writes grants.
Static/reroute branches do not inherit FloodOps authority.

Durable jobs reserve private nonce/lease/current pointer before asynchronous provider
work; one persisted attempt claims execution. Coalescing, cancel, expiry, revision,
generation, latest-pointer and completion fences prevent stale publication.
The bounded strict Responses controller exposes exactly the8 C1 internal tools;
the model selects only server-issued IDs. Server code derives stops, groups,
route physics, metrics, status and approvals. No AI Execute/report-accept/reward tool.
Missing model/provider returns MODEL_UNAVAILABLE without mutation or canned success.
Provider deadlines cover transports that ignore cancellation.

Human decisions and dry-runs are metadata-only. Execute rechecks latest IDs,
dependency closure, current road evidence, physical/objective gates and CAS inside
the actual DO transaction, then commits assignments/routes/defer/ETA/grants/execution/
notification previews with one operational revision. Platform idempotency replay
precedes new eligibility. Exact retries preserve the original If-Match; the private
metadata RPC envelope currently includes it in the request digest. Driver route
reads expose only the own bound driver's committed route.

Impact projects actual committed operations and ranks tier/lateness/ID. Incident
trigger accepts valid frozen road events already effective at simulation time.
Weather/cause alone grants no road authority. Existing moving/servicing drivers
must reach a valid node boundary before replanning. Public Source adapters are typed
injected boundaries; no sibling WIP/deep import or asynchronous work in transaction.
`record_road_observation` proposes only; it never accepts/awards. Missing observation
or conflict-cause adapters fail explicitly.

The fixed Responses adapter uses store:false, bounded output/body, strict function
schemas and final selection JSON schema; no actual model call was made.
Shape checked against the official
[function-calling guide](https://developers.openai.com/api/docs/guides/function-calling)
and [Responses reference](https://developers.openai.com/api/reference/typescript/resources/responses).
It preserves output/reasoning and returns function_call_output per issued call.
The only deterministic provider is explicitly declared under test ownership.

## Findings repaired before checkpoint

1. A genuine server-issued soft route could silently be replaced by a strict detour
   and marked Ready. The evaluator now preserves pending approval for an exact
   validated soft path when strict differs. Arbitrary model route assertions still
   have no authority. Ready metrics use the actual gated projection.
2. Independent review reproduced a canonical-source conflict masked by stale cached
   high knowledge. Job capture, all tools, assembly and evaluation now normalize
   detached knowledge from Sources. A real DO regression persists contrary accepted
   observations while leaving the cache high: plan is blocked, approval cannot
   override POL03, Execute422 leaves operations/revision unchanged.
3. Read-only transaction/idempotency review found no remaining blocking MVP issue.
   A second read-only reviewer confirmed the conflict fix and unchanged input.
   No duplicate writer or weakened/deleted prior assertion.

## Executed verification

All commands used the worktree CWD above. Runtime checks used Bun1.4.0;
the documented Workerd tooling exception uses Node26.8.1 to launch Vitest/Wrangler.

- `bun install --frozen-lockfile --ignore-scripts`: pass.
- `bun test apps/api/test/planning apps/api/test/policy`: **103 pass,0 fail,245 assertions,8 files**.
- `node node_modules/vitest/vitest.mjs run --config apps/api/test/planning/vitest.config.ts`:
  **7 pass,0 fail,2 files**, actual Hono-to-SQLite DO, not a mocked successful Execute.
- `bun --bun run tsc --noEmit -p packages/domain/tsconfig.json`: pass.
- `bun --bun run tsc --noEmit -p apps/api/test/planning/tsconfig.json`: pass.
- Scoped ESLint for owned domain/runtime/provider/tests: pass, zero warnings.
- `git diff --check` and `git diff --cached --check`: pass.

The7 Workerd cases verify:
pending plan/read scope -> explicit approval without operations/revision change ->
dry-run -> atomic Execute -> exact replay -> real clock progression;
provider/config/auth/CAS failures; same-revision supersession; replay after newer
pointer and Reset credential fencing; job coalescing/cancel/deadline/late completion;
real P1 hub reassignment/pickup/delivery with original SLA; accepted-conflict cache
regression and non-overridable POL03.

Actual local HTTP smoke:
`CI=true WRANGLER_SEND_METRICS=false node apps/api/node_modules/wrangler/bin/wrangler.js dev --config apps/api/test/planning/wrangler.planning.jsonc --local --ip 127.0.0.1 --port 8786 --persist-to .wrangler/planning-smoke --log-level warn`,
then `bun apps/api/test/planning/runtime-smoke.ts`.
Server stopped after verification; credentials were kept only in memory, never printed.
Observed output:
```json
{
  "incidentRecorded": true,
  "runtime": "actual local Hono/SQLite DO HTTP",
  "providerTransport": "declared deterministic test transport",
  "jobStatus": "completed",
  "proposalStatus": "pending_approval",
  "executeReplaySameId": true,
  "executeRevision": 1,
  "advancedTo": 2.9,
  "actualCriticalCompletion": 2.75,
  "qualification": "Local MVP smoke; no real model, production, device or full-source integration gate."
}
```

## Integration and limits

No blocking source issue remains for the previously authorized MVP slice. M1 continuation is now pending the new controlled receipt/contracts. No action was denied or has an uncertain outcome. This is a preserved old-receipt checkpoint, not an M1/planner/backend/client/device/model/calibration acceptance gate.

For the old receipt the composition request was the exact delivery plus `planning.router` and registry commands/views, composed onLeaseExpired hooks, and the genuine committedPolicy factory to simulation. **Do not adopt the old model/controller composition for M1.** Lead should retain/review reusable policy, candidate, approval/Execute and internal route services under the new receipt. Detailed
constructor example is in `apps/api/src/features/planning/README.md`.
No central file change is requested from this owner.

Real server provider/model/complete modelConfigHash and public Source adapters remain
integration inputs; no live model/media call is authorized or claimed. Observation
proposal and conflict-resolved cause require their real producer ports. Full Sources
HTTP/media readiness still needs producer evidence and fresh full gate. New main PRD
delta waits Lead publication; this checkpoint does not silently adopt it.
M1 remaining work: replace model selection with deterministic bounded candidate search and stable tie-break, call internal route/candidate services directly from the durable job, and adapt endpoint/status/contracts to the new frozen M1 packet. The existing server compute-route/evaluator/assembly/approval/Execute logic is reusable; no deterministic global candidate selector is claimed yet. No M2 native/campaign/student work is included. Broader combinatorial matrices and polish are deferred under the fast correct MVP priority; live model/device/calibration checks are outside the new M1 task.

No central manifest/config/lock/schema/fixture/simulator/policy/gate change; no push,
main/integration promotion, deployment, account/key/resource/paid/provider/device/
EAS/store action. Own source/test modules remain under200 lines.
Parent requested sol/ultra/fast; actual model/tier self-introspection is unavailable.

## SourceEvidence

```json
{
  "work_item_id": "planner-safety-runtime-foundations-v3",
  "role_id": "planner-safety",
  "base_sha": "c335056c7aec373ef5ebec2d66bd46ce820746a3",
  "observed_launch_sha": "3b37b97bed01f39eeec1d4201e12f2b12d30e266",
  "status": "code-ready-for-integration",
  "contract_sha256": "b333867a263b3627da685a21f0e35da9b1baadfdafc0cc6f9d45d745d37d28fa",
  "policy_sha256": "b0aa40dfbdf06eb631670ec8db0108b87e0a41912de59624af84cff9c4d49b1a",
  "source_sha": "958afd3718e4ea3e468ba959acb0afe5ceeed8ab",
  "checks": [
    {
      "command": "bun install --frozen-lockfile --ignore-scripts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-runtime-foundations-v3.md"
    },
    {
      "command": "bun test apps/api/test/planning apps/api/test/policy",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-runtime-foundations-v3.md"
    },
    {
      "command": "node node_modules/vitest/vitest.mjs run --config apps/api/test/planning/vitest.config.ts",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-runtime-foundations-v3.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p packages/domain/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-runtime-foundations-v3.md"
    },
    {
      "command": "bun --bun run tsc --noEmit -p apps/api/test/planning/tsconfig.json",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-runtime-foundations-v3.md"
    },
    {
      "command": "bun --bun run eslint packages/domain/src/planning apps/api/src/features/planning apps/api/src/features/incidents apps/api/src/features/operations apps/api/src/integrations/openai apps/api/test/planning apps/api/test/policy --max-warnings=0",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-runtime-foundations-v3.md"
    },
    {
      "command": "git diff --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-runtime-foundations-v3.md"
    },
    {
      "command": "git diff --cached --check",
      "cwd": "/Users/vominhlong/seahackathon-worktrees/06-planner-safety",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-runtime-foundations-v3.md"
    }
  ],
  "smoke": [
    {
      "scenario": "actual local Wrangler Hono/SQLite DO HTTP, runtime-smoke.ts",
      "observed_result": "job completed; pending approval; human Execute revision1; exact replay same ID; actual clock2.9 and critical delivered2.75; valid frozen incident recorded and impact/list readable; declared deterministic provider transport.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-runtime-foundations-v3.md"
    },
    {
      "scenario": "actual Workerd P1 hub runtime",
      "observed_result": "real tools/job complete/approval/Execute/advance11; standard order picked up at hub_beta01 and delivered; original SLA12; static baseline stays unassigned.",
      "result": "pass",
      "evidence_path": "plans/reports/worktree-planner-safety-planner-safety-runtime-foundations-v3.md"
    }
  ],
  "public_exports": [
    "createPlanningRuntime<State>(options: PlanningRuntimeOptions<State>) => {registry,router,committedPolicy}",
    "createCommittedMovementPolicy(context: TransitionContext, run: Readonly<SimulationRun>): SimulationPolicy",
    "createResponsesProvider(options): CommanderProvider | undefined",
    "PlanningRuntimeOptions<State>, CommanderProvider, CommanderRequest, CommittedMovementGrant",
    "drivePlanning, PlanningReservation, PlanningDispatch and planning command/view constants"
  ],
  "integration_requests": [
    "Preserve this exact old-receipt source/report checkpoint; do not mount runtime AI Commander, provider, model parser or model-callable tools for M1.",
    "Reuse/review createCommittedMovementPolicy, pure evaluator, internal route/stops/assembly, human decisions and atomic Execute under the new controlled M1 receipt.",
    "M1 requires deterministic bounded candidate search with stable tie-break and direct internal service orchestration; no such selector is claimed in this checkpoint.",
    "Wait Lead controlled M1 contract/receipt for main9036f6332f810eda5366dd63a60d4bb615f38374; no blind main pull or overwrite."
  ],
  "blocked_prerequisites": [
    "M1 continuation pending Lead controlled cutover receipt/contracts; previous66operation/8tool packet is now legacy pending refreeze.",
    "Source C retains old-receipt model/controller/provider implementation as a signed checkpoint; it must be excluded/replaced for M1.",
    "Deterministic bounded search/stable tie-break selector and direct job orchestration remain to implement under the new receipt.",
    "Full Sources/backend composition remain separate integration inputs; no M1/full gate is claimed."
  ],
  "out_of_scope_changes": [],
  "unrequested_remote_actions": false,
  "changed_paths": [
    "apps/api/src/features/incidents/impact.ts",
    "apps/api/src/features/incidents/runtime.ts",
    "apps/api/src/features/operations/execute.ts",
    "apps/api/src/features/operations/projection.ts",
    "apps/api/src/features/planning/README.md",
    "apps/api/src/features/planning/assemble-plan.ts",
    "apps/api/src/features/planning/commander.ts",
    "apps/api/src/features/planning/committed-policy.ts",
    "apps/api/src/features/planning/decisions.ts",
    "apps/api/src/features/planning/drive-planning.ts",
    "apps/api/src/features/planning/index.ts",
    "apps/api/src/features/planning/job-leases.ts",
    "apps/api/src/features/planning/job-transitions.ts",
    "apps/api/src/features/planning/plan-command.ts",
    "apps/api/src/features/planning/plan-evaluation.ts",
    "apps/api/src/features/planning/router.ts",
    "apps/api/src/features/planning/runtime-context.ts",
    "apps/api/src/features/planning/runtime-state.ts",
    "apps/api/src/features/planning/runtime-types.ts",
    "apps/api/src/features/planning/snapshot.ts",
    "apps/api/src/features/planning/source-context.ts",
    "apps/api/src/features/planning/start-job.ts",
    "apps/api/src/features/planning/tool-session.ts",
    "apps/api/src/features/planning/tool-stops.ts",
    "apps/api/src/features/planning/views.ts",
    "apps/api/src/integrations/openai/index.ts",
    "apps/api/src/integrations/openai/responses-provider.ts",
    "apps/api/test/planning/commander.test.ts",
    "apps/api/test/planning/committed-movement.test.ts",
    "apps/api/test/planning/jobs.workerd.ts",
    "apps/api/test/planning/mvp.workerd.ts",
    "apps/api/test/planning/runtime-fixtures.ts",
    "apps/api/test/planning/runtime-smoke.ts",
    "apps/api/test/planning/runtime-unit-context.ts",
    "apps/api/test/planning/runtime-worker.ts",
    "apps/api/test/planning/test-provider.ts",
    "apps/api/test/planning/tsconfig.json",
    "apps/api/test/planning/vitest.config.ts",
    "apps/api/test/planning/wrangler.planning.jsonc",
    "packages/domain/src/planning/README.md",
    "packages/domain/src/planning/evaluate-candidate.ts",
    "plans/reports/worktree-planner-safety-planner-safety-runtime-foundations-v3.md"
  ]
}
```
