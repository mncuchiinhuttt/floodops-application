# Planner MVP runtime

Public constructor: `createPlanningRuntime<State>(options)` from this directory's `index.ts`.
It returns `{ registry, router, committedPolicy }`; the policy callback is also independently exported as
`createCommittedMovementPolicy(context: TransitionContext, run: Readonly<SimulationRun>): SimulationPolicy`.

Composition owned by IntegrationLead:

```ts
const planning = createPlanningRuntime({
  persistence: simulationPersistence,
  provider: reviewedServerProvider, // createResponsesProvider({apiKey: server secret}); no default transport success
  model: reviewedModel,
  modelConfigHash: reviewedCompleteProviderConfigHash,
  // Optional synchronous public Source adapters:
  observationProposal: sourceObservationProposal,
  validateCause: sourceCauseValidator
});
const simulation = createSimulationRuntime({
  persistence: simulationPersistence,
  committedPolicy: planning.committedPolicy
});
const registry = {
  commands: { ...simulation.registry.commands, ...planning.registry.commands },
  views: { ...simulation.registry.views, ...planning.registry.views },
  onLeaseExpired(snapshot, lease, now) {
    const values = simulation.registry.onLeaseExpired!(snapshot, lease, now);
    return planning.registry.onLeaseExpired!({...snapshot, values}, lease, now);
  }
};
// createSessionObject(registry); createApp([planning.router, simulation.router, ...], ports)
```

No central index/config/manifest was edited by this owner. Mounting this router supplies the15 frozen
incident/impact/planning/job/decision/dry-run/Execute/operations/route/execution/notification operations.
The registry uses planning.start/begin/complete/cancel/decide/dry-run/execute and planning.incident.trigger;
views are planning.state, planning.operations, planning.incidents, planning.impact, planning.routes.
Preserve other owners' views/hooks when merging.

The persistence port is the public SimulationPersistence. Current movement authority is derived from
canonical Sources facts and persisted committed execution/action grants, with exact session/generation,
branch/driver/route/runtime path/segment/vehicle/epoch/evidence/expiry checks. A new proposal/approval never
modifies it. Static/reroute branches have no inherited FloodOps grants. Unknown grants expire at the
existing scenario H; low evidence grants expire at min(evidence expiry,H). No road probability is inferred.

All proposal tools/gates normalize a detached cache from canonical source facts. Cached high confidence
cannot override an accepted conflict. Metadata decisions/dry-runs do not change revision or operations.
Execute rechecks selected dependency closure/latest IDs/physics/objective inside the actual DO transaction,
then writes route/assignment/defer/ETA/grants/previews/execution together with one revision increment.

The platform currently checks CAS only for operational reducers. Metadata wire If-Match is therefore
carried in a private server-generated RPC envelope and compared inside the transaction after replay.
It is not a new HTTP body field. Exact retries retain the original If-Match; a changed header changes
the internal request digest. An orthogonal platform requireCas flag can replace this adapter later.

A durable job reserves authority before asynchronous work. One persisted attempt claims it; duplicate
HTTP starts do not rerun the provider. Nonce/generation/revision/current-job/deadline fence completion.
Cancellation/watchdog never applies operations; an in-flight transport is bounded by its deadline and
cannot publish after cancellation/supersession. No automatic retry of external calls or auto Execute.

The strict controller exposes exactly C1's8 tools; final selection references only server-issued IDs.
It derives IDs/groups/stops/metrics/status from captured server state, not model assertions. Missing
model/provider fails MODEL_UNAVAILABLE; no canned production plan. Resource defaults20s/6turns/12calls,
caps60s/12turns/64calls. Supply a full reviewed modelConfigHash for real provider parameters; the default
covers model/runtime budgets/contract. The fixed Responses adapter uses store:false, bounded body/output
and AbortController. It makes no request until explicitly called by the configured service.

Source boundary: pure normalization/knowledge/reporting is integrated. record_road_observation requires
the typed observationProposal adapter and returns only a proposal; no report acceptance/award occurs.
conflict_resolved cause requires validateCause. Missing adapters fail explicitly. Full Source HTTP/media
composition still needs the producer's published port and fresh baseline. Incidents only trigger frozen
road events at/after their configured simulation time; cause/weather alone grants no road authority.
Rerouting a moving/servicing driver waits for a valid node boundary.

Verification:103 Bun tests (includes preserved domain coverage),7 actual Hono/SQLite DO Workerd tests,
standard domain/scoped runtime types+lint, and executable HTTP smoke at127.0.0.1:8786. The owned test
worker uses an explicitly declared deterministic provider transport, never a production fallback.
No actual model/vision/paid provider/device/calibration/full-source or full backend gate is implied.
The newer main PRD mentioned by parent has not been adopted; this source stays on the exact v3 receipt.
