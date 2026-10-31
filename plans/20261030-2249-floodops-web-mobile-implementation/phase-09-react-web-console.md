# Phase 09 — React Router web console đầy đủ theo feature

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [web-mobile-feature-surfaces.md](specs/web-mobile-feature-surfaces.md) · [design-system.md](specs/design-system.md) · [feature-implementation-guide.md](specs/feature-implementation-guide.md) · [ai-assisted-image-review.md](specs/ai-assisted-image-review.md)

## Overview
- AM-AI02/AM-M01 integration: M1 chỉ functional web core; campaign/student và native parity thuộc M2, calibration claims M3. Student US-40/US-41/T22..T24 dùng deterministic MissionClassification, không model publishing gate; US-39/T21 forecast là extension độc lập. Legacy contracts/phase/DAG chưa đồng bộ không tự mở implementation hoặc mark gate pass.
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
5. Implement sources context/datum/freshness; driver workspace with own committed assignment/route/ETA + quick/text/own reports; citizen photo upload/fixture and own report status; add dispatcher Review-detail advisory card showing derived `quality_score` as `Chất lượng ảnh: n/100`, four `quality_ratings` (sharpness, lighting, scene_visibility, detail), `report_match` (`yes/no/unclear`), `visible_summary`, `mismatch_notes`, `reasons` and persistent AI-advisory label. Keep human Accept/Reject separate, usable while AI is pending or failed; no score-driven decision.
6. Implement manual clock/trace playback view-only speed, Reset saga UX/rejoin, timeline sequence, same-H observed results and real model evaluation dashboard; subscribe to dispatcher-only `image_review_changed` and refetch the bound job even when operational revision is unchanged.
7. Include P1 defer/hub controls and P2 reroute-only branch; disabled reason when external config missing, not empty future route.
8. Test complete built UI against actual local Worker, permission/errors/offline/race, all loading/empty/rejected/stale states, keyboard+320px reflow; include no-job/pending/failed/superseded image-review states without fabricated score.

## Todo list
- [ ] Step 09.01: Compose React Router Data Mode route tree and session boundary
- [ ] Step 09.02: Build scenario/join/capability pairing and dispatcher shell
- [ ] Step 09.03: Implement operations-map actual geometry/scale/turn/vehicle/route overlays, map/list parity, inspector/impact rank, rain/tide/combined trigger.
- [ ] Step 09.04: Implement planning list/detail/diff/dependency-group gate reasons, dry-run/Approve/Reject/Execute separated, 412 refresh, null ETA waiting and no optimistic commit.
- [ ] Step 09.05: Implement sources/context, own driver assignment/report workspace, own community report status, dispatcher review/conflict and useful gaps/points ledgers; add advisory image-quality card with separate always-available manual review actions.
- [ ] Step 09.06: Implement manual clock/trace playback view-only speed, Reset saga UX/rejoin, timeline sequence, same-H observed results and real model evaluation dashboard; refetch image-review progress by event sequence/current job binding, not operational revision alone.
- [ ] Step 09.07: Include P1 defer/hub controls and P2 reroute-only branch
- [ ] Step 09.08: Test complete built UI against actual local Worker, permission/errors/offline/race, all loading/empty/rejected/stale states, keyboard+320px reflow, including image-review pending/failure/supersession.

## AM-C02 - Student contributor surfaces
- Cùng web contributor feature, thêm student campaign filter/detail, activity/mode requirements, own demo ĐRL ledger/counters và campus ranking theo [AM-C02](specs/student-volunteer-demo.md), sau contract cutover. Server fixture bind một profile/kỳ/allowed enrollment, không client chọn để né cap hoặc form MSSV/email/SSO.
- Dispatcher request/policy classification/publish và manual ReviewResult giữ luồng hiện hành. Sau đó result hiển thị nhánh DemoRecognitionEngine: +2/+3/+5 flat grant, cap2 activity/campaign/3 mỗi kỳ xuyên campaign; attendance120 phút Demo + quality report là hai điều kiện riêng, không score US-30 hoặc chờ thật.
- Persistent label “Điểm rèn luyện mô phỏng - không có giá trị công nhận của trường”; no official logo/certificate. Hiện pending_review/pending_participation/recognized_demo/ineligible/capped, reason, committed credits và remaining caps; API failure không +0, không optimistic credit/normal bounty kép.
- Campus leaderboard alias-only cùng profile/kỳ/generation, đồng hạng; không so raw ĐRL giữa trường hoặc lộ report/attendance. T22..T24 bắt buộc web/native full loop, labels/privacy/offline/Reset/expiry/cap races, normal mode unchanged. Student publish không chờ bounty/voucher/sponsor/school approval.

## Success criteria
- AM-C01 sau contract cutover: contributor campaign list/detail, mission S-F/detail, task-linked report form, own completion/points, regional alias leaderboard và prize/eligibility detail; dispatcher quản lý campaign khi có capability. Không fake endpoint, điểm hoặc quà khi baseline chưa hỗ trợ.
- Web dispatcher gửi DataRequest từ gap/missing-data view, xem classification pending/failed/current và mission publication; không nhập final S-F. Contributor xem board đã qua classification, gửi report; dispatcher trả manual review, contributor nhận ReviewResult decision/remarks cùng reward status/reason/committed points sau evaluation. Giữ US-30 vision card/IR tách biệt; không lộ private operational context.
- T16..T20 trên web: missing-config/paused/closing/closed states, report policy pin, pending points khác committed rank, shared ties, privacy và Reset. Native report -> web review -> cả hai cùng completion/points/rank/benefit là required cross-client proof.
- Every web route in surface matrix has real server data and errors, not mocked dashboard numbers.
- T01..T15 relevant UI flows reproducible, no secret/capability in URL/log/localStorage.
- Visual screenshots plus keyboard focus evidence for map/plans/report/review/results at target widths.
- Web là browser deliverable riêng, không thay native; workspace/role coverage và luồng mobile report → web review → mobile feedback theo PRD §3.4 và surface matrix.
- Image-review score is a 0–100 ordinal quality rating, never a calibrated percentage, confidence, authenticity claim or road-safety probability; show no score for null/stale/timeout and never auto Accept/Reject.

## Risk assessment
- Scope drift / missing source: đọc PRD v0.5, coverage và prerequisite register trước phần phụ thuộc; không im lặng shrink.
- Race / platform difference: dùng same authoritative API and deterministic fixtures; no client-authorized safety decisions.

## Security considerations
- Enforce role/resource scope; input schema strict; external text/media/model output untrusted; secrets server-only.
- [Security test plan](specs/testing-strategy.md) áp dụng với every exposed feature; authorization failure không mutate state.

## Verification / evidence
- Run focused feature tests và smoke actual changed path sau integration phase; no pretend planned commands ran.
- Record commands, seed/config hash, pass/fail/unavailable and user-visible output; dùng [testing matrix](specs/testing-strategy.md).

## Next steps
- Mark phase complete chỉ khi acceptance có evidence; unlock dependency successors từ [task manifest](implementation-tasks.json).
