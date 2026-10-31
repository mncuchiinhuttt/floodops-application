# SourcesMedia phase05 factories

`createSourcesFeature({scenarioCatalog,simulationPersistence})` publishes `{registry,routers,createSessionObject}`. Lead merges registry commands/views with other producers, passes the COMBINED registry to `feature.createSessionObject(combined)`, exports that registered class as SessionDO and registers the six routers centrally. No feature imports the central app entrypoint. The recovery wrapper must be retained; plain createSessionObject would drop the media recovery alarm/table.

Owned HTTP operations (20): public scenario list/versioned configuration; session graph/configuration; source list/detail/events/replay; knowledge/observations/current restrictions/apply restriction fixture; reports submit/list/detail; media reserve/PUT/completion/read; immutable fixture read. Canonical66operations194schemas8tools are unchanged. Report review, conflicts and image-review jobs remain ReviewRewards-owned.

Frozen catalog and public Simulation persistence are injected. Checkpoints contain reference+mutable state, preserve unrelated values, and never duplicate graph/config. Views authorize first and return server-internal role-scoped data; routers select IDs and serialize only canonical DTOs. Driver knowledge uses their own vehicle/route scope; contributors see only their participant-owned reports/media. Viewer has no raw-report/media access. Binary responses retain Hono security/CORS middleware.

Source envelopes normalize dimension-preserving units and preserve provenance/datum, with exact frozen fixture/source/role binding. Context never grants depth/passability. Replays enforce CAS/idempotency, append an audit input without overwriting immutable frozen facts and reconcile through the real public Simulation port. Current restrictions contain only effective authority evidence with surviving vehicle scope. Missing history/profile/source/config fails explicitly; no client role or caption grants authority.

Report submission preserves original participant separately from selected simulated entity and checks actor-bound vehicles/entity, session/generation, original capture TTL, mapping and ready owned media. Capture epochs come from scenario initial state/events plus retained runtime epoch onsets; delayed evidence cannot inherit a newer epoch. Pending citizen reports do not mutate knowledge or award. Quick driver acceptance is deterministic, low/configured confidence and per-vehicle observation IDs, with no model or route execution. Text normalization has no enabled provider and returns needs_clarification/NEEDS_CLARIFICATION; no successful AI result is fabricated. Manual review/award orchestration belongs to ReviewRewards.

Public server image seam: `createNormalizedImagePort(env).read(SessionRequestContext,reportId)` and pure `normalizedImageBinding(snapshot,reportId)` from media/index. It returns only verified normalized bytes/hash/dimensions and minimal report context to an authenticated dispatcher. It reauthorizes pending state/generation/context after R2/Images awaits, rejects duplicates and never exposes quarantine/R2 URLs. ReviewRewards derives the full model/rubric/text input digest and owns provider enablement/consent/budget/job guards.

## Known integration prerequisites

- Exact M1 launch b686741 integrates frozen scn_functional1/v2 with a real configured driver Source. The new actual source-review Workerd harness proves genuine v2 deterministic quick acceptance, citizen contradiction and explicit human resolution. Historical v1 remains immutable and lacks the driver Source; no calibration is claimed.
- The v2 baseline integrates the exact SimulationData per-vehicle correction; source consumer tests cover shared flags, real bike conflict, known car, closure, explicit resolution and expiry without route/award effects. The temporary guard was removed only after this receipt cutover.
- Lead owns central router/class composition, config, manifests and gate publication. No feature gate, production Images entitlement, real provider/model/device, D04/calibration or release/security acceptance is asserted here.

## Verification

`bun test apps/api/test/sources apps/api/test/observations`

`bun --bun node_modules/vitest/vitest.mjs run --config apps/api/test/media/vitest.config.ts`

`bun --bun run tsc --noEmit -p apps/api/test/media/tsconfig.json`

The media harness uses real local Workerd, SQLite DO, separate private R2 bindings and local Images. Its synthetic test credentials/images are never production configuration. Tests inject controlled failures/history states for races; those do not claim another role's missing endpoint is implemented.

M1 review adapter: consume `createSourceReviewPort` and the authenticated image preparation/media factories from `reports/index`; see `../reports/README.md`. Full canonical source receipts are used, with atomic Review-owned ledger/audit commit and unchanged wire.

M1 receipt rollout: inject optional `SourcesPorts.receiptRewardPolicy` from explicit retained server config; omitted provider yields permanent pending_config/null policy and no award. New reports include canonical reward and null review identity until a genuine decision. See reports/README for exact provider shape and current quick-driver/Review M1 serialization blockers. This delivery does not publish a new gate or silently rewrite legacy sessions.
