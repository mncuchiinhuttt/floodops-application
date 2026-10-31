# Phase 11 — Kiểm chứng đầy đủ contracts, invariants và cross-platform

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [testing-strategy.md](specs/testing-strategy.md) · [requirements-coverage.md](specs/requirements-coverage.md) · [api-conventions-security.md](specs/api-conventions-security.md)

## Overview
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Phase 09, Phase 10. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [QualitySecurity](worktree-execution/roles/11-quality-security.md). Own acceptance/security tests, không sửa app source; IntegrationLead cung cấp combined static/config gate trước QA theo [ownership](worktree-execution/ownership.md).

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
- Create/modify `tests/{cross-platform,performance,smoke}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `.github/workflows/quality.yml` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `.github/workflows/mobile-validation.yml` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `docs/{testing,evidence}/** (actual reports and reproduction)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create `apps/api/wrangler.jsonc` và `apps/api/.dev.vars.example`: full static/env declarative config cho combined built web+Worker test, sử dụng entrypoint đã có phase08.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Hydrate acceptance coverage US/POL/I/T from manifest; execute package/domain/Workerd/component suites once against integrated code, fix consumer failures not incidental snapshots.
2. Run built web Playwright with local Worker + deterministic provider fixture, native Maestro iOS/Android dev build; actual network cross-client web review/native plan and reverse report.
3. Adversarial API permissions, CSRF, revision/key replay, multiple dispatchers, reset saga, object eviction, R2/image errors, model injection/stale response and budget.
4. Property-based safety across event sequences, capacities/pickup states, report conflicts/expiry and reward races; seed fixed and counterexamples retained.
5. Calibrated T14 evidence gate and functional fixture separation; real-model10-trial K4/quality when credentials supplied, no stub quality claims.
6. Accessibility manual and visual checks web/native; profile bounded graph/event workload, SSE reconnection/foreground/background and offline storage.
7. Publish evidence matrix pass/fail/unavailable with command/env/config hashes; do not label full app complete while D04/physical device/account prerequisites missing.
8. Build web/dist rồi validate combined Wrangler static routing, private media and same entrypoint; không đợi phase12 mới có runtime/config để chạy acceptance.
9. AM-C01: kiểm 38 US/T01..T20 sau contracts/producers/web/native cùng cutover; campaign lifecycle/config, S-F version pin, collect/verify/update, bounded-slot review reordering, award/budget/rank atomic, privacy/ties/benefit và Reset. Không dùng report validation 34 US/64 operations cũ làm evidence phần mới.

## Todo list
- [ ] Step 11.01: Hydrate acceptance coverage US/POL/I/T from manifest
- [ ] Step 11.02: Run built web Playwright with local Worker + deterministic provider fixture, native Maestro iOS/Android dev build
- [ ] Step 11.03: Adversarial API permissions, CSRF, revision/key replay, multiple dispatchers, reset saga, object eviction, R2/image errors, model injection/stale response and budget.
- [ ] Step 11.04: Property-based safety across event sequences, capacities/pickup states, report conflicts/expiry and reward races
- [ ] Step 11.05: Calibrated T14 evidence gate and functional fixture separation
- [ ] Step 11.06: Accessibility manual and visual checks web/native
- [ ] Step 11.07: Publish evidence matrix pass/fail/unavailable with command/env/config hashes
- [ ] Step 11.08: Validate full static+API Wrangler configuration trước remote deployment.
- [ ] Step 11.09: Verify AM-C01/T16..T20 trên candidate cùng contract SHA/hash, gồm cả hai client và đầy đủ configuration gates

## Success criteria
- All enabled feature requirements have deterministic behavior proof and user-surface smoke; five invariants zero violations.
- Full contract examples and client/server schemas consistent, no unresolved endpoint or role mismatch.
- Security/accessibility/release blockers resolved or explicitly external evidence gated, not silently waived.
- Chứng minh cả browser web và native iOS/Android, cộng luồng liên thiết bị ở [surface matrix](specs/web-mobile-feature-surfaces.md): report/review/feedback, native dispatcher Execute/shared committed state, stale authority/Reset. Một app hoặc screenshots responsive không thay bằng chứng hai nền tảng.
- Campaign -> mission S-F -> report/review -> points/rank/benefit có evidence cross-device; quà chỉ Simulated nếu chưa có fulfillment scope. Các ngưỡng/points/budget chưa chốt và contract refreeze còn pending phải ghi unavailable/blocked, không tự tạo số để pass.

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
