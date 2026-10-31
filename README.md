# FloodOps application

Repository source độc lập cho FloodOps tại `/Users/vominhlong/seahackathon/floodops-application`, khởi tạo từ bộ plan sẵn có. Hiện là nền tảng Wave 0; feature implementation và worker agents bắt đầu sau bàn giao init.

PRD/plans đã được đọc lại và đồng bộ sau khi user xác nhận hoàn tất cập nhật: web bàn dispatcher và một app native iOS/Android có workspace theo capability. Hash/delta và source commit được ghi trong `docs/decisions/document-baseline.json`; parent kiểm tra handoff và cấp launch receipt trước khi mở implementation agents.

## Toolchain

Ưu tiên **Bun 1.4.0** cho package manager, workspace, TypeScript/ESLint scripts và tests. Một lockfile duy nhất: `bun.lock`.

```sh
bun install --frozen-lockfile --ignore-scripts
bun run check
bun run api:dev
```

API bootstrap health: `http://127.0.0.1:8760/api/v1/health`. Các checks hiện chỉ kiểm nền tảng bootstrap, chưa chứng minh application acceptance.

Node vẫn là ngoại lệ cho Wrangler CLI và các lệnh Expo yêu cầu Node LTS. Cloudflare Worker chạy trong `workerd`; app native chạy trong React Native runtime. Xem [quyết định Bun/tooling](docs/architecture/bun-toolchain.md) để biết commands, compatibility và nguồn chính thức.

## Bố cục và điều phối

- `apps/{api,web,mobile}` — Worker bootstrap và workspace boundaries cho web/native.
- `packages/*` — boundaries cho contracts, client, domain, simulation, tokens, icons và UI; public APIs được owner chốt ở gate tương ứng.
- [PRD v0.3](FloodOps/prd.md) và [active plan](plans/20261030-2249-floodops-web-mobile-implementation/plan.md) — yêu cầu và execution DAG.
- [AGENTS.md](AGENTS.md) và [role manifest](plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/roles.json) — policy và write ownership.
- Integration worktree: `/Users/vominhlong/seahackathon-worktrees/00-integration`, branch `integration/floodops-application`.

Mỗi role có một worktree và receipt được Lead commit trước launch. Lead là merger và central manifest/config writer duy nhất. Model mặc định theo yêu cầu user: `gpt-6.1-sol`/`max`; phần hẹp có thể dùng `gpt-6-luna`/`max`, phần triển khai chuyên sâu dùng `gpt-6.1-terra`/`max`, trong phạm vi task được giao.

Remote GitHub phải PRIVATE. Production, store submission và promotion sau implementation cần authorization riêng.

## Local OpenAI configuration

The backend-only OpenAI Responses photo adapter is disabled by default; it activates only when `OPENAI_IMAGE_REVIEW_ENABLED=true` and both `OPENAI_API_KEY` and `OPENAI_IMAGE_REVIEW_MODEL` are nonempty Worker bindings. `OPENAI_IMAGE_REVIEW_MAX_OUTPUT_TOKENS` defaults to 512 and accepts integers from 1 to 1000; invalid values disable the adapter. This limits generated tokens, not spend. Keep it disabled until the separate live-test budget/data approval; configuration is not a live-provider test or a claim that the M1 source submit-to-review flow is ready.

From the implementation integration root, the installed Wrangler supports loading that exact user-owned file without copying or shell-sourcing it:

```sh
node apps/api/node_modules/wrangler/bin/wrangler.js dev --config tooling/runtime/wrangler.client-demo.jsonc --env-file /Users/vominhlong/seahackathon/floodops-application/.env --local --ip 127.0.0.1 --port 8760 --persist-to .wrangler/state/user-local
```

