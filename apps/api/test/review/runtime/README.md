# Review runtime v3 local harness

This feature-owned harness is installed under `apps/api/test/review/runtime/`. Root reviewed and adopted bounded helper candidates, then added atomic gap reconciliation to the clock fixture.

The harness uses real `createApp` HTTP creation, real SQLite SessionDO registry, public scenario sealing/loading/createRun/applyKnowledgeTransition and real proposeReportSubmission/acceptance. `SessionDO.install` prepares report binding SHA256 outside the transaction and retains the genuine initialized owner as original dispatcher submitter. Contributor entities are explicit synthetic seed roster entries. Both photo fixtures use the same original procedural PNG bytes/hash so duplicate checks exercise the real ledger.

`SourceReviewPort` is an explicitly declared synthetic test adapter. It persists canonical report/source state plus original participant, immutable captured epochs and t0 receivedAt. It is not a production SourcesMedia implementation or raw-media fallback. Test clock uses the public simulator with entry denied, not a route authorization grant.

`review.workerd.ts`: atomic Accept/exact replay/eviction, concurrent CAS, duplicate hash, late expiry, own dashboard/role scope, Reset, and deliberate Reject503.
`image.workerd.ts`: actual metadata reserve/start/complete, human-review late response, timeout/eviction, privacy, malformed output, queued failure gap, and actual image service through one explicit fake Responses transport using frozen synthetic PNG bytes. There are no live provider calls.

Expected execution once installed: `node node_modules/vitest/vitest.mjs run --config apps/api/test/review/runtime/vitest.config.ts` from the worktree root. The worker runs this harness after adoption; command results are recorded in SourceEvidence. All code files are under200 lines.

Current boundaries: Reject remains503CONFIG_INCOMPLETE until independent metadata CAS hook; image HTTP POST remains503CONFIG_INCOMPLETE until genuine failQueued hook. The direct successful service test requires no pre-start failure, never invents either missing hook, and does not claim complete Reject/image HTTP readiness. Durable/provider/device/calibration scope distinctions remain in final evidence.

Added MVP conflict case: a third real quick driver submission uses a synthetic driver source with the existing configured low profile. Driver impassable acceptance first fills the initial gap without reward; citizen normal acceptance creates unresolved evidence conflict; actual HTTP resolution keeps citizen and supersedes driver, awards exactly7 once, and exact replay preserves committed values.
