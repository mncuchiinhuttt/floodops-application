# API conventions, capability access và transport security

## Source of truth
- [OpenAPI 3.1.1](../contracts/openapi.json) là contract thiết kế để generate types/examples; implementation Zod/Hono schemas phải diff spec trong CI, không hand-maintain interface copy. Advisory image-review wire contract: [ai-assisted-image-review.md](ai-assisted-image-review.md).
- [OAS 3.1.1](https://spec.openapis.org/oas/v3.1.1.html) + JSON Schema 2020-12. Every operation có operationId, request/response/error schemas, authorization role, version/idempotency rules.
- Public prefix `/api/v1`; snake_case JSON; unknown fields rejected on mutations. Decimal values finite; IDs string, no parsing `12abc`.
- Success envelope `{success:true,data:<typed>,error:null,meta:{request_id,session_id?,revision?,event_sequence?}}`; error `{success:false,data:null,error:{code,message,details,retryable},meta}`.
- No 200+business-error masquerade. Media GET binary và SSE riêng, documented content-type.
- Pagination cursor bound session+filter, max 100 page items default 50. List consistent snapshot revision in meta; request query <= validation limits.

- The planned API total is 66 operations / 61 paths; 194 schemas only if exactly the eight image-review schemas in the canonical contract are added. Existing `Report`, `ReviewInput`, and all eight Commander tool schemas remain unchanged.

## HTTP behavior
- If-Match/ETag và Idempotency-Key theo [concurrency spec](concurrency-realtime.md). Client không auto-retry nonidempotent mutation bằng key mới.
- 400 malformed; 401 absent/expired auth; 403 role denied; 404 cross-session/owner-mismatch object; 409 key reuse/conflicting job/state; 410 expired/reset/cursor; 412 stale revision; 413 size; 415 media; 422 schema/domain hard rule; 428 missing CAS; 429 accurate Retry-After; 503 capability/model/storage unavailable.
- 201 resource created, 202 async job, 200 read/command result, 204 logout only; no HTML error pages on `/api`.
- Every response request_id; mutation error returns current revision only to authorized participants. No stack/sql/provider payload in body.

## Advisory image-review operations
- `POST /api/v1/sessions/{session_id}/reports/{report_id}/image-review-jobs` (`createReportImageReview`) accepts only `{}` and requires a dispatcher capability, `Idempotency-Key`, and the existing web CSRF+Origin checks; it returns `202 ImageReviewJobResponse`. It deliberately has no operational `If-Match`. The report must still be a pending community photo with ready normalized owned media or an approved normalized fixture.
- `GET /api/v1/sessions/{session_id}/reports/{report_id}/image-review` (`getReportImageReview`) is dispatcher-only, reauthorizes current session/report access, returns `200 ImageReviewStateResponse` with nullable current job (null when not requested), and uses `Cache-Control: no-store`. Neither operation adds authority to `submitReport`, `reviewReport`, or `getReport`; no caller-supplied image URL, model, digest, score, threshold, role, or advice is accepted.
- Preserve existing auth/error envelopes and ownership checks. Wrong-session references return `404`; non-pending report/state conflicts and not-ready media use the canonical `409` errors; invalid/duplicate images remain `422`; limits use `429`; unavailable provider/storage uses typed `503`. No provider details or raw payloads in error bodies.
- AI job/advice metadata is separate from public `Report` and human review payloads. `image_review_changed` is dispatcher-only and carries safe resource/job metadata for invalidation/refetch, never image bytes, advice text, capabilities, or provider trace.


## No production account system
- PRD excludes auth/SaaS. Internet-safe multi-device demo still needs **session capabilities**, not fake login/accounts.
- POST sessions creates isolated capped demo session and dispatcher owner. No permission to mutate someone else's session.
- Creation protected by Cloudflare rate limit and configured budget; 128-bit+ CSPRNG capabilities, server stores SHA-256 digest; TTL session-bound; no deterministic ID-derived secrets.
- Create/claim responses chứa credentials: never cache publicly; idempotency replay response được encrypt/seal bằng secret server, chỉ digest capability dùng auth. Public create định vị DO từ HMAC client nonce+key; claim request có session_id, không global search tokens.
- Dispatcher tạo one-use invitation cho driver/contributor/viewer; owner có permission manage_dispatchers mới mời thêm dispatcher để web/mobile cùng điều phối một phiên. Claim role cố định từ invite, không client body role; invited dispatcher không tự có owner-delegation.
- Web invite token in URL **fragment**, immediately consume via POST and history.replaceState, never query/log/referrer. Response cookie HttpOnly Secure SameSite=Lax path=/ `__Host-floodops_session`; csrf token nonsecret returned by session identity endpoint.
- Web mutations require X-CSRF-Token paired token+Origin allowlist. Native bearer capability in Expo SecureStore; memory cache only; Authorization header. Native no web persistent bearer localStorage.
- Participant role/driver/contributor identity server-derived. Contributor chỉ xem own report/media/points; driver chỉ own assignment + minimal relevant map/knowledge, own reports; dispatcher all session operations; viewer read sanitized projections, no pairing/reset/models.
- Mobile dispatcher uses exactly same permissions as web. UI role selector changes layout **only** for already-issued role; requesting new role needs dispatcher invitation. Local fixture/demo roles visibly simulated.
- Session kill/expiry/reset revokes tokens; invitations share limit, short TTL; no refresh/account recovery flow. Losing owner capability requires create new demo, not bypass role checks.
- Reset mất body sau cookie rotate: replay chỉ đúng reset key/digest, bằng original owner **hoặc recorded replacement owner capability** của chính reset record, cùng Origin và original/replacement CSRF digest hợp lệ; không key-only recovery hoặc old-session general access.
- Trường hợp dispatcher gửi report giả lập thay driver/contributor: `reporter_entity_id` phải là entity có trong scenario và caller có simulation-submit permission. Driver/contributor capability chỉ submit identity gắn token; audit giữ submitted_by thật.

## Endpoint authorization matrix
| Family | Dispatcher | Driver | Contributor | Viewer |
|---|---|---|---|---|
| identity / leave | own | own | own | own |
| session overview | full via snapshot; sanitized overview | dedicated own driver dashboard | dedicated own contributor dashboard | sanitized overview |
| graph / segments / sources | full | relevant-safe projection | permitted report region/gaps | sanitized |
| order/driver/hub/plan/execution/results | full | own assignments only (dedicated route) | deny | sanitized results, no raw model |
| create report / media | yes | own driver report | own citizen photo | deny |
| get reports/media/points | all | own | own | deny raw images |
| review/conflict/restriction/replay/image-review jobs/state | yes | deny | deny | deny |
| approve/execute/clock/reset/replan/eval/invite | yes | deny | deny | deny |
- Schema read projection dùng dedicated endpoint/data type; không nhắc field `access_scope` không tồn tại trong wire schema. Frozen published configuration có thể đọc, không có public config mutation.
- No public full-state endpoint for contributors; contributor dashboard uses own reports/gaps/points, driver dashboard own assignments.

## Media
- No arbitrary remote URL fetch/SSRF. Media references session-owned ID or approved bundled fixture.
- Two-step upload: reserve metadata→PUT same-origin bounded bytes→server verify content→complete. JPEG/PNG only, max 5 MiB, dimensions <=4096×4096, decoder transform limit; no SVG/HTML/animated file. Numeric bounds security limits, not D04 physics.
- Server computes hash on normalized image; sniff declared vs actual magic and dimensions; strip EXIF/location from served derivative; raw capture metadata separate and explicit unverified.
- Store original quarantined object private R2; only verified derivative accessible to owner/reviewer via API, Cache-Control:no-store, nosniff, explicit type. Report cannot use staging/unverified/cross-session object.
- Image transform dependency/provider must be verified; no assume sharp native available in Workers. Unavailable transform => reject controlled MEDIA_PROCESSING_UNAVAILABLE, never serve raw unsafe fallback.
- Duplicate SHA hash detect session-wide, avoid claiming GPS/forgery production verification. Upload orphan cleanup session expiry.

## Abuse/LLM
- Quota categories: session create/IP, participant command, upload bytes/session, active stream/session, planning concurrency/session, provider spend global. Values config with bounds/tests, not user supplied.
- External text/image caption is untrusted data; cannot modify policy/source authority/tier/tool allowlist. LLM never executes shell/network URL chosen by user.
- OpenAI secret only Worker secrets. Planning keeps `OPENAI_MODEL`; optional image review uses non-secret `OPENAI_IMAGE_REVIEW_MODEL` with the same `OPENAI_API_KEY`, not another provider/key. Unsupported/refusal/timeout/invalid output => explicit typed failure/null result, no canned text or score.
- Provider request schema is a self-contained provider-compatible strict `ImageReviewModelOutput`: resolve local OpenAPI refs, include no network refs, and send neither the full Job nor Advice schema. Compatibility must not loosen canonical app validation; the server revalidates the complete bounded model output before deriving score/recommendation.
- Send one permitted normalized derivative plus minimal report text/context only after explicit dispatcher action. Verify consent, account data-handling and retention terms for the actual provider/account before live use; do not claim zero retention without evidence. No raw image/report text or provider payload in routine logs.

- Image-review hashes/job metadata are data-minimizing references, not proof of authenticity; keep image/advice out of event payloads and routine traces. Keep retention/consent decisions explicit and bound to the provider account/config actually used.
## Headers and release
- HTTPS public; local dev 127.0.0.1 only. HSTS chosen for owned domain, no blind includeSubdomains/preload.
- CSP default-src self, connect-src self approved API, img-src self blob data only when needed, frame-ancestors none, no unsafe-eval; account for shadcn/Map libraries without disabling CSP broadly.
- CORS exact WEB_ORIGIN + native bearer (native Origin absent doesn't grant permission). CSRF guard only web cookies; bearer request never bypass auth.
- Pinned versions/lockfile, scan licence/advisories before adding deps. No production keys in previews; untrusted PR CI no deploy secrets.
