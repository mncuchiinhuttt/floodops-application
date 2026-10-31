# API conventions, capability access và transport security

## Source of truth
- [OpenAPI 3.1.1](../contracts/openapi.json) là contract thiết kế để generate types/examples; implementation Zod/Hono schemas phải diff spec trong CI, không hand-maintain interface copy.
- [OAS 3.1.1](https://spec.openapis.org/oas/v3.1.1.html) + JSON Schema 2020-12. Every operation có operationId, request/response/error schemas, authorization role, version/idempotency rules.
- Public prefix `/api/v1`; snake_case JSON; unknown fields rejected on mutations. Decimal values finite; IDs string, no parsing `12abc`.
- Success envelope `{success:true,data:<typed>,error:null,meta:{request_id,session_id?,revision?,event_sequence?}}`; error `{success:false,data:null,error:{code,message,details,retryable},meta}`.
- No 200+business-error masquerade. Media GET binary và SSE riêng, documented content-type.
- Pagination cursor bound session+filter, max 100 page items default 50. List consistent snapshot revision in meta; request query <= validation limits.

## HTTP behavior
- If-Match/ETag và Idempotency-Key theo [concurrency spec](concurrency-realtime.md). Client không auto-retry nonidempotent mutation bằng key mới.
- 400 malformed; 401 absent/expired auth; 403 role denied; 404 cross-session/owner-mismatch object; 409 key reuse/conflicting job/state; 410 expired/reset/cursor; 412 stale revision; 413 size; 415 media; 422 schema/domain hard rule; 428 missing CAS; 429 accurate Retry-After; 503 capability/model/storage unavailable.
- 201 resource created, 202 async job, 200 read/command result, 204 logout only; no HTML error pages on `/api`.
- Every response request_id; mutation error returns current revision only to authorized participants. No stack/sql/provider payload in body.

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
| review/conflict/restriction/replay | yes | deny | deny | deny |
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
- OpenAI secret only Worker secrets, OPENAI_MODEL environment selection; unsupported/refusal/timeout => explicit error, no canned text called “real model”.
- No raw report text, pictures, capabilities, invite fragments or provider key in routine logs. Event traces use bounded IDs, hash and safe reason classes.

## Headers and release
- HTTPS public; local dev 127.0.0.1 only. HSTS chosen for owned domain, no blind includeSubdomains/preload.
- CSP default-src self, connect-src self approved API, img-src self blob data only when needed, frame-ancestors none, no unsafe-eval; account for shadcn/Map libraries without disabling CSP broadly.
- CORS exact WEB_ORIGIN + native bearer (native Origin absent doesn't grant permission). CSRF guard only web cookies; bearer request never bypass auth.
- Pinned versions/lockfile, scan licence/advisories before adding deps. No production keys in previews; untrusted PR CI no deploy secrets.
