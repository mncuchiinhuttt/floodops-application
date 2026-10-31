# Phase 06 — Commander, route tools, policy gate và Execute

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [policy-rules.md](specs/policy-rules.md) · [concurrency-realtime.md](specs/concurrency-realtime.md) · [domain-model.md](specs/domain-model.md)

## Overview
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Phase 03, Phase 04, Phase 05. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [PlannerSafety](worktree-execution/roles/06-planner-safety.md). Chỉ own planning/incidents/operations/tools; central entrypoint/exports do IntegrationLead theo [ownership](worktree-execution/ownership.md).

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
- Create/modify `packages/domain/src/planning/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/src/features/{incidents,planning,operations}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/src/integrations/openai/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/test/{planning,execution,policy}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Implement incident fixture/ranking/impact from real current routes, tie-break tiers/lateness/ID; cause weather and road events remain separate.
2. Implement8 tools; compute_route nhận stop_refs và candidate assignment/pickup-hub overrides, code tạo node/service stops từ immutable order+hub data trước route. Route ID bind snapshot/job/revision/candidate hash; model không tự đặt vật lý. P1 hub/defer đầy đủ.
3. OpenAI Responses controller strict schemas/IDs/refusal/incomplete/tool limits/timeout; persisted async job leases and coalescing, no I/O transaction lock.
4. Build dependency DAG + candidate compiler. Gate POL-01..08 checks vehicle, turns, pickup custody, cumulative defer, stock/capacity/objective on whole candidate; unknown soft vs conflict hard distinct.
5. Approve/Reject exact action+plan+revision, metadata-only decision; no execution. Latest plan pointer prevents approving superseded plan at same revision.
6. Execute/Dry-run kiểm latest_plan_id/latest_requested_job_id trong commit transaction, kể cả revision không đổi; recheck full groups/candidate rồi atomic route/assignment/ETA/previews/log. Exact already-committed key replay vẫn trả outcome trước eligibility checks.
7. Stale job/Reset/LLM fail keeps accepted observations and previous operations; old response never overwrites new plan. All five invariants required irrespective flags.
8. P1 actual hub availability and defer limit tests; immutable original SLA/tier; no real customer notification or automatic replan Execute.

## Todo list
- [ ] Step 06.01: Implement incident fixture/ranking/impact from real current routes, tie-break tiers/lateness/ID
- [ ] Step 06.02: Implement eight typed internal tools via captured snapshot. Proposals only
- [ ] Step 06.03: OpenAI Responses controller strict schemas/IDs/refusal/incomplete/tool limits/timeout
- [ ] Step 06.04: Build dependency DAG + candidate compiler. Gate POL-01..08 checks vehicle, turns, pickup custody, cumulative defer, stock/capacity/objective on whole candidate
- [ ] Step 06.05: Approve/Reject exact action+plan+revision, metadata-only decision
- [ ] Step 06.06: Execute group selection/dependency closure, whole candidate recheck and atomic commit route/assignment/ETA/previews/attempt/success log with one revision bump.
- [ ] Step 06.07: Stale job/Reset/LLM fail keeps accepted observations and previous operations
- [ ] Step 06.08: P1 actual hub availability and defer limit tests

## Success criteria
- T02/T04/T05/T06/T09/T13/T15 fail/pass boundary proofs; no partial reassignment and no latest-ID race.
- 8 tool schemas compile supported provider subset; real API smoke before claiming model ready, deterministic stub alone insufficient.
- Pending soft risk may become Ready after matching approval, but hard rule cannot be overridden by UI/model.
- E-HUB-01: đổi unpicked order từ H1 sang H2 khác node; tool route/preview qua H2, Execute atomic, actual pickup ở H2, original SLA giữ; wrong old-hub route/picked_up/no stock/capacity đều block. Cùng state thể hiện web/native.

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
