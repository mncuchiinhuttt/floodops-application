# Phase 01 — Workspace và contracts dùng chung

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [architecture.md](specs/architecture.md) · [feature-implementation-guide.md](specs/feature-implementation-guide.md) · [api-conventions-security.md](specs/api-conventions-security.md)

## Overview
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Không có. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [ContractsClient](worktree-execution/roles/01-contracts-client.md). Deliverable paths dưới đây; write authority theo [ownership](worktree-execution/ownership.md), central manifests/lock/config do IntegrationLead bootstrap và commit.

## Key insights
- Canonical contract và domain behavior có trước UI; chưa có application code trong repo hiện tại.
- Scope hoàn chỉnh bao gồm error/authorization/stale/offline behavior; không kết thúc ở scaffold hoặc mock data numbers.
- D04/credentials/asset licences là external prerequisites có [register](specs/decisions-prerequisites.md), không dùng giả định để claim complete.

## Requirements
- Functional: thực hiện toàn bộ bước/acceptance bên dưới theo mapping US ở coverage.
- Nonfunctional: feature-based imports, strict types, module <200 lines, portable domain logic, no secret in public bundle.

## Architecture
- [Feature-based layering](specs/architecture.md) là chuẩn. Shared schema/domain/data authority không fork cho web/native.
- Phase này không tự đổi API/role/revision contract; interface change phải sửa OpenAPI + client + tests trước consumers.

## Related code files
- Create/modify `package.json; pnpm-workspace.yaml; tsconfig.base.json; eslint.config.js (root workspace/import rules)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `packages/contracts/src/** (common + session/scenario/operations/evidence/planning/simulation DTOs)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `packages/api-client/src/** (typed HTTP, auth adapter, idempotent command, SSE parser)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `packages/contracts/test/**; packages/api-client/test/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Khởi tạo pnpm workspace private, strict TypeScript/noUncheckedIndexedAccess, app/package naming @floodops/*, ESM exports hẹp; pin toolchain và lockfile sau advisory/licence check.
2. Chuyển schema thiết kế OpenAPI thành Zod source có cùng required/nullable/enum/finite constraints; generate OpenAPI snapshot và typed API client, CI semantic diff. Không copy 177 schema thành nhiều interfaces viết tay.
3. Implement error/status catalog, successful envelope, request_id/ETag/If-Match/Cursor, credential delivery web/native; domain types không import cloud runtime.
4. HTTP client inject fetch/credential provider, bounded GET retry, command key giữ nguyên qua network retry, no auto rebase after412; cancel obsolete session requests.
5. SSE parser handles arbitrary byte/chunk UTF-8, multiple data lines/comments, abort, sequence duplicate/gap; snapshot-after-cursor bootstrap. Native fetch adapter supplied phase10.
6. Set import boundaries and maximum module size; create fixtures builders explicit known vs invalid payloads, not consumer source-text assertions.

## Todo list
- [ ] Step 01.01: Khởi tạo pnpm workspace private, strict TypeScript/noUncheckedIndexedAccess, app/package naming @floodops/*, ESM exports hẹp
- [ ] Step 01.02: Chuyển schema thiết kế OpenAPI thành Zod source có cùng required/nullable/enum/finite constraints
- [ ] Step 01.03: Implement error/status catalog, successful envelope, request_id/ETag/If-Match/Cursor, credential delivery web/native
- [ ] Step 01.04: HTTP client inject fetch/credential provider, bounded GET retry, command key giữ nguyên qua network retry, no auto rebase after412
- [ ] Step 01.05: SSE parser handles arbitrary byte/chunk UTF-8, multiple data lines/comments, abort, sequence duplicate/gap
- [ ] Step 01.06: Set import boundaries and maximum module size

## Success criteria
- Mọi operation trong API inventory có typed client/request/response validation và matching operationId; malformed response gives contract error, no implicit success.
- Mọi positive/negative design example case có outcome đúng; response unknown-key/NaN/null edge cases có focused tests.
- Client retry lost response preserves key; 412/410 stops command and exposes rejoin/replan path.

## Risk assessment
- Scope drift / missing source: đọc PRD v0.3, coverage và prerequisite register trước phần phụ thuộc; không im lặng shrink.
- Race / platform difference: dùng same authoritative API and deterministic fixtures; no client-authorized safety decisions.

## Security considerations
- Enforce role/resource scope; input schema strict; external text/media/model output untrusted; secrets server-only.
- [Security test plan](specs/testing-strategy.md) áp dụng với every exposed feature; authorization failure không mutate state.

## Verification / evidence
- Run focused feature tests và smoke actual changed path sau integration phase; no pretend planned commands ran.
- Record commands, seed/config hash, pass/fail/unavailable and user-visible output; dùng [testing matrix](specs/testing-strategy.md).

## Next steps
- Mark phase complete chỉ khi acceptance có evidence; unlock dependency successors từ [task manifest](implementation-tasks.json).
