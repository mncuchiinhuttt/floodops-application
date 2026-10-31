# Explicit clock/runtime contribution

Public composition:

```ts
const simulation = createSimulationRuntime({
  persistence: simulationPersistence,
  committedPolicy: (context, run) => committedPolicyFor(context, run)
});
const registry = {
  commands: { ...otherCommands, ...simulation.registry.commands },
  views: { ...otherViews, ...simulation.registry.views,
    [RESULTS_VIEW]: createResultsView(simulationPersistence) },
  onLeaseExpired: (snapshot, lease, now) => {
    // Compose with the planning owner hook; preserve values from the preceding hook.
    const values = otherExpiryHook(snapshot, lease, now);
    return simulation.registry.onLeaseExpired!({ ...snapshot, values }, lease, now);
  }
};
const RegisteredSessionDO = createSessionObject(registry);
// Lead mounts simulation.router and createResultsRouter() in createApp.
```

`SimulationPersistence` is the public server checkpoint port from `@floodops/domain/public-ports`. It must restore the validated immutable bundle and preserve other owners' values. `committedPolicy` is explicitly injected from committed authority, including independent branch semantics. It must be synchronous. No production fallback policy exists: start/chunk returns CONFIG_INCOMPLETE if unavailable. Test policies in test/simulation are deterministic adapters only.

Registry command names: `simulation.advance.start`, `simulation.advance.chunk`. Views: `simulation.clock`, `simulation.advance.jobs`; results view: `results`. The jobs view is dispatcher-only and contains canonical job DTOs, never nonce material. Clock is available to all canonical roles; results is dispatcher/viewer-only. These are internal server registry names, not new public APIs.

Mounted canonical HTTP routes:

- GET /sessions/:session_id/simulation
- POST /sessions/:session_id/simulation/advances -> 202
- GET /sessions/:session_id/simulation/advances/:advance_job_id
- GET /sessions/:session_id/results (from results factory)

The start payload remains exactly AdvanceInput, keeping platform idempotency digests stable. After server auth/replay/CAS, the synchronous reducer allocates secure material and persists lease, pointer, queued job and frozen pending target. Its private RPC result includes execution material so the async server driver can work; the HTTP router always exposes only canonical AdvanceJob. Never expose generic command RPC directly to clients or log the private reservation.

Each chunk synchronously runs a bounded number of real simulator event boundaries, atomically persists the checkpoint/session clock/job and updates lease to the post-command revision. Reducer checks nonce/generation/revision/current pointer/status/deadline even if a malformed internal Call omitted its generic fence. Driver keys are stable length-bounded safe hashes. Duplicate starts/chunks replay without repeated movement. No await or provider/network work occurs inside reducers.

Default budgets:64 boundaries/chunk,32 chunks/driver turn,15 second lease. Configuration caps are256/128/60 seconds. The deadline is not extended by chunks. If the bounded driver stops or transport is interrupted, the checkpoint remains durable. Alarm or authorized access reconciles an expired lease to failed/unlocked without changing simulation time or revision. A fresh CAS POST explicitly resumes the exact pending target with a new job/lease. A different pending target is rejected. No alarm advances time, auto-resumes work or invents completion.

Generic platform authentication still permits some other owners' operational commands while advancing. Those owners must reject incompatible mutations using the active advance lock; an unrelated revision supersedes this bound lease. Lead must compose all owner hooks/commands, rather than claim full business readiness from this contribution.

Local actual Workerd coverage uses an owned SQLite DO worker/config and explicit public-simulator policy: reservations, bounded checkpoints, eviction, idempotency, bad nonce/missing generic fence, revision/current-pointer fencing, watchdog/access/alarm, explicit resume, Reset, canonical HTTP202/background progression, privacy and role/H guards. It is not full Planner/Review integration, model/K4/D04, UI/device or production evidence. Evaluation runtime/provider endpoints remain gated on their authorized prerequisites.


## Atomic post-advance reconciliation

Optional `afterAdvance({context,run,values})` is a synchronous values-to-values port, called after bounded simulator work and proposed persistence/job/lease construction but before platform commit. Context already has proposed time, post-command revision, status, pointer and lease, with the same proposed values/run. Deeply frozen inputs prevent mutation. Root can inject real Source/Review expiry-gap reconciliation; this module copies none of those business rules.

Return all existing namespaces. Undefined values, namespace removal/nulling, Promise results or changes to simulation checkpoint, advance job state or runtime_contract are rejected. Hook cannot return revisions, pointers or leases. A thrown/invalid/async hook aborts the entire transaction; successful reconciliation shares exactly one revision increment. Retry remains idempotent. No reconciliation is performed on failed/expired old continuations or Reset replacements.
