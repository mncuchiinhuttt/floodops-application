# Cloudflare deployment specification

## 1. Decision and boundaries

**Proposed deployment:** `apps/api` is the only Cloudflare Worker. Hono serves `/api/v1/*`; the Workers static-assets binding serves the independently built `apps/web` SPA and deep links from `../web/dist`. Each simulator session maps to one SQLite-backed Durable Object. Private `REPORT_MEDIA` R2 stores normalized user reports; a separate private `SCENARIO_ASSETS` R2 bucket stores approved immutable fixture assets. The DO owns authoritative session state, revision, event cursor, idempotency outcomes, reset tombstone, and expiry metadata. R2 stores blobs, never authorization decisions.

**Out of scope for Cloudflare:** `apps/mobile` iOS/Android binaries, signing, and store distribution are handled by EAS. Native apps call the same `/api/v1` API and retain only their capability in platform secure storage. Do not upload app binaries/signing keys to Workers or R2.

No D1, KV, or Queues in the MVP. DO SQLite supplies per-session transactional state; R2 supplies blob storage; current requirements do not require a durable cross-session job broker or global cache. Add one only if a specified feature cannot be met by this boundary.

## 2. Future files and ownership

| Future file | Contract |
|---|---|
| `apps/web/vite.config.ts` | Sole client Vite build to `apps/web/dist`; proxies `/api/*` to local Worker and binds dev/preview to `127.0.0.1`. |
| `apps/api/wrangler.jsonc` | Worker entrypoint, static-assets routing (`../web/dist`), DO class/binding, root append-only migrations, per-environment resource bindings, Images binding, R2 bindings, and non-secret vars. |
| `apps/api/src/index.ts` | Hono app, middleware, `/api/v1` routing, JSON 404/error mapping; no global catch-all that can mask API 404s. |
| `apps/api/src/features/session/` | Session HTTP handlers and feature policy; delegates persistence to the session runtime. |
| `apps/api/src/features/media/` | Upload-intent/content/completion handlers and authorized media read; delegates normalized blobs to R2. |
| `apps/api/src/features/scenario-assets/` | Read-only feature access to approved immutable fixture assets. |
| `apps/api/src/session-runtime/session-object.ts` | SQLite DO owner; synchronous transaction boundary, schema initialization, alarms, reset tombstone, expiry. |
| `apps/api/src/session-runtime/schema.ts` | Application schema-version tracking and forward-only per-object SQL migrations. |
| `apps/api/vitest.config.ts` | `defineWorkersConfig` with `@cloudflare/vitest-pool-workers` and the local Wrangler config. |
| `apps/api/test/` | DO/API/R2 integration tests in Workers runtime; exact cases in §8. |
| `apps/api/package.json` | Wrangler `dev`, `build`, `preview`, `test`, `types`, `deploy:preview`, `deploy:production` scripts. |
| `apps/web/package.json` | Vite `dev`, `build`, and `preview` scripts, each binding host to `127.0.0.1`. |

## 3. Routing and asset contract

The [Cloudflare Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/) can integrate a Worker and client build; the selected plan does not use it because `apps/web` owns the single independent Vite build and `apps/api` is Wrangler/Hono only. Build `apps/web` to `apps/web/dist`; from `apps/api/wrangler.jsonc`, set `assets.directory` to `../web/dist`. The relevant plugin documentation is retained as an alternative, not a second client build root. Configure static assets as:

```jsonc
"assets": {
  "directory": "../web/dist",
  "binding": "ASSETS",
  "not_found_handling": "single-page-application",
  "run_worker_first": ["/api/*"]
}
```

