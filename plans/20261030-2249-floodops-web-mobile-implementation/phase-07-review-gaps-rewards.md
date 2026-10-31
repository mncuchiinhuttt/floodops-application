# Phase 07 — Review cộng đồng, conflict, gap và điểm exactly-once

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
4. Open gap occurrence when coverage lost; acceptance/resolution checks immediately-prior open gaps and single report eligibility.
5. Commit accepted observation+gap fill+one award/report+first-fill unique gap ledger+revision/events/idempotency atomic. Prevent duplicate photo across contributors and race between review clients.
6. Expose contributor-own dashboard/ledger and dispatcher full ledger; no raw image or owner identity leaked to viewer.
7. Expire evidence later opens new gap occurrence without clawback; Reset fresh ledger. Trigger planning event after commit, never rollback review if model timeout.

## Todo list
- [ ] Step 07.01: Review report schema/image/mapping/capture/freshness/duplicate before acceptance
- [ ] Step 07.02: Conflict resolution chooses kept/superseded evidence + reason
- [ ] Step 07.03: Calculate useful coverage per frozen relevant segment+vehicle+epoch, accepted current nonunknown/no-conflict, low qualifies coverage.
- [ ] Step 07.04: Open gap occurrence when coverage lost
- [ ] Step 07.05: Commit accepted observation+gap fill+one award/report+first-fill unique gap ledger+revision/events/idempotency atomic. Prevent duplicate photo across contributors and race between review clients.
- [ ] Step 07.06: Expose contributor-own dashboard/ledger and dispatcher full ledger
- [ ] Step 07.07: Expire evidence later opens new gap occurrence without clawback

## Success criteria
- T07/T12 behavior with concurrent accepts, duplicate/old/conflict/redundant reports: exact points and gap occurrence IDs.
- accepted report≠eligible reward≠approved route shown as separate state contracts.
- No payment/payout endpoint; safe-location-only prompts and simulated points label.

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
