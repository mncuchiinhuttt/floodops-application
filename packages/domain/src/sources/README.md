# SourcesMedia pure foundations

This slice normalizes configured fixtures and proposes evidence/report transitions. It does not commit state, authenticate capabilities, review images, award points, Execute routes, or implement HTTP/media/provider services.

Public source entrypoint: `sources/index.ts`. Exports `normalizeInput`, `normalizeMeasurement`, `resolveReportLocation`, `distanceToPolyline`, time helpers, policy validation, typed environments and `SourceDomainError`.

`normalizeInput` consumes the strict canonical InputEvent schema and an explicitly injected server-frozen registry, policy parameters, graph, T0, clock and restrictions. The exact frozen fixture_event_id/source_id/role binding is checked. Available configured sources only; external text cannot supply policy, confidence, TTL, authority or role. Common envelopes support weather/tide/river/traffic/camera/driver/community. No outbound connector or URL fetch occurs. Unavailable sources produce `SOURCE_UNAVAILABLE`; unknown sources fail explicitly. Provenance labels must match the frozen source.

Units are dimension-preserving: rain mm/cm/m→mm; heights/depth m/cm/mm→m; discharge m3/s or m³/s and L/s→m3/s. Unsupported units fail. Unknown elevation datum remains null with UNKNOWN_DATUM; no datum conversion, elevation subtraction, street-depth or passability inference exists. Forecast time remains distinct from observed time. Time uses explicit T0 and original capture, with millisecond mapping, never an implicit clock.

Location uses WGS84 longitude/latitude and distance to minor great-circle road polylines on a mean-radius sphere. This is a deterministic mapping calculation, not GPS-spoofing resistance or calibrated survey accuracy. Server profile supplies tolerance; missing/ambiguous mapping needs clarification. Explicit segment selection must match the coordinate and vehicle access. No tolerance default is invented.

## Knowledge and review composition

Public knowledge entrypoint: `knowledge/index.ts`. `deriveCurrentKnowledge` and `deriveKnowledgeSnapshot` project accepted, available-source evidence at the authoritative segment/vehicle/epoch and original TTL. Different current conditions conflict regardless of source or recency. High, newest capture, then observation ID select consistent evidence. Active closures remain closed even during authority source outage; only effective configured reopening linked to the exact closure and received source event can lift one vehicle scope.

Use `reconcileEvidence(ALL_CURRENT_PAIRS, context)` before the public Simulation `applyKnowledgeTransition`: it returns both knowledge and derived observation conflict flags, including conflict expiry. Pass all authoritative pairs so multi-vehicle evidence cannot leave stale projections. Preexisting multi-vehicle observations with conflict in only some scopes currently fail explicitly with SOURCE_SCOPE_INCOMPATIBLE because the frozen Simulation port treats has_conflict as global even for a known other-vehicle pair. Lead should route a vehicle-scoped conflict-validation correction to SimulationData; new split report observations avoid this incompatibility. Current epochs are an authoritative incident input; expiry never restores an older epoch or seed geometry.

`proposeObservationAcceptance` and `proposeConflictResolution` return committed:false proposals. They validate and rederive the complete affected state; caller must compose review/gap/reward/idempotency/outbox atomically using the SessionPlatform transition port. No award is created here. Proposed report award_id remains null; ReviewRewards owns award composition. New report evidence is split per vehicle, with explicit server-generated observationIds bindings when a report covers multiple vehicles; epochs may differ by vehicle. This keeps a bike conflict from marking an unrelated car observation conflicted. Exact report redelivery adds no observation and does not resurrect superseded evidence. A conflict resolution explicitly selects kept/superseded evidence IDs and an audit reason and returns all pair projections.

## Report trust boundary

Public reporting entrypoint: `reporting/index.ts`. `submitReport` creates a canonical report without effects. `proposeReportSubmission` additionally returns capturedEpochs for private durable storage beside the wire report. Preserve this immutable snapshot and original authenticated participant/entity binding for later acceptance; never replace capture epochs with current epochs. If a capture predates the current incident, the caller must resolve epoch-at-capture from authoritative incident history before invoking this port.

Driver quick input works deterministically without a model; text remains normalizing. Citizen photos remain pending_review, or normalizing until an already-authorized normalized derivative is ready. Malformed/expired/future/ambiguous/duplicate evidence keeps explicit reasons and cannot be accepted. Media readiness/duplicate data is an injected trusted server assertion, not a byte-normalization implementation or client claim. Fixture photos must belong to the frozen simulated asset catalog.

ReportContext.participant is the persisted ORIGINAL submitter, not the reviewing dispatcher. This preserves participant_id separately from the selected simulated reporter_entity_id. Submission checks bound kind/vehicle/entity and explicit dispatcher simulation:submit_as scope. The runtime must authenticate current reviewer permission, capability/session/generation and wall-clock expiry before proposal, and CAS the current revision at atomic commit. Report.input_revision remains an audit/async-normalization snapshot: an unrelated newer revision does not forbid fresh manual review. Current acceptance pairs must match the retained capture epochs.

## Integration requests and limits

Lead should export `@floodops/domain/sources`, `/knowledge`, `/reporting` to these three owned index.ts files and add `@floodops/test-fixtures: workspace:*` to API devDependencies. No central files were edited. Focused test config temporarily resolves only the existing public fixture entrypoint, without private imports or copied fixtures:

`bun test --tsconfig-override apps/api/test/sources/test-tsconfig.json ./apps/api/test/sources ./apps/api/test/observations`

The actual public Simulation pipeline is exercised with the frozen synthetic fixture; it preserves frozen scenario/source facts and committed branch routes, assignments, positions and ETA. Calibration remains incomplete. Full phase05, sources-ready, HTTP auth, R2/Images/normalization/digest, async jobs and real providers require the later authorized continuation. Vision, devices, release and D04 are not established by these deterministic tests.
