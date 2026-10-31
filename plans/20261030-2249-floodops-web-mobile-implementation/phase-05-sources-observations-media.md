# Phase 05 — Nguồn, observation, report và upload ảnh an toàn

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [domain-model.md](specs/domain-model.md) · [policy-rules.md](specs/policy-rules.md) · [api-conventions-security.md](specs/api-conventions-security.md) · [cloudflare-deployment.md](specs/cloudflare-deployment.md) · [ai-assisted-image-review.md](specs/ai-assisted-image-review.md)

## Overview
- AM-AI02/AM-M01 integration: M1 chỉ functional web core; campaign/student và native parity thuộc M2, calibration claims M3. Student US-40/US-41/T22..T24 dùng deterministic MissionClassification, không model publishing gate; US-39/T21 forecast là extension độc lập. Legacy contracts/phase/DAG chưa đồng bộ không tự mở implementation hoặc mark gate pass.
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Phase 03, Phase 04. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [SourcesMedia](worktree-execution/roles/05-sources-media.md). Exclude reports/review và knowledge/conflict-review của ReviewRewards; actual writer theo [ownership](worktree-execution/ownership.md).

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
- Create/modify `packages/domain/src/{sources,knowledge,reporting}/** (excludes reward/review orchestration owned07)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/src/features/{scenario,sources,knowledge,reports,media}/** (review route/controller subtree reserved07)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/test/{sources,observations,media}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Implement fixture adapters weather/tide/river/traffic/camera/driver/community with common envelope, source context/observation/restriction roles and provenance labels.
2. Normalize units/datum/time/geography; no context-derived passability, missing mapping→needs_clarification. Validate epoch/vehicle/current evidence and authority profile reopening.
3. Submit actor-owned quick/text driver/citizen report. Quick path works without model; text normalization asynchronous with snapshot/session guards; citizen pending review always.
4. Implement media reserve/upload/complete lifecycle with actual byte cap, JPEG/PNG sniff+dimension+decode normalization/EXIF strip; private generated R2 keys and authorized derivative reads.
5. Image process/R2→DO completion is saga/outbox, cleanup orphan on failure; no accepted report from unready media or arbitrary URL. Platform Images availability prerequisite explicit.
6. Expose graph/source/knowledge/report owner-projected reads and a server-only authorized normalized-image/digest/readiness port for ReviewRewards; return only verified normalized derivative access, never raw staging/R2 URL. Domain conflict transitions preserve closure and gaps.
7. Record unavailable providers rather than no-op mocks called live adapters. Source catalog data is replay input only.


## AM-C01 - Report gắn nhiệm vụ
- Dispatcher tạo DataRequest đã kiểm scope/session generation/region/segment/vehicle/epoch; gap hoặc expiry chỉ gợi ý request. Report mission bind request/version và valid published mission từ policy classification, không tự mở mission hoặc tự chọn S-F. Report tự do giữ đường gửi riêng.
- Sau contract cutover ở [contributor campaigns](specs/contributor-campaigns.md), kiểm mission/campaign/region/session/epoch/vehicle/window và pin grade/reward policy version lúc nhận report hoàn chỉnh; client không tự sửa các giá trị này.
- Dùng cùng upload/private media và duplicate normalization cho collect/verify/update. Report tự do vẫn có đường gửi; report mission chỉ thuộc một mission/campaign/region, không tự tạo điểm hoặc data need.
- Trả liên kết và reason để ReviewRewards xét completion/award; không award ở phase 05, không biến accepted/low-confidence thành quyền đi đường. Draft offline refresh mission trước explicit send, Reset không gắn ảnh/report cũ sang campaign mới.
- Deterministic checks/evidence facts được truyền tới DispatcherReviewService; sau manual review mới tạo typed ReviewResult cho ContributorRewardEngine. Raw input/upload hoặc quality score advice không là reward result. Contributor response không lộ private order/driver context dùng cho classification.
- T16..T18/T20 kiểm invalid/paused/closed mission, mismatched scope, old policy/draft, media duplicate và expiry; phụ thuộc typed contract mới, không mock DTO chưa tồn tại.

## AM-C02 - Binding report và volunteer activity
- Consume synthetic enrollment/profile/kỳ và canonical nonoverlap activity/attendance fixture từ phase03 sau same-version cutover ở [AM-C02](specs/student-volunteer-demo.md); không thu MSSV/ID/email/SSO hoặc tạo trường thật duyệt.
- Validate contributor capability/enrollment/allowed student campaign, mode, activity, request/mission/report/session generation và pinned policy trước nhận report. Client không tự khai đủ120 phút, đổi school/period/mode để né cap hoặc dùng backing report cho activity khác.
- Giữ media/quality/duplicate checks hiện có; accepted quality report/validated completion phải có ReviewResult đúng binding trước recognition. Phase05 không grant ĐRL hoặc normal bounty kép. US-30 image quality score không là ngưỡng; valid-but-redundant về bounty không đồng nghĩa report lỗi.
- T22..T24 kiểm enrollment/activity sai scope, report/attendance reuse, old generation/offline draft. Attendance120 phút là recognition fixture metric, không mutate operational clock/physics/D04 hoặc bắt chờ thật.

## Todo list
- [ ] Step 05.01: Implement fixture adapters weather/tide/river/traffic/camera/driver/community with common envelope, source context/observation/restriction roles and provenance labels.
- [ ] Step 05.02: Normalize units/datum/time/geography
- [ ] Step 05.03: Submit actor-owned quick/text driver/citizen report. Quick path works without model
- [ ] Step 05.04: Implement media reserve/upload/complete lifecycle with actual byte cap, JPEG/PNG sniff+dimension+decode normalization/EXIF strip and authorized safe derivative read
- [ ] Step 05.05: Image process/R2→DO completion is saga/outbox, cleanup orphan on failure
- [ ] Step 05.06: Expose graph/source/knowledge/report owner-projected reads plus authorized normalized-image/digest/readiness port for ReviewRewards
- [ ] Step 05.07: Record unavailable providers rather than no-op mocks called live adapters. Source catalog data is replay input only.

## Success criteria
- T03/T08/T09/T11 context/evidence schema tests; raw external text cannot write policy/tier.
- Malformed/cross-session/oversized/metadata photo not served; duplicate normalized hash visible correct reason, not rewarded here.
- Pending/accepted labels and accepted knowledge are separate; requests after reset cannot attach old image.
- The image-review port reports server-derived normalized digest and readiness for pending reports; it never exposes unverified raw media or grants review/reward authority.

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