This is explicitly local synthetic test configuration, not deployment: isolated SQLite/private R2/Images, public synthetic local signing values, web origin127.0.0.1:5174. For ordinary non-synthetic dev, use the API-local config with operator-supplied session secrets. Running Bun does not automatically expose its `.env` to Workerd; `--env-file` passes it into the Worker binding environment. The installed Wrangler4.156.0 CLI was checked for this option. Automatic `.env` search otherwise uses the Wrangler config directory, and `.dev.vars` takes precedence; do not duplicate real keys across files. See [Cloudflare local environment docs](https://developers.cloudflare.com/workers/local-development/environment-variables/). Never print bindings/process.env or prefix this secret with VITE_/EXPO_PUBLIC_.

For remote deployments, use `wrangler secret put OPENAI_API_KEY` for the key and configure `OPENAI_IMAGE_REVIEW_MODEL`, `OPENAI_IMAGE_REVIEW_ENABLED`, and optional `OPENAI_IMAGE_REVIEW_MAX_OUTPUT_TOKENS` as Worker variables. Keep the key out of Wrangler config and browser-prefixed variables.

## Cloudflare production deployment (demo)

Live at `https://floodops-api.vominhlongbentre.workers.dev` (one Worker serves the SPA from `apps/web/dist/live` and `/api/*`; same origin, so the `__Host-` cookie and exact `WEB_ORIGIN` work). Config: `apps/api/wrangler.jsonc`. Private R2 buckets `floodops-report-media` and `floodops-scenario-assets` (object `assets/asset_synthetic01` is `data/scenarios/functional-v2/synthetic-report.png`). `SESSION_LOCATOR_KEY` and `CAPABILITY_SEAL_KEY_ACTIVE` are Worker secrets (never in Git; regenerating them invalidates existing sessions).

```sh
export CLOUDFLARE_ACCOUNT_ID=<account id>
bun run --cwd apps/web build
node apps/api/node_modules/wrangler/bin/wrangler.js deploy --config apps/api/wrangler.jsonc --env-file /dev/null
FLOODOPS_API_URL=https://floodops-api.vominhlongbentre.workers.dev/api/v1 bun tooling/runtime/m1-local-smoke.ts
```

Planning and evaluation still reserve work on the Worker, but now schedule their deterministic drivers inside the owning Session Durable Object with its own `waitUntil`; planner search no longer runs in the Worker request path.
The driver uses the DO's own dispatch for authenticated begin/view/complete calls, and `PLAN_BEGIN`/`EVAL_BEGIN` continue fencing duplicate idempotent starts.
Evaluation retains the 50 ms yield on the DO before trials begin so the API can return `202`.
This removes planner CPU from the Free plan's 10 ms Worker request budget, but Wrangler dev does not enforce deployed Worker or DO CPU limits.
After redeploy, verify on Free with `FLOODOPS_API_URL=https://floodops-api.vominhlongbentre.workers.dev/api/v1 bun tooling/runtime/m1-local-smoke.ts`.
Responses carry `Cache-Control: no-store, no-transform` because the edge otherwise weakens the strong ETag used by `If-Match`.

## Security headers and environments

- API JSON responses use `default-src 'self'; connect-src 'self'; img-src 'self' data: blob:; script-src 'self'; style-src 'self'; frame-ancestors 'none'; object-src 'none'; base-uri 'none'; form-action 'self'`.
- The SPA adds `font-src 'self'` and only `style-src-attr 'unsafe-inline'` for the built SVG map's React inline style; scripts remain self-hosted.
- API and SPA also send `nosniff`, `no-referrer`, `X-Frame-Options: DENY`, COOP `same-origin`, and camera/microphone/geolocation restrictions.
- HSTS is `max-age=31536000; includeSubDomains` on HTTPS API responses and public Workers hosts; local `127.0.0.1` is excluded.
- Wrangler observability is enabled with query strings redacted; error logs contain only request ID, operation template, status, and error code.
- `env.preview` uses `floodops-api-preview`, its own SessionDO namespace and preview-only R2 buckets; its `WEB_ORIGIN` is a placeholder until first deploy.
- Production remains `floodops-api` with its existing origin and production buckets; dry-runs validate both configurations without creating resources.
