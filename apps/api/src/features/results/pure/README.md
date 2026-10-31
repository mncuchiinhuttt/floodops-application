# Pure results projection

`projectComparableResults({ sessionId, branches })` accepts explicit `{ branchId, run }` snapshots from the public simulator. Include static and FloodOps exactly once, plus optional reroute-only. It returns canonical `Results`; no I/O or state mutation occurs.

Snapshots must share run ID, scenario/version, frozen config/seed/graph/bundle identity, H, observation time, shared input state/log and pending target. Branch operation state remains independent. Original cohort, tier and SLA cannot change. Callers must supply server-authorized snapshots from one authoritative revision; this pure function does not authenticate or replace session revision checks.

Metrics reuse the public simulator after filtering branch logs. Delivery events, rather than projected ETA, establish completion. Before H, counts cover only `observed_until_minute`; `completed_at_horizon` is false. At H it records completion of the observation horizon even when orders remain unfinished. Baseline zero yields a null reduction ratio. Calibration comes from the simulator's evidence assessment, so synthetic fixtures remain incomplete.

Lead may import the local public `pure/index.ts` when runtime results adapters are authorized. This slice contains no router, advance job, durable lease, live model or D04 proof.
