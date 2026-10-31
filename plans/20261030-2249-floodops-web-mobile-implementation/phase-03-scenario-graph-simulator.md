# Phase 03 — Scenario, graph tỉ lệ thực và simulator tất định

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [domain-model.md](specs/domain-model.md) · [simulation-calibration.md](specs/simulation-calibration.md) · [policy-rules.md](specs/policy-rules.md)

## Overview
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Phase 01. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [SimulationData](worktree-execution/roles/03-simulation-data.md). Deliverables theo phase; write authority và central-file exceptions trong [ownership](worktree-execution/ownership.md).

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
- Create/modify `packages/simulation/src/{scenario,graph,clock,movement,projection,metrics,calibration}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `packages/domain/src/operations/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `packages/test-fixtures/src/{functional,adversarial,calibration}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `data/scenarios/** (only licensed/synthetic bundles + manifests/provenance)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Define immutable scenario loader with source hashes, coordinate/time units, relevant pairs, parameter provenance, calibration state; reject missing references/ambiguous vehicle/invalid turn graph.
2. Acquire approved snapshot + alias mapping for chosen TP.HCM region; separate functional geometry fixtures from calibrated evaluation dataset, require D04 holdout data/licence before calibrated label.
3. Implement turn-aware directed route search and travel profiles FIFO validation; preserve scale/one-way/vehicle access, no arbitrary multiplier or bicycle substitute for motorbike.
4. Implement deterministic event scheduler and driver state machine pickup/travel/service/drop; edge-entry guards delegated policy; no teleport, delivered immutable, on-edge closure simplification logged.
5. Independent static/FloodOps/reroute-only branch state with common input event clock; initial assignment/route fixture frozen, baseline waits on restrictions.
6. Implement observed completion metrics at H, unfinished/null ETA/zero baseline ratio, projected objective separate, playback speed rendering independent.
7. Property tests graph/discrete clock/unit conversion, capacity at every stop, closure timing, branch isolation and frozen-data checksum.

## Todo list
- [ ] Step 03.01: Define immutable scenario loader with source hashes, coordinate/time units, relevant pairs, parameter provenance, calibration state
- [ ] Step 03.02: Acquire approved snapshot + alias mapping for chosen TP.HCM region
- [ ] Step 03.03: Implement turn-aware directed route search and travel profiles FIFO validation
- [ ] Step 03.04: Implement deterministic event scheduler and driver state machine pickup/travel/service/drop
- [ ] Step 03.05: Independent static/FloodOps/reroute-only branch state with common input event clock
- [ ] Step 03.06: Implement observed completion metrics at H, unfinished/null ETA/zero baseline ratio, projected objective separate, playback speed rendering independent.
- [ ] Step 03.07: Property tests graph/discrete clock/unit conversion, capacity at every stop, closure timing, branch isolation and frozen-data checksum.

## Success criteria
- Same seed/events/stub yields same observed metrics at different playback speeds; no source geometry length fabricated.
- T10/T13 functional runner and K3 edge-entry invariant observable; T14 includes data gaps instead of fake calibration pass.
- K1/K2 computed from completion log; no hardcoded7/2/28-of30 targets.

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
