# FloodOps application

Đây là repository riêng cho source code của FloodOps, được khởi tạo từ implementation plan đã chuẩn bị trong `~/seahackathon`.

Trạng thái hiện tại là Wave 0 (IntegrationLead): workspace/toolchain, policy, plan và ownership/gate metadata đã được bootstrap. Chưa có implementation agent nào được khởi chạy, chưa có production/store deployment và chưa có production credential nào trong repo.

## Bố cục

- `apps/api` — Cloudflare Worker/Hono surface (hiện chỉ có bootstrap health entrypoint).
- `apps/web` — React web console workspace boundary.
- `apps/mobile` — Expo native workspace boundary.
- `packages/*` — shared contracts, client, domain, simulation, tokens, icons và UI boundaries.
- `plans/20261030-2249-floodops-web-mobile-implementation` — plan, specs, role prompts và execution protocol.
- `FloodOps/prd.md` — PRD v0.3 canonical product source.

## Execution layout

- Source repository: `/Users/vominhlong/seahackathon/floodops-application`
- Integration worktree: `/Users/vominhlong/seahackathon-worktrees/00-integration`
- Worker worktrees: `/Users/vominhlong/seahackathon-worktrees/01-contracts-client` through `12-release-ops`
- Integration branch: `integration/floodops-application`

Mọi worker phải đọc `AGENTS.md`, `worktree-execution/start-here.md` và receipt được IntegrationLead commit trước khi sửa code. Chỉ IntegrationLead merge/ghi central manifests, lockfile, API composition và release gates.

## Safety boundary

Remote private-repository setup và push chỉ thực hiện khi GitHub authentication hợp lệ. Production, native store và main promotion cần authorization riêng sau QA/release evidence.

