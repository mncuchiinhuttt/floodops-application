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

User fills `/Users/vominhlong/seahackathon/floodops-application/.env` locally; it is ignored and not copied into worktrees. `.env.example` contains no secret. Provider is the backend-only OpenAI Responses photo adapter; planner stays deterministic. Set key/model there, keep `OPENAI_IMAGE_REVIEW_ENABLED=false` until the separate live-test budget/data approval. `MAX_OUTPUT_TOKENS` is an output limit, not a USD cap. The current M1 serializer/provider composition rollout must finish before claiming photo AI runs; no real vision test is implied by this template.

From the implementation integration root, the installed Wrangler supports loading that exact user-owned file without copying or shell-sourcing it:

```sh
node apps/api/node_modules/wrangler/bin/wrangler.js dev --config tooling/runtime/wrangler.client-demo.jsonc --env-file /Users/vominhlong/seahackathon/floodops-application/.env --local --ip 127.0.0.1 --port 8760 --persist-to .wrangler/state/user-local
```

This is explicitly local synthetic test configuration, not deployment: isolated SQLite/private R2/Images, public synthetic local signing values, web origin127.0.0.1:5174. For ordinary non-synthetic dev, use the API-local config with operator-supplied session secrets. Running Bun does not automatically expose its `.env` to Workerd; `--env-file` passes it into the Worker binding environment. The installed Wrangler4.156.0 CLI was checked for this option. Automatic `.env` search otherwise uses the Wrangler config directory, and `.dev.vars` takes precedence; do not duplicate real keys across files. See [Cloudflare local environment docs](https://developers.cloudflare.com/workers/local-development/environment-variables/). Never print bindings/process.env or prefix this secret with VITE_/EXPO_PUBLIC_.

