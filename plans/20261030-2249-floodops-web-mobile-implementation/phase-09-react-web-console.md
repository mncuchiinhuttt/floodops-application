# Phase 09 — React Router web console đầy đủ theo feature

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [web-mobile-feature-surfaces.md](specs/web-mobile-feature-surfaces.md) · [design-system.md](specs/design-system.md) · [feature-implementation-guide.md](specs/feature-implementation-guide.md)

## Overview
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Phase 02, Phase 03, Phase 04, Phase 05, Phase 06, Phase 07, Phase 08. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [WebConsole](worktree-execution/roles/09-web-console.md). Own apps/web, không fork shared UI/contracts; manifests/lockfile central theo [ownership](worktree-execution/ownership.md).

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
- Create/modify `apps/web/src/{app,features,shared}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/web/index.html; apps/web/vite.config.ts; apps/web/components.json` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/web/test/{components,e2e,accessibility,visual}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Compose React Router Data Mode route tree and session boundary; loader prefetch shares query options, app root secrets absent, deep-links work with same-origin API.
2. Build scenario/join/capability pairing and dispatcher shell; persistent Simulation/provenance/D04 indicators, role-specific nav not authorization.
3. Implement operations-map actual geometry/scale/turn/vehicle/route overlays, map/list parity, inspector/impact rank, rain/tide/combined trigger.
4. Implement planning list/detail/diff/dependency-group gate reasons, dry-run/Approve/Reject/Execute separated, 412 refresh, null ETA waiting and no optimistic commit.
5. Implement sources context/datum/freshness; driver workspace with own committed assignment/route/ETA + quick/text/own reports; citizen photo upload/fixture, own report status, dispatcher review/conflict and useful gaps/points ledgers. Primary dispatcher UX does not grant privileged data/actions to field-role workspaces.
6. Implement manual clock/trace playback view-only speed, Reset saga UX/rejoin, timeline sequence, same-H observed results and real model evaluation dashboard.
7. Include P1 defer/hub controls and P2 reroute-only branch; disabled reason when external config missing, not empty future route.
8. Test complete built UI against actual local Worker, permission/errors/offline/race, all loading/empty/rejected/stale states, keyboard+320px reflow.

## Todo list
- [ ] Step 09.01: Compose React Router Data Mode route tree and session boundary
- [ ] Step 09.02: Build scenario/join/capability pairing and dispatcher shell
- [ ] Step 09.03: Implement operations-map actual geometry/scale/turn/vehicle/route overlays, map/list parity, inspector/impact rank, rain/tide/combined trigger.
- [ ] Step 09.04: Implement planning list/detail/diff/dependency-group gate reasons, dry-run/Approve/Reject/Execute separated, 412 refresh, null ETA waiting and no optimistic commit.
- [ ] Step 09.05: Implement sources/context, own driver assignment/report workspace, own community report status, dispatcher review/conflict and useful gaps/points ledgers.
- [ ] Step 09.06: Implement manual clock/trace playback view-only speed, Reset saga UX/rejoin, timeline sequence, same-H observed results and real model evaluation dashboard.
- [ ] Step 09.07: Include P1 defer/hub controls and P2 reroute-only branch
- [ ] Step 09.08: Test complete built UI against actual local Worker, permission/errors/offline/race, all loading/empty/rejected/stale states, keyboard+320px reflow.

## Success criteria
- AM-C01 sau contract cutover: contributor campaign list/detail, mission S-F/detail, task-linked report form, own completion/points, regional alias leaderboard và prize/eligibility detail; dispatcher quản lý campaign khi có capability. Không fake endpoint, điểm hoặc quà khi baseline chưa hỗ trợ.
- T16..T20 trên web: missing-config/paused/closing/closed states, report policy pin, pending points khác committed rank, shared ties, privacy và Reset. Native report -> web review -> cả hai cùng completion/points/rank/benefit là required cross-client proof.
- Every web route in surface matrix has real server data and errors, not mocked dashboard numbers.
- T01..T15 relevant UI flows reproducible, no secret/capability in URL/log/localStorage.
- Visual screenshots plus keyboard focus evidence for map/plans/report/review/results at target widths.
- Web là browser deliverable riêng, không thay native; workspace/role coverage và luồng mobile report → web review → mobile feedback theo PRD §3.4 và surface matrix.

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
