# M1 review runtime

`createSourceBackedReviewRuntime(ports, options)` consumes the public Source review, image preparation and normalized-media factories. Root supplies its genuine `scenarioCatalog`/`simulationPersistence`, merges the returned registry with Sources/other features, mounts `router`, and retains `sources.createSessionObject(combinedRegistry)` for durable media recovery. No central entrypoint is changed here.

Call `createReviewSeed(initialCoverage)` in the real seed loader. Compose `reconcileReviewGaps` inside source/advance transitions after deriving time/epoch/knowledge, with the matching event sequence. Accept and conflict resolution commit reports, observations, knowledge, gap history, normalized photo claims, optional awards and audit atomically. Reject uses `operational:false, requireCas:true`; it requires atomic If-Match while preserving operational revision. Exact replay remains Session-owned.

`ReviewOptions.resolveRewardPolicy` receives only the receipt's exact ID/version/hash. `prepareRewardPolicy` validates and hashes an explicit archived payload with `basis:per_report`, positive points and eligible source IDs; it defines no production amount. The resolver's returned payload is rehashed before use. Root/Source must retain every pinned payload through the session lifetime. Null receipts skip resolution, remain `pending_config`, and never gain later configuration or retroactive awards. Missing/corrupt nonnull archives grant no points and do not block otherwise valid evidence; current wire represents that no-award result as `ineligible`, so dangling pins must be prevented by retaining the archive. Human result ID/time and immutable policy bind each award.

Source-backed image POST prepares its binding through the real authenticated Source port before reserve. Environment-bound media/provider factories stay server-only. The service verifies actual normalized bytes/digest/context and starts durable provider budget immediately before one provider call. Pre-start failures use the integrated `imageReview.failQueued`; manual review, Reset, deadline and latest-job fences remain authoritative. Only a new reservation effect schedules work; leases are stripped from HTTP output. Missing providers fail closed, manual review stays available, and advice never changes knowledge or rewards.

`createResponsesImageReviewPort` targets the fixed OpenAI Responses endpoint with strict model-only output, no tools, bounded bytes/time and no retries. No live provider calls or credential setup are included.

## Runnable demo reward assumption
The root demo loads `data/policies/demo-reward-policy-v1.json`, explicitly marked `documented_assumption` with `calibration: incomplete`.
It awards 3 simulated points per accepted citizen photo report that first fills an open gap from the configured community source `src_citizen1`.
The immutable reward-policy reference is SHA-256-derived from the strict policy payload and is pinned on each report at receipt.
Set `DEMO_REWARD_POLICY_ENABLED=false` to disable the demo policy; malformed policy data also fails closed.
Reports received without valid configuration remain `pending_config` forever, but manual review and knowledge commits remain available.
M1 free reports need no mission, and AI photo advice never changes points.
These placeholder points exist only in a simulated ledger: no payout and no real-world value.