`/api/*` must reach Hono even when no API route matches; Hono returns a JSON 404/error envelope, never `index.html`. Static file hits and non-API client routes use the assets pipeline. Hono has no `GET *` fallback. If an API route needs authorization before returning a Worker response, put that check in the API route; do not rely on CORS or the asset fallback as access control. `apps/web` Vite preview validates the client only; `wrangler dev` with built assets validates Worker routing and API behavior together. Sources: [Workers SPA routing](https://developers.cloudflare.com/workers/static-assets/routing/single-page-application/), [Workers static assets](https://developers.cloudflare.com/workers/static-assets/), [Workers Vite plugin](https://developers.cloudflare.com/workers/vite-plugin/).

## 4. Binding and environment layout

Use the root config for local development and named `preview`/`production` environments for remote deploys, with distinct Worker names, DO namespaces, media buckets, and scenario-asset buckets. Repeat runtime bindings explicitly in each environment; keep a single root append-only DO migration history. Do not assume binding inheritance or duplicate migration tags. See the [Wrangler environments guide](https://developers.cloudflare.com/workers/wrangler/environments/).

| Binding/config | Development (local) | Preview | Production |
|---|---|---|---|
| Worker | `floodops-api-development` | `floodops-api-preview` | `floodops-api` |
| `SESSIONS` | Local SQLite DO state under local Wrangler persistence | Preview DO namespace | Production DO namespace |
| `REPORT_MEDIA` | `floodops-media-development` | `floodops-media-preview` | `floodops-media-production` |
| `SCENARIO_ASSETS` | `floodops-scenarios-development` | `floodops-scenarios-preview` | `floodops-scenarios-production` |
| `IMAGES` | Images binding configured for local test/dev | Preview Images binding | Production Images binding |
| `APP_ENV` | `development` | `preview` | `production` |
| Model secret | Local-only `.dev.vars` if enabled | `OPENAI_API_KEY` secret | Separate `OPENAI_API_KEY` secret |
| Public origin/cookie policy | Local origin | Preview hostname allowlist | Production hostname allowlist |

Representative `apps/api/wrangler.jsonc` layout. `apps/web` builds once to `apps/web/dist`; relative to the API config that is `../web/dist`. Root `migrations` is the one append-only history; named environments repeat runtime bindings but do not duplicate migration tags.

```jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "name": "floodops-api-development", "main": "src/index.ts", "compatibility_date": "2026-10-30",
  "assets": {"directory": "../web/dist", "binding": "ASSETS", "not_found_handling": "single-page-application", "run_worker_first": ["/api/*"]},
  "durable_objects": {"bindings": [{"name": "SESSIONS", "class_name": "SessionDO"}]},
  "migrations": [{"tag": "v1", "new_sqlite_classes": ["SessionDO"]}],
  "images": {"binding": "IMAGES"},
  "r2_buckets": [{"binding": "REPORT_MEDIA", "bucket_name": "floodops-media-development"}, {"binding": "SCENARIO_ASSETS", "bucket_name": "floodops-scenarios-development"}],
  "vars": {"APP_ENV": "development"},
  "env": {
    "preview": {
      "name": "floodops-api-preview",
      "durable_objects": {"bindings": [{"name": "SESSIONS", "class_name": "SessionDO"}]},
      "images": {"binding": "IMAGES"},
      "r2_buckets": [{"binding": "REPORT_MEDIA", "bucket_name": "floodops-media-preview"}, {"binding": "SCENARIO_ASSETS", "bucket_name": "floodops-scenarios-preview"}],
      "vars": {"APP_ENV": "preview"}
    },
    "production": {
      "name": "floodops-api",
      "durable_objects": {"bindings": [{"name": "SESSIONS", "class_name": "SessionDO"}]},
      "images": {"binding": "IMAGES"},
      "r2_buckets": [{"binding": "REPORT_MEDIA", "bucket_name": "floodops-media-production"}, {"binding": "SCENARIO_ASSETS", "bucket_name": "floodops-scenarios-production"}],
      "vars": {"APP_ENV": "production"}
    }
  }
}
```

Keep secrets out of `vars`, Vite client env, and committed files. Use `wrangler secret put OPENAI_API_KEY --env preview` and `wrangler secret put OPENAI_API_KEY --env production` only if the model integration is enabled; local development uses only a local secret file. Secret rotation must keep the previous Worker version operational for its rollback window. Deploy does not create/rotate R2 buckets; provisioning is explicit. `IMAGES` availability/entitlement and metadata-stripping transformation support are release gates. The snippet is a planning shape: validate it against the pinned Wrangler schema and current environment inheritance rules before implementation. Never copy production resource IDs into preview. Sources: [Wrangler configuration](https://developers.cloudflare.com/workers/wrangler/configuration/), [Wrangler environments](https://developers.cloudflare.com/workers/wrangler/environments/), [Secrets](https://developers.cloudflare.com/workers/configuration/secrets/), [Images transformations](https://developers.cloudflare.com/images/transformations/).

## 5. Durable session, transaction, reset, and expiry

### DO data contract

Use `SESSIONS.idFromName(session_id)` where `session_id` is a server-generated high-entropy opaque ID. One object owns one session. Keep SQLite tables for `session_meta` (ID, generation, revision, event sequence, schema version, created/last-activity/expiry wall timestamps, optional reset target), canonical simulator state, event log, idempotency outcomes, and report/object metadata. Store report binary bytes in R2, never SQLite.

Commands use the existing shared API contract: scoped capability authorization, `Idempotency-Key`, and `If-Match`/expected operational revision where required. Role in request JSON grants no authority. Read responses include the real revision. A single `transactionSync()` applies a reducer and writes the snapshot, revision increment, success event with next `event_sequence`, and idempotency outcome together. A thrown policy/constraint error leaves no partial commit. Keep only bounded synchronous deterministic work inside the transaction; no `await`, LLM, image processing, R2, or cross-DO call. SQLite operations and transaction requirements are documented in [SQLite storage API](https://developers.cloudflare.com/durable-objects/api/sqlite-storage-api/) and [DO rules](https://developers.cloudflare.com/durable-objects/best-practices/rules-of-durable-objects/).

LLM flow: load a committed snapshot/revision → call provider outside the transaction → validate output as untrusted proposal → call DO commit with snapshot revision and generation → recheck revision, evidence, approval, policy, and feasibility in the transaction → commit or return stale/conflict. A delayed completion after a state change or reset is rejected. Provider timeout/failure produces a structured error/audit record and no proposed operational mutation. The external call must not rely on holding an HTTP request or DO transaction for an unbounded interval.

### Reset boundary

Reset là saga, không cross-DO transaction. Trong **old DO transaction trước mọi await**, authorize/CAS rồi persist resetting lock, reset key/digest và fixed replacement ID. Old mutations bị từ chối trong toàn handoff. Initialize replacement idempotently với cùng reset origin/key, lưu sealed credential outcome và replacement owner digest; sau ack mới tombstone old DO. Crash giữa các bước resume đúng target, không mở lại old session hoặc tạo orphan mới mỗi retry. Private response/cookie trả replacement. Narrow replay hỗ trợ đúng original hoặc replacement credential đã bind vào reset record cùng key/digest/Origin/CSRF, kể cả body mất sau Set-Cookie; không cho quyền đọc old data. Retain tombstone tới original expiry, không broadcast credentials. Chi tiết ở [concurrency](concurrency-realtime.md).

### Expiry and cleanup

Finite idle/absolute wall TTL và resource limits có proposed defaults trong [operational limits](operational-limits.md); validate config và chốt trước release, không phải D04 physics constants. Successful authorized access/command có thể refresh idle tới absolute cap; unauthenticated probe không refresh. Evidence expiry dùng simulation time. Chỉ explicit dispatcher advance đổi simulation time, alarms chỉ cleanup/watchdog không tự advance.

On every authorized read/command, compare current wall time with session expiry before serving state. Expired returns `SESSION_EXPIRED` and cannot be revived. Set the DO's single alarm for the earliest cleanup deadline; the alarm handler is idempotent and rechecks wall time. Before removing report metadata, copy object keys into a persistent `media_cleanup` outbox in the same local DO transaction; delete R2 objects in bounded batches, then remove confirmed keys from the outbox. On R2 failure retain the outbox row and reschedule a retry alarm; if deletion succeeded but acknowledging it failed, repeat the idempotent delete. Remove the session state only after media cleanup completes; keep only the reset tombstone until old credentials expire. Alarms can run late or retry, so they are cleanup only—not the authorization check. See [Durable Object alarms](https://developers.cloudflare.com/durable-objects/api/alarms/).

## 6. Media upload contract

`POST /api/v1/sessions/{session_id}/media-uploads` tạo upload reservation có ownership sau auth. `PUT /api/v1/sessions/{session_id}/media-uploads/{upload_id}/content` nhận bytes, stream-count theo MAX_UPLOAD_BYTES, không tin Content-Length. Client không chọn R2 key/remote URL. JPEG/PNG và decoded limits theo [operational limits](operational-limits.md); reject MIME lie/SVG/GIF/truncated/dimension bomb. Mọi lookup route cùng session trước đọc bytes.

`POST /api/v1/sessions/{session_id}/media-uploads/{upload_id}/completion` idempotently verify reservation/content, decode/re-encode bằng IMAGES và bỏ metadata, enforce output bounds, ghi private REPORT_MEDIA bằng generated key rồi commit media reference trong DO. Raw staging không được serve. Transform/account capability unavailable => fail closed. Persistent cleanup outbox xử lý orphan sau R2/DO failure, không hứa distributed atomicity. No CAS/revision increment cho media-only metadata.

`GET /api/v1/sessions/{session_id}/media/{media_id}` reauthorize session/participant ownership và serve normalized derivative với nosniff; không public R2 URL/client key. `GET /api/v1/sessions/{session_id}/fixture-assets/{asset_id}` chỉ đọc asset trong frozen manifest có quyền/licence. SCENARIO_ASSETS immutable do release tooling quản, không có fixture-write API và không xóa khi một session hết hạn.

## 7. Realtime and native transport

`GET /api/v1/sessions/{session_id}/events?after={event_sequence}` is bounded JSON catch-up. `GET /api/v1/sessions/{session_id}/events/stream` is separate read-only SSE with event IDs; use `Last-Event-ID` or the initial cursor, a finite connection lifetime, heartbeat, and bounded replay. The exact finite limits belong to the shared API contract, not an invented default here. Cursor older than retention or reset requires snapshot resync; reset events never carry bearer capabilities. Commands remain authenticated JSON HTTP requests, so WebSocket's bidirectional connection state is unnecessary.

Web and Expo native consume SSE through `fetch` response-body streaming. The official [Expo `fetch` API](https://docs.expo.dev/versions/latest/sdk/expo.md) documents `ReadableStream` consumption with `getReader()`, so native SSE is eligible. Require on-device acceptance for streaming, abort, auth headers, reconnect, and app suspension; use the JSON `GET /events` cursor endpoint as the explicit fallback if the runtime suspends or cannot maintain the stream. Clients must tolerate duplicate/missed events and force snapshot resync on cursor gaps. This is a transport design, not an availability guarantee.

## 8. Preview, tests, and exact commands

### Isolation requirements

- Web `vite dev`/`vite preview` use one client build; API development/preview runs through Wrangler with local Workers bindings and separate persistence paths. Vitest uses the Workers pool. No production credentials in local files.
- Preview uses its own Worker name, DO namespace, `floodops-media-preview`, `floodops-scenarios-preview`, Images binding, secret set, allowed origin, and demo seed. Preview state and assets never share production resource IDs.
- Production deploy can access only production resources. CI uses read-only build/test permissions; deployment credentials exist only in protected deployment workflow contexts.

### Scripts and commands

`apps/web/package.json`: `dev = vite --host 127.0.0.1`; `build = vite build`; `preview = vite preview --host 127.0.0.1`. Its Vite config proxies `/api/*` to the local Worker at `http://127.0.0.1:8787`; Vite preview tests the SPA only.

`apps/api/package.json` (Wrangler, not Vite):
- `dev`: `wrangler dev --config wrangler.api-local.jsonc --ip 127.0.0.1 --port 8787 --persist-to .wrangler/state/development` (full API-local config phase08, không yêu cầu web build).
- `build`: `pnpm --filter @floodops/web build && wrangler deploy --dry-run`
- `preview`: `pnpm --filter @floodops/web build && wrangler dev --ip 127.0.0.1 --port 8787 --env preview --persist-to .wrangler/state/preview`
- `test`: `vitest run`; `test:watch`: `vitest`; `types`: `wrangler types`
- `deploy:preview`: `pnpm --filter @floodops/web build && wrangler deploy --env preview`
- `deploy:production`: `pnpm --filter @floodops/web build && wrangler deploy --env production`

`apps/api/vitest.config.ts` phase04 dùng `defineWorkersConfig` với `wrangler.configPath: "./wrangler.test.jsonc"` và injected real Hono/SessionDO harness. Phase08 tạo full `src/index.ts` + `wrangler.api-local.jsonc` trước UI. Phase11 tạo `wrangler.jsonc` assets/env và kiểm built-web+API cùng production entrypoint; phase12 chỉ deploy artifacts đã test. Không phụ thuộc late deployment config để chạy early feature tests; không mock DO/R2 thay integration.

Operator setup/deploy commands:
```sh
pnpm --filter @floodops/api exec wrangler types
pnpm --filter @floodops/api exec wrangler r2 bucket create floodops-media-preview
pnpm --filter @floodops/api exec wrangler r2 bucket create floodops-scenarios-preview
pnpm --filter @floodops/api exec wrangler r2 bucket create floodops-media-production
pnpm --filter @floodops/api exec wrangler r2 bucket create floodops-scenarios-production
pnpm --filter @floodops/api exec wrangler secret put OPENAI_API_KEY --env preview
pnpm --filter @floodops/api exec wrangler secret put OPENAI_API_KEY --env production
pnpm --filter @floodops/api deploy:preview
pnpm --filter @floodops/api deploy:production
pnpm --filter @floodops/api exec wrangler versions list
pnpm --filter @floodops/api exec wrangler rollback --env production
```

Preview local state uses a separate persistence path. Secret commands are interactive and run only in the matching protected environment; never persist values in logs, `vars`, `.env`, or bundles. Bucket creation is explicit. Class migrations apply through `wrangler deploy`, not merely version upload; see [DO migrations](https://developers.cloudflare.com/durable-objects/reference/durable-objects-migrations/).
### Required acceptance cases

1. **Routing:** build `apps/web/dist`; `GET /` and `/dispatch/deep/link` return SPA HTML through Worker assets; a real asset returns its bytes/content type; unknown `/api/v1/nope` returns Hono JSON 404, never SPA HTML. Vite preview tests the client; Wrangler dev tests Worker + assets together.
2. **DO persistence/atomicity:** state survives a new stub/request and local runtime restart; a transaction exception leaves snapshot, revision, event sequence, and idempotency outcome unchanged; simultaneous writes with the same expected revision yield one success and one structured stale result.
3. **LLM race:** delay model response, commit a newer report/operation/reset, then release response; stale completion cannot change state/proposal/revision. Provider failure leaves prior accepted report/execution intact.
4. **Replay/idempotency/reset/realtime:** repeated idempotency key returns the same outcome without duplicate event; `GET /events` returns ordered JSON catch-up and a gap requires snapshot; `/events/stream` sends SSE IDs and reconnects from cursor. Test web and Expo `fetch` readers, abort, auth headers, resume/reconnect, and JSON polling fallback. Reset returns a new ID, invalidates old token/response, retries safely, and old ID returns `SESSION_RESET` without exposing new capability.
5. **Expiry/alarms:** expired access denied dù alarm chưa chạy; duplicate/late cleanup safe; chỉ xóa REPORT_MEDIA keys của session, không xóa shared SCENARIO_ASSETS. Advance watchdog khi lease expired marks failed/unlocks **không advance clock**; late continuation fenced. Cleanup retry không hứa alarm deadline.
6. **Media:** reserve → `PUT /api/v1/sessions/{session_id}/media-uploads/{upload_id}/content` → completion cùng session path → `GET /api/v1/sessions/{session_id}/media/{media_id}` qua generated client. Check body cap/MIME/decoder metadata/orphans/retry và other-session denial. Approved fixture route đọc SCENARIO_ASSETS read-only, no global unscoped media aliases.
7. **Isolation:** preview DO namespace and both R2 bucket names/resources are separate from production; each remote environment has its configured Images binding. No preview command deploys production config accidentally; cross-origin request never grants capability.
8. **Tooling:** Vitest Workers pool executes DO + R2 integration tests; `vite preview` covers the SPA only, while Wrangler dev with the built assets covers API/static routing together.

## 9. Storage migrations and rollback policy

Keep Wrangler DO class migrations append-only and uniquely tagged. The first migration creates the SQLite-backed `SessionDO` class; subsequent class create/rename/delete/transfer operations add new migration entries—never rewrite historical tags. DO class migration is not application data migration. Each object's `schema_version` is advanced by synchronous SQL migrations; initialize with constructor/startup gating so requests do not observe half-created schema. Do not rely on `PRAGMA user_version` unless the selected DO SQLite API explicitly supports it; use FloodOps-owned metadata table instead.

Use forward-only expand/contract per-object migrations:

1. Add nullable columns/tables/indexes and code that reads old/new representation; preserve old columns.
2. Deploy compatible code and lazily migrate a session during its next activation/authorized request in a short local transaction; expired sessions can be deleted instead of migrated. Never enumerate an assumed global list of DOs.
3. Switch reads/writes only after tests prove both current and immediately previous code tolerate the schema.
4. Remove legacy fields only after all live sessions have migrated or expired and the rollback window has ended. If this cannot be proved, retain the legacy schema.

A Worker rollback changes Worker version, not DO rows, R2 objects, class migration history, or secret values. Before rollback, establish that the target version understands current schema, still has required bindings/secrets, and does not re-enable revoked capabilities. Prefer rollback only during the additive compatibility window; after an incompatible write, use a forward fix, not an assumed data rollback. Do not use gradual rollout for a schema change unless the pinned [Durable Objects gradual deployment rules](https://developers.cloudflare.com/workers/versions-and-deployments/gradual-deployments/with-durable-objects/) are followed and old/new code are proven compatible. If a class lifecycle migration was deployed, a version rollback before that lifecycle change may be unavailable; preserve the prior class/schema instead of promising reversible migrations. See [Worker rollbacks](https://developers.cloudflare.com/workers/versions-and-deployments/rollbacks/).

## 10. Rollout gates and hazards

- Pin and review `compatibility_date` and plugin/Wrangler/Vitest versions; regenerate Workers types after binding/config changes.
- Deploy preview first; run the required acceptance suite against preview resources; check generated Vite config, environment resource IDs, host/cookie policy, and private R2 access before production.
- Production deploy is blocked until the D04 calibration release prerequisite is resolved as required by the shared contract; this plan does not invent calibration values or claim field accuracy.
- Hono 404 handling must not create SPA fallback for API paths. CORS is not authorization. R2 presigned URLs are bearer capabilities. Browser/native clients never pick a storage key or provide a remote URL.
- DO alarms can be delayed and retried; session access checks enforce wall TTL. Simulation time is independent of wall time.
- SQLite transaction atomicity is per object only. Reset handoff and R2+DO writes span separate resources; make retries/idempotency and orphan cleanup explicit rather than promising a distributed transaction.
- Worker rollback does not roll back data. No provider, Worker, R2, or EAS availability guarantee is asserted.
