# Phase 08 — Clock, kết quả, realtime projections và model evaluation

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [simulation-calibration.md](specs/simulation-calibration.md) · [concurrency-realtime.md](specs/concurrency-realtime.md) · [testing-strategy.md](specs/testing-strategy.md)

## Overview
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Phase 03, Phase 04, Phase 06, Phase 07. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [ResultsEvaluation](worktree-execution/roles/08-results-evaluation.md). Feature router/service do role này; full API entrypoint/local config do IntegrationLead compose trước backend-ready theo [ownership](worktree-execution/ownership.md).

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
- Create/modify `apps/api/src/features/{simulation,results,evaluations}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/test/{simulation,metrics,evaluations}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `evidence/{calibration,model-runs,rehearsal,codex}/** (real result artifacts after execution only)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create `apps/api/src/index.ts` và `apps/api/wrangler.api-local.jsonc`: đầy đủ feature-router composition + SessionDO exports; local API config không yêu cầu web/dist chưa build.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Explicit advance target validates now<target<=H, bounded event jobs. Persist lease nonce/deadline/checkpoint; authorized activation/access detects expired lease, marks failed/unlocks without time change. New CAS command explicitly resumes target; late old continuation fenced.
2. Serve simulation/impact/results projections same revision; read-only SSE/poll projections filtered per role, no render increments counts.
3. Final metrics at H from shared runner logs, distinguish projected preview and observed unfinished/late; static and reroute-only semantics disclosed.
4. Build ten-run real-model quality/rehearsal job with budget, reset isolated runner state each run, retain timeout/refusal/first-proposal failure; same model/config hashes.
5. Expose native/web evaluation data to dispatcher only; no raw provider prompts/images/secrets. Calculate nearest-rank p95 with all ten samples/failures visible.
6. Record D04 evidence result/missing data, T14 independent holdout and scaled render validation; config freeze and release gate.
7. Create Codex evidence log convention prompt→change→human decision→test evidence, no fictional entries from this plan.
8. Compose runnable backend entrypoint và local Workerd bindings từ toàn feature05–08; smoke actual Hono→DO request trước khi unlock web/native. Test harness04 và production composition dùng cùng factory/domain, không mock backend.

## Todo list
- [ ] Step 08.01: Explicit advance target validates now<target<=H, processes bounded event boundary jobs
- [ ] Step 08.02: Serve simulation/impact/results projections same revision
- [ ] Step 08.03: Final metrics at H from shared runner logs, distinguish projected preview and observed unfinished/late
- [ ] Step 08.04: Build ten-run real-model quality/rehearsal job with budget, reset isolated runner state each run, retain timeout/refusal/first-proposal failure
- [ ] Step 08.05: Expose native/web evaluation data to dispatcher only
- [ ] Step 08.06: Record D04 evidence result/missing data, T14 independent holdout and scaled render validation
- [ ] Step 08.07: Create Codex evidence log convention prompt→change→human decision→test evidence, no fictional entries from this plan.
- [ ] Step 08.08: Compose và smoke full local Worker trước phases09/10.

## Success criteria
- T01/T10/T14/T15 pass trace or D04 explicit prerequisite; no hardcoded output values.
- All6 metrics plus unfinished/horizon/calibration hash displayable; baseline0 ratio null.
- K4/K6 measured via model real request where available; skipped credentials reported unavailable not passed.

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
