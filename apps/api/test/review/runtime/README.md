# M1 review local harness

Run `node node_modules/vitest/vitest.mjs run --config apps/api/test/review/runtime/vitest.config.ts` from this worktree.

The harness uses real Hono HTTP, SQLite SessionDO, public Root scenario catalog/persistence, public SourceReview factory, actual simulator and the Sources recovery wrapper. It arranges pre-existing canonical M1 report receipts, original initialized dispatcher/captured epochs, and explicitly normalized procedural PNG derivatives in local R2. The test policy is explicitly seven points per report, with its computed immutable payload hash. These arrangements do not prove report submission or normalization; no production fallback is supplied.

Image preparation calls the real authenticated Source preparation/media path and persists its digest. Provider tests use one explicitly fake OpenAI transport; no live provider or credentials are used. Tests exercise Accept/Reject, CAS/replay, duplicate image, driver/citizen conflict, expiry, Reset, privacy and advisory jobs including queued failure.

The rollout V3 Source submit producer lacks M1 fields and Source review apply still freezes the new human/reward fields. Genuine adapter tests expose that prerequisite rather than replacing Source writes. Execution results and runner limitations are recorded in the delivery report; this harness alone is not full M1 E2E.
