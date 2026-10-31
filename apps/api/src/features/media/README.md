# Private normalized media and durable recovery

Public exports: `createMediaRouter`, `createMediaRegistry`, `createSourcesSessionObject`, `createNormalizedImagePort`, `normalizedImageBinding`, `verifiedFixture`, bounded decoding helpers and typed bindings/tickets.

Reserve stores actor/session/generation ownership and generated base keys in the Session DO. PUT authenticates mutation/CSRF and resource ownership before consuming the bounded stream. Actual bytes (not Content-Length) must match the reservation, JPEG/PNG magic and valid structure. PNG CRC/chunk/IEND, JPEG segments/EOI, animation and4096-per-side checks precede real Images decoding. Completion verifies raw hash, actually decodes/reencodes with local/approved Images, strips metadata and computes SHA-256 on derivative bytes. EXIF orientations5–8 yield correctly swapped dimensions; GPS metadata never grants evidence authority. Missing/broken decoder fails503, invalid content fails422, and no raw fallback exists.

Successful media-only commands preserve operational revision. Idempotency fingerprints actual bytes; exact completed retries recover the cached final outcome before new external writes or writer rows. Ready GET and the image-review port authorize current participant/session/generation before accessing private derivatives and verify size/hash/dimensions. A fixture must exist in the frozen licensed manifest and match actual bytes; normalization/digest is server-derived. SCENARIO_ASSETS has no write API and is never an expiry cleanup target.

## Crash/Reset saga

`createSourcesSessionObject(combinedRegistry)` extends the public registered SessionDO factory and adds only its own additive `sources_media_recovery` SQL table/alarm wrapper. It does not read or change private platform tables. Call reducers remain synchronous; R2/Images awaits occur outside transactions. Lead must compose this class centrally and preserve the wrapper when combining other producer registries.

Every external writer has a unique writer ID/object key and a60-second resource lease. Durable recovery intent precedes atomic lease acquisition, and the exact key is registered in platform media_keys before any R2 put. Expired-lease takeover gets a new key and changes the active writer fence. Old finish/abort cannot attach or fail its replacement; cleanup deletes only the old writer's key. The lease is a resource deadline, not evidence TTL or a road-safety threshold.

After a writer stops, stopped() records that no future I/O can start and defers cleanup until absolute session expiry before attachment. The final registered transaction fences writer/session/generation/owner, publishes the normalized reference and leaves platform media_keys cleanup ownership. Successful attachment then compacts its recovery row. If the process crashes between commit and compaction, the stopped row cannot delete the live derivative before absolute expiry; exact replay compacts it. Failed attach/delete retains durable retry intent. Uncertain crashed writers keep bounded tombstones with exponential retry up to one hour; tombstones deliberately outlive platform Reset compaction to catch late object recreation. Explicit termination permits safe compaction. No distributed atomicity is claimed.

Resource bounds:5MiB streamed input/output,4096 per side,100MiB reserved/ready session media,500 upload reservations/reports,1000 outstanding recovery intents. Core session/command/capability quotas remain enforced. Recovery batches at most50 deletes. All keys are generated under sessions/<session_id>/; no filename/path/URL is accepted as a storage key.

## Required environment/integration

Own env intersection adds IMAGES and SCENARIO_ASSETS to public PlatformBindings; REPORT_MEDIA remains private. Local configs use remote:false and no provisioning/paid account/key action. Production availability/entitlement, retention and rollback require separate authorized evidence.

Test harness: `apps/api/test/media/{vitest.config.ts,wrangler.jsonc,runtime-worker.ts}`. Its actual source factory, registered SQLite DO, R2 and Images paths exercise auth/CSRF/CORS, malformed/oversized/animated/oriented content, hash/metadata, idempotency, historical capture/duplicates and Reset/crash/takeover/deletion failure. Readiness/digest tests are implementation evidence, not vision-quality or calibrated real-road evidence.
