# Phase 07 - Review, campaign, nhiệm vụ S-F và quyền lợi

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [policy-rules.md](specs/policy-rules.md) · [domain-model.md](specs/domain-model.md) · [api-conventions-security.md](specs/api-conventions-security.md) · [ai-assisted-image-review.md](specs/ai-assisted-image-review.md)

## Overview
- AM-AI02/AM-M01 integration: M1 chỉ functional web core; campaign/student và native parity thuộc M2, calibration claims M3. Student US-40/US-41/T22..T24 dùng deterministic MissionClassification, không model publishing gate; US-39/T21 forecast là extension độc lập. Legacy contracts/phase/DAG chưa đồng bộ không tự mở implementation hoặc mark gate pass.
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Phase 04, Phase 05. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [ReviewRewards](worktree-execution/roles/07-review-rewards.md). Own review subtrees/reward orchestration, consume public knowledge ports; không sửa SourcesMedia core theo [ownership](worktree-execution/ownership.md).

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
- Create/modify `packages/domain/src/rewards/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/src/features/reports/review/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/src/features/knowledge/conflict-review/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/src/features/rewards/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/test/{review,rewards,coverage}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Review report schema/image/mapping/capture/freshness/duplicate before acceptance; record safe reason codes, no claim production anti-fraud/GPS authenticity. Add the isolated dispatcher-only advisory image-review service/job/provider adapter under `apps/api/src/features/reports/review/`, using the SourcesMedia normalized-image/digest/readiness port and strict `ImageReviewPort` output; send only a self-contained provider-compatible strict `ImageReviewModelOutput` (local refs resolved, no network refs or full Job/Advice schema), then revalidate the full bounded output server-side without loosening app validation. Never depend on PlannerSafety provider internals.
2. Conflict resolution chooses kept/superseded evidence + reason; no authoritative closure supersede, accepted low remains low and route still requires approval.
3. Calculate useful coverage per frozen relevant segment+vehicle+epoch, accepted current nonunknown/no-conflict, low qualifies coverage.
4. Gap/expiry gợi ý nhu cầu; dispatcher gửi bound DataRequest rồi code derive MissionClassification S-F bằng rules/policy. Validate request/current classification/config theo mode trước publish collect/verify/update; không model/client/default grade. Mode thường kiểm bounty/budget/slots, student dùng recognition/activity config; verify có explicit data need, không fake gap.
5. DispatcherReviewService tạo ReviewResult từ authenticated manual decision và deterministic facts. ContributorRewardEngine bắt buộc result current/bind đúng report/request/mission trước evaluate completion/eligibility/work type/pinned bounty policy/slots/budget. Có thể handoff và commit review/knowledge+reward outcome/award/rank/idempotency cùng transaction; technical failure không half-commit hoặc fake zero. US-30 AI metadata riêng, không join provider call vào award commit.
6. Expose own dashboard/ledger, campaign/mission và alias-only regional ranking/prize projection; dispatcher full ledger không tự mở cho contributor. Không lộ raw image, private report hoặc owner identity.
7. Expiry mở gap occurrence mới không clawback; Reset clear campaign runtime/completions/ledger/ranking/simulated benefits. Knowledge commit mới trigger planning; model timeout không rollback review. Giữ AI pending/failure/stale manual fallback và human-decision/config/input supersession fence.
8. Cùng backend có DispatcherReviewService, deterministic MissionClassification và ContributorRewardEngine theo [AM-C01](specs/contributor-campaigns.md). Classification ghi S-F/rationale/rule IDs/request-version-generation/input-policy hashes; missing rules/threshold/config hoặc stale/Reset giữ draft/needs clarification/recompute. Không AI grading, không model publishing gate. Optional US-30 photo advice và gated US-39 forecast chạy ngoài transaction với grant riêng; không mint points.

## AM-C02 - DemoRecognitionEngine và ledger riêng
- Sau [AM-C02 cutover](specs/student-volunteer-demo.md), giữ dispatcher DataRequest -> current policy S-F -> board -> report -> manual ReviewResult, rồi ContributorRewardEngine chọn mode server-bound. Student mode gọi DemoRecognitionEngine thay normal bounty/region rank/voucher; cùng backend, không role/server/app mới.
- Publish student chỉ cần valid classification và student-recognition-demo-v1/profile/kỳ/activity/review config; không chờ general bounty table/budget, sponsor hoặc trường duyệt. Consume phase03 enrollment/activity/trusted nonoverlap attendance fixtures, không student self-claim/GPS/app-time.
- Evaluate >=120 fixture minutes và >=1 linked accepted quality report/validated completion với current bound ReviewResult. Bất kỳ thứ tự hai điều kiện: pending tới khi đủ. Reject/invalid/duplicate/pending không qualify; quality report redundant về general first-fill/slot có thể qualify activity. AI score không là threshold; 240 phút hoặc nhiều ảnh vẫn một flat grant.
- Grant mặc định HCMUT-Demo +2 cap4/6, HCMUS-Demo +3 cap6/9, UIT-Demo +5 cap10/15; cap 2 activity/campaign/3 mỗi kỳ xuyên campaign. Atomic ledger/grant + campaign counter + period counter + events/idempotency; unique(enrollment,activity,generation) không gồm policy version, backing report không reuse. Cap trước grant, capped accepted/+0 có reason; technical failure không partial commit/fake zero.
- Trả pending_review/pending_participation/recognized_demo/ineligible/capped và reason/committed credits, không “trường đã duyệt”. Freshness tại review hợp lệ; observation expiry sau không clawback trong run hiện hành. Reset/session expiry fence old generation, clear runtime ledger/counters/campus rank và reload fixtures; T22..T24 cover race/mode isolation/labels/caps.

## Todo list
- [ ] Step 07.01: Review report schema/image/mapping/capture/freshness/duplicate before acceptance; implement isolated advisory image-review job/service under reports/review using public media/runtime ports
- [ ] Step 07.02: Conflict resolution chooses kept/superseded evidence + reason
- [ ] Step 07.03: Calculate useful coverage per frozen relevant segment+vehicle+epoch, accepted current nonunknown/no-conflict, low qualifies coverage.
- [ ] Step 07.04: Dispatcher DataRequest -> policy classification -> valid S-F mission publication; no auto publish từ gap/expiry hoặc manual/default grade
- [ ] Step 07.05: Manual ReviewResult -> RewardEngine -> atomic review/knowledge/completion/award/budget/rank; validate provenance, replay, slots và separate image-advice metadata
- [ ] Step 07.06: Own ledger, campaign/mission và alias-only ranking/prize projection; dispatcher ledger remains restricted
- [ ] Step 07.07: Expiry/Reset đúng ledger; giữ superseded advice/deadline recovery không auto-retry
- [ ] Step 07.08: AM-C01 DataRequest/MissionClassification/ReviewResult lifecycle/policy/slots/budget/entitlement sau same-version cutover

## Success criteria
- T07/T12 behavior with concurrent accepts, duplicate/old/conflict/redundant reports: exact points and gap occurrence IDs.
- accepted report≠eligible reward≠approved route shown as separate state contracts.
- T16..T20: grade/policy version không đổi ngược report đã nhận; review reordering/race không tranh slot trái policy; bảng hạng đúng region/campaign và committed awards; quà mô phỏng exactly-once.
- No payment/payout endpoint; voucher/gift catalog/entitlement chỉ Simulated tới khi có scope fulfillment riêng; safe-location-only prompts and labels.
- Baseline wire/contracts và gate cũ chưa chứa phần mới; không claim phase hoàn tất trước AM-C01 producer/client/test cutover và configuration gates.
- Image review remains advisory: score is ordinal image-quality rubric points, not calibrated probability, Observation confidence, authenticity, or safe-road percentage; no recommendation auto-accepts/rejects, changes closure/vehicle scope/knowledge, or changes reward eligibility. See [canonical image-review contract](specs/ai-assisted-image-review.md); stub behavior does not establish vision quality.

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
