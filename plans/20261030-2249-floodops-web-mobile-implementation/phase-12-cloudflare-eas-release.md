# Phase 12 — Cloudflare Workers và EAS deployment/rollback

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [cloudflare-deployment.md](specs/cloudflare-deployment.md) · [api-conventions-security.md](specs/api-conventions-security.md) · [decisions-prerequisites.md](specs/decisions-prerequisites.md)

## Overview
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Phase 11. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [ReleaseOps](worktree-execution/roles/12-release-ops.md). Own workflows/runbooks/release metadata; README/config central do IntegrationLead ghi, account/deploy actions cần explicit authorization theo [ownership](worktree-execution/ownership.md).

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
- Create/modify `.github/workflows/{deploy-preview,deploy-production}.yml` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `docs/{deployment,release-checklist,rollback}.md; README.md` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/mobile/release/** (metadata/runbook only, never signing secrets)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Verify runnable API entrypoint đã có phase08 và static/env config đã được phase11 kiểm; dùng chính artifacts đã test để deploy, không tạo second Worker/Vite root hoặc đổi composition sau acceptance.
2. Provision isolated preview/prod Workers, SessionDO SQLite class migration, R2 and Images entitlement; configure named bindings, public origins/secret quotas/expiry.
3. Deploy protected preview with separate keys/data, local first; exercise actual HTTPS session creation/join/upload/review/replan/Execute/reset and native foreground reconnect.
4. Apply expand-only state schema migration compatible rollback, version stamps and forward rollback safety; never equate Worker version rollback with SQLite/R2 rollback.
5. EAS preview binaries, runtimeVersion matching JS/native deps, signing access external; production store submission only account authority present; Workers not native binary hosting.
6. Production deploy gated human approval and CI; smoke from both clients, observe logs without raw secrets/photos, quota alarms, media cleanup outbox, explicit release notes.
7. Rollback drill Worker previous compatible version and EAS update rollback; verify no data/code schema mismatch or preview/prod resource sharing.
8. Update repository docs after implementation with actual commands/results/limits; no fictional deployment success from plan.

## Todo list
- [ ] Step 12.01: Verify artifacts/composition đã được local integration test, không tạo Worker/config muộn gây readiness cycle.
- [ ] Step 12.02: Provision isolated preview/prod Workers, SessionDO SQLite class migration, R2 and Images entitlement
- [ ] Step 12.03: Deploy protected preview with separate keys/data, local first
- [ ] Step 12.04: Apply expand-only state schema migration compatible rollback, version stamps and forward rollback safety
- [ ] Step 12.05: EAS preview binaries, runtimeVersion matching JS/native deps, signing access external
- [ ] Step 12.06: Production deploy gated human approval and CI
- [ ] Step 12.07: Rollback drill Worker previous compatible version and EAS update rollback
- [ ] Step 12.08: Update repository docs after implementation with actual commands/results/limits

## Success criteria
- Preview/prod APIs and web same-origin routing correct; R2 private, key absent bundle, capabilities/CSRF verified.
- EAS iOS/Android binaries or exact missing signing prerequisite documented; cross-client release smoke observed.
- Rollback restores compatible app, existing sessions safe, migration and cleanup replay tested.

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
