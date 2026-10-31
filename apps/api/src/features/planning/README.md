# Deterministic M1 planning core

Public constructor: `createPlanningRuntime<State>({persistence, search?, deadlineMs?, observationProposal?, validateCause?})`.
Returns `{registry, router, committedPolicy}`. No model/provider/key is needed. Legacy provider/model
options are ignored; the public planning entrypoint does not import/export the OpenAI adapter or Commander.
Historical controller/provider tests remain isolated regressions, not an M1 runtime path.

IntegrationLead composition:

```ts
const planning = createPlanningRuntime({ persistence: simulationPersistence });
const simulation = createSimulationRuntime({
  persistence: simulationPersistence,
  committedPolicy: planning.committedPolicy
});
// Merge registry commands/views and compose both onLeaseExpired hooks.
// createSessionObject(registry); createApp([planning.router, simulation.router, ...], ports)
```

The genuine factory remains independently exported:
`createCommittedMovementPolicy(context: TransitionContext, run: Readonly<SimulationRun>): SimulationPolicy`.
It validates canonical Sources facts plus persisted execution/action/route grants. Proposed/approved
actions never authorize movement before Execute. Branch/driver/route/path/segment/vehicle/epoch/evidence/
expiry binding and hard/conflict guards remain. Static/reroute branches inherit no FloodOps soft grant.

## Search

`runDeterministicPlanner(context,run,jobId,planId,options,limits,{deadline,current,signal?})`
is independently usable; `createPlanningServices` exposes typed direct route/assignment/impact/feasibility/
snapshot/notification/observation services. No model-selected service invocation or driver text parser.
The legacy tool-session adapter is not imported by the M1 job.

Default bounds:16 evaluated candidate variants,8 drivers,16 unpicked orders,12 stops/driver.
Default durable deadline30s (hard cap60s). Hard caps:128 candidates,16 drivers,32 orders,24 stops. Bounds are validated and config-hashed with
algorithm version `deterministic-bounded-v1`, deadline and current contract version.
This is a finite rule search, not a global optimizer.

Drivers sort by stable ID; orders by tier, actual projected lateness descending, then stable ID.
Search considers existing-stop reroutes (combined and per-driver) and single unpicked-order
reassignment, without hub changes/defer. Three pickup-before-delivery insertion patterns cover append,
prepend and shared pickup/delivery work. Each variant evaluates strict and human-approval-risk routes.
Old-driver cleanup stays in the same dependency group. Whole-candidate physical/objective checks
apply; individually good routes are never merged without the combined gate.

Rank by actual lexicographic objective, then Ready before pending at equal objective, fewer actions,
then canonical source order/driver/stop/assignment IDs. Random job/route/action IDs never break ties.
Pending candidates use the server's actual soft projection and must satisfy POL05 without fabricated
approvals. A best soft candidate stays pending. No report means no automatic unknown-road authority.

Check durable currentness/cancellation/deadline between bounded evaluations and again before publication.
The single-attempt lease, generation/revision/current-pointer fence and atomic completion remain.
Internal SearchEvidence records selected structural key, evaluated count, bounds and truncation,
including driver/order/stop scope limits. Outcomes distinguish candidate, no_feasible_plan and no_change
(all work delivered). Neither empty outcome applies operations.

## Compatibility and safety

This receipt authorizes the internal algorithm before Contracts M1 refreeze. No new public DTO/status/
event field was invented. Current strict Plan/PlanningJob wire remains valid: empty results are represented
by a completed job with an empty blocked proposal; precise no_change/no_feasible_plan is retained in
private server search metadata until its new typed wire is published. Historical required job
model/model_config_hash fields hold algorithm version/config hash. Historical MODEL_TIMEOUT/
MODEL_INVALID_OUTPUT literals remain wire-compatible failure codes; no model is called.
Lead must adapt these fields/outcomes only after the new Contracts receipt.

Human decisions/dry-run are metadata-only. Execute rechecks current/latest/revision/closure/evidence/
physical/objective constraints inside the genuine DO transaction and writes assignments, routes, ETA,
grants, execution and notification previews atomically with one revision increment. Exact idempotency
replay precedes new eligibility checks. Retry metadata requests with the original If-Match because
the current private CAS envelope participates in the request digest. Driver reads expose own committed
routes only. Source normalization prevents stale high caches from masking accepted conflict facts.

Optional observationProposal/validateCause are real typed Source boundaries; missing producers fail
explicitly. Observation proposes only and never accepts/awards. Incident trigger uses effective frozen
road events only. Hub/defer regressions are retained as historical M2 coverage, not M1 search features.

Owned Workerd harness explicitly creates frozen functional-v2; immutable v1 remains in domain fixtures.
Tests separately exercise deterministic search (no transport), explicit unknown/low approval/Execute
guards, conflict, real movement, CAS/auth, supersession, replay and Reset. Central wiring and new public
M1 contract/browser acceptance remain IntegrationLead/Contracts/QA gates.
