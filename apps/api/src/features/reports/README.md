# Canonical Sources review adapter

`createSourceReviewPort({scenarioCatalog, simulationPersistence})` from `reports/index` implements the public Review-owned `SourceReviewPort`. Inject this same port into `createReviewRuntime`. It reads the genuine current-generation report receipts, frozen relevant scope, current knowledge/evidence and stable conflict occurrences. Review context reconstructs the original authenticated submitter, original receipt time, bound vehicle scope, source and captured epochs. The current dispatcher authorizes review separately.

`apply` is a synchronous full-values proposal. It validates immutable receipt facts and unchanged authoritative pair epochs, reconciles current evidence, applies the public Simulation transition and preserves upload/recovery/receipt metadata and unrelated namespaces. It writes no ledger or review audit. Review combines the returned values and its ledger/audit in one registered DO transaction. Source-owned `sourceReview` stores conflict history and prepared image bindings; Reset replaces this state with the genuine seed.

Image metadata remains usable for accepted reports so explicit conflict resolution can assess rewards. A later duplicate receipt does not retroactively poison the first original. Duplicate/readiness/hash facts come from owned normalized uploads and original server receipts.

For advisory preparation, inject the PUBLIC Review functions without copying their context rules:

```ts
const options = { config: imageConfig, prepare: prepareImageReviewBinding, contextKey: imageContextKey };
const preparation = createSourceImagePreparationRegistry(ports, options);
const prepared = await prepareSourceReviewImage(env, options, authenticatedContext, reportId);
const media = createSourceImageReviewMediaPort(env, options);
```

Merge `preparation.commands/views` with Sources and Review registries; retain `sources.createSessionObject(combinedRegistry)` for durable media recovery. The async helper authorizes a full canonical report projection, verifies real private normalized bytes, computes the canonical Review SHA outside the transaction, then persists via a dispatcher-authenticated metadata command. The synchronous reducer independently verifies SHA-256, exact current report/generation/hash/model/context before attachment. No public route or DTO is added. The real media port returns bytes bound to the persisted job digest and reauthorizes after awaits; it rejects changed generation/config/digest, duplicates, abort and unauthorized actors. Existing Node crypto compatibility is required, as already used by the central frozen catalog.

M1 uses explicit manual review. These seams make no provider call or entitlement claim. Review owns job policy, rejection CAS, advisory lifetime, decisions, points and audit. The old wire remains until Contracts publishes the PRD v0.5 policy cutover: reward policy/version must be pinned at receipt, missing policy must keep eligibility pending_config without blocking manual knowledge commit, and no newly configured policy may retroactively award old reports. Do not add unknown strict DTO fields or invent zero points here.

Integration follow-ups: Review-owned source/clock composition must reconcile gap occurrences when a deterministic quick driver acceptance changes coverage; SourceReviewPort does not mutate reward ledgers. The separate Review/platform metadata-CAS and queued-failure hooks remain owner work. Full backend/frontend acceptance and gate publication belong to Lead.

Run `bun --bun node_modules/vitest/vitest.mjs run --config apps/api/test/media/vitest.review-adapter.config.ts` for real functional-v2 Sources upload → manual Review → persisted Simulation, conflict resolution, CAS/replay/expiry/captured epoch/Reset and prepared-image fences. Synthetic local images and explicit test points are not a real provider/calibration/policy acceptance claim.

## M1 receipt policy serialization

SourcesPorts now accepts an optional synchronous server-only `receiptRewardPolicy(context): RewardPolicyRef | null`. Public types `ReceiptPolicyContext` and `ReceiptRewardPolicyProvider` are exported by `scenario/index`. Context contains sessionId, generation, scenarioId, scenarioVersion, receivedAt and kind. Inject the same ports into Sources and the review adapter. No provider means a valid free report with reward `{status:"pending_config",policy:null,reason_code:"POLICY_NOT_CONFIGURED",award_id:null}`. Report review identity starts null; no mission or numeric amount is required.

Root may supply a reference only from an explicitly configured retained policy registry that Review can resolve by policy_id+version+config_hash. Sources does not guess points or read a global latest policy during review. Configured citizen receipts await review; configured driver receipts are ineligible for community awards. Missing-config drivers use pending_config because the current strict ineligible schema requires a configured reference. Submission clones the validated reference. Both report reconstruction and later source proposals use the stored reference; policy-null is permanent. The adapter calls the canonical receipt-policy invariant, preserves terminal review identity, checks report/reward award equality and refuses driver awards.

Current runnable-demo decision: valid driver quick reports return201 pending_review with null review identity/time and no accepted observations, knowledge or award effects. Original driver/source/vehicle/capture/epoch and receipt policy remain stored for actual manual review. This temporary manual-review path deliberately replaces automatic quick acceptance for this demo; it is not proof that the original automatic flow is complete. The integrated M1 Review producer handles genuine human decisions; Sources does not fabricate review identity or weaken the strict schema.

`vitest.m1-receipt.config.ts` runs the real Sources-only functional-v2 SQLite/R2/Images harness. Its mutable test policy setup is explicitly test configuration, not a production registry or amount. `receipt-policy.test.ts` additionally proves a pure genuine knowledge proposal can apply with pending_config; its explicit human-result fixture does not claim HTTP Review success. No old stored session is migrated, reinterpreted or backfilled.
