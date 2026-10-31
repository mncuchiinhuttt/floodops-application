# Synthetic functional scenario v1

This is an original project-authored fixture. The coordinates sit inside a TP.HCM coordinate
envelope but do not identify a measured road network. Segment aliases E17/E21/E27 are illustrative.
All geometry/travel/service/demand/capacity/SLA/TTL/location values are explicitly assumed;
calibration is incomplete. There is no holdout, real source licence snapshot, field measurement,
vision evaluation, production permission or real-world performance claim.

`manifest.json` is the frozen executable bundle. Its canonical wire entities use opaque IDs;
`aliases` maps illustrative edge names to those IDs. It contains six nodes, twelve directed
segments, two drivers, three differently sized orders, two hubs, canonical source profiles,
31 observations, context measurements and vehicle-scoped fixture road changes.

`@floodops/test-fixtures` exports the authoring factory `createFunctionalScenario` and the
T01–T15 boundary catalog. Authoring uses `sealScenarioDraft(draft, sha256)` explicitly, followed
by `loadScenario(sealed, sha256)`. Runtime loading verifies content hashes; it never repairs
unsealed or modified data. A changed dataset requires a new version and new hashes for every
comparison branch. No external URL is fetched by the loader.

Travel window semantics are `[valid_from, valid_until)` with constant duration. Each allowed
vehicle has complete nonoverlapping FIFO windows through H. Internal time is integer milliseconds;
wire values remain fractional minutes. Geometry lengths are calculated over all polyline vertices
with a spherical mean radius, with the explicit assumed `geometry_tolerance_m` parameter.

Hub capacity has explicit absolute windows in `hubWindows`; each window spans the canonical
`capacity_window_minute`. There is no inferred rolling or periodic refill. Pickup consumes demand
within that authored window and removes availability from every alternative hub. New real scenarios
must supply their own approved windows/operational basis. Pickup service is resolved by frozen
`pickup_service:<order_id>:<hub_id>` parameters, never a caller-chosen stop ID or duration.

The three context measurements include rain in mm and tide heights in m with missing/different
datums. They remain context, do not become street depth and do not change segment knowledge.
Precomputed accepted knowledge is internal fixture data; SourcesMedia owns runtime normalization
and derivation, ReviewRewards owns manual review/rewards, and PlannerSafety owns bound approvals
and atomic Executor composition. The simulator does not accept public raw reports as authority.

Run `bun packages/simulation/test/scenario/scenario-smoke.ts` from the worktree root for the actual
closure → projection → separate executed candidate → movement → H metrics path. Run
`bun test packages/simulation/test` for owned boundary cases. These are deterministic algorithm
and fixture checks, not application/Worker/native/model or D04 acceptance.

`synthetic-report.png` is a 64×48 original procedural geometric PNG (187 bytes), with no EXIF or
real-scene claim. Its frozen SHA-256 is in `config.fixture_assets`. `createReportCases` exports
canonical fresh/duplicate/expired/contrary-closure citizen inputs plus a conflicting driver input.
The duplicate uses the same photo ID/bytes. These inputs support later media/review/reward tests;
byte metadata/schema checks do not establish normalization, reward exactly-once, vision quality or
permission behavior. Those owners must run their actual implementation paths.
