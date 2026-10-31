# M1 deterministic evaluation aggregation

`aggregateEvaluation` accepts exactly ten unique trial IDs1-10 at one explicit frozen `plannerConfigHash`; records use canonical `planner_config_hash`. Kind is `deterministic_replay` or `latency_rehearsal`; `isRealModel` and serialized `is_real_model` are false-only. Legacy model_quality/model_config_hash and real-model claims are rejected, never upgraded or reinterpreted.

All failed/invalid first proposals remain in the denominator. A nonnull execution error requires failed=true; legitimate invalid first proposals without an execution error remain representable. Failed samples retain nullable errors and blocked plan audit IDs. Caller arrays are unchanged.

Nearest-rank p95 uses ceil(.95*n); ten finite samples yield their maximum. Measured failed responses remain included. Any missing latency makes p95 unavailable, never zero or a percentile over favorable samples. These pure operations do not establish replay independence, measured wall-clock provenance or M1 acceptance.

No provider, model, pilot, forecast, retry, budget spending or fabricated benchmark runs occur. The eventual authorized deterministic runner supplies genuine independent records and config identity; this module does not substitute a test adapter for that runner.
