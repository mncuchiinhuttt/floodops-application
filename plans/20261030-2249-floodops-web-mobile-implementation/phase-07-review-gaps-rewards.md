# Phase 07 - Review, campaign, nhiệm vụ S-F và quyền lợi

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [policy-rules.md](specs/policy-rules.md) · [domain-model.md](specs/domain-model.md) · [api-conventions-security.md](specs/api-conventions-security.md)

## Overview
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
1. Review report schema/image/mapping/capture/freshness/duplicate before acceptance; record safe reason codes, no claim production anti-fraud/GPS authenticity.
2. Conflict resolution chooses kept/superseded evidence + reason; no authoritative closure supersede, accepted low remains low and route still requires approval.
3. Calculate useful coverage per frozen relevant segment+vehicle+epoch, accepted current nonunknown/no-conflict, low qualifies coverage.
4. Open gap occurrence when coverage lost; collect/update checks immediately-prior open gaps. AM-C01 verify dùng explicit data need/mission occurrence/slot, không giả gap mới để thưởng.
5. Sau AM-C01 contract cutover, commit completion+one award/report+budget use+regional ranking+revision/events/idempotency atomic; collect giữ first-fill gap unique, verify dùng completion unique riêng. Prevent duplicate photo across contributors, duplicate branch event and review races.
6. Expose contributor-own dashboard/ledger, campaign/mission view và alias-only regional leaderboard/prize projection; dispatcher full ledger không tự mở cho contributor. No raw image, private report or participant identity leak.
7. Expire evidence later opens new gap occurrence without clawback; Reset fresh campaign runtime/completions/ledger/ranking/simulated benefits. Trigger planning event after knowledge commit, never rollback review if model timeout.
8. Campaign lifecycle, S-F reason/version, collect/verify/update, pinned policy at report receipt, bounded task capacity và budget/entitlement rules theo [AM-C01](specs/contributor-campaigns.md). Người có quyền quản lý campaign; client/LLM không tự cấp grade/points/quà.

## Todo list
- [ ] Step 07.01: Review report schema/image/mapping/capture/freshness/duplicate before acceptance
- [ ] Step 07.02: Conflict resolution chooses kept/superseded evidence + reason
- [ ] Step 07.03: Calculate useful coverage per frozen relevant segment+vehicle+epoch, accepted current nonunknown/no-conflict, low qualifies coverage.
- [ ] Step 07.04: Open gap occurrence; phân biệt collect/update gap fill và explicit verify data need/slot
- [ ] Step 07.05: Commit completion/award/budget/ranking exactly-once; separate collect-gap và verify-completion uniqueness
- [ ] Step 07.06: Expose own ledger, campaign/mission và alias-only ranking/prize projection; preserve dispatcher-only ledger
- [ ] Step 07.07: Expiry không clawback; Reset clear campaign runtime/completions/points/ranks/simulated benefits
- [ ] Step 07.08: Sau contract refreeze, implement AM-C01 campaign lifecycle, S-F/policy version, task capacity và budget/entitlement rules

## Success criteria
- T07/T12 behavior with concurrent accepts, duplicate/old/conflict/redundant reports: exact points and gap occurrence IDs.
- accepted report≠eligible reward≠approved route shown as separate state contracts.
- T16..T20: grade/policy version không đổi ngược report đã nhận; review reordering/race không tranh slot trái policy; bảng hạng đúng region/campaign và committed awards; quà mô phỏng exactly-once.
- No payment/payout endpoint; voucher/gift catalog/entitlement chỉ Simulated tới khi có scope fulfillment riêng; safe-location-only prompts and labels.
- Baseline wire/contracts và gate cũ chưa chứa phần mới; không claim phase hoàn tất trước AM-C01 producer/client/test cutover và configuration gates.

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
