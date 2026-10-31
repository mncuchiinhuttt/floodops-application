# Phase 11 — Kiểm chứng đầy đủ contracts, invariants và cross-platform

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [testing-strategy.md](specs/testing-strategy.md) · [requirements-coverage.md](specs/requirements-coverage.md) · [api-conventions-security.md](specs/api-conventions-security.md) · [ai-assisted-image-review.md](specs/ai-assisted-image-review.md)

## Overview
- AM-M01 integration: M1 kiểm 31-US web core/IR applicable; M2 kiểm native/campaign/student/forecast theo từng extension, M3 kiểm independent calibration. Native/full-campaign steps dưới đây là M2, không là M1 DoD; student không đòi forecast/hub/defer/P2. Historical 66 operations/8 tools và role/DAG metadata chưa refreeze theo AM-AI02/AM-M01, không là runtime AI authority.
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Phase 09 cho M1 web gate; Phase 10 thêm cho M2 native/cross-client gate. Không có ước lượng hoặc phân bổ thời gian.
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
1. Hydrate US/POL/I/T coverage from the current contract/manifest and IR-01–IR-12 from the canonical image-review/testing specs; verify planned totals (66 operations/61 paths, 194 schemas only with exactly eight added image-review schemas) and the provider-compatible self-contained strict `ImageReviewModelOutput` (local refs resolved, no network refs or Job/Advice schema, server revalidation); execute package/domain/Workerd/component suites once against integrated code, fix consumer failures not incidental snapshots.
2. Run built web Playwright with local Worker + deterministic provider fixture and native Maestro iOS/Android dev build; actual cross-client web review/native feedback exercises pending/completed/failure UI, while stubs prove deterministic plumbing only.
3. Adversarial API permissions, CSRF, revision/key replay, multiple dispatchers, reset saga, object eviction, R2/image errors, model injection/stale response and budget; add image-review role/readiness checks, idempotency, current input/job binding, human-decision/Reset races and lease/deadline recovery.
4. Property-based safety across event sequences, capacities/pickup states, report conflicts/expiry and reward races; seed fixed and counterexamples retained.
5. Calibrated T14 evidence gate and functional fixture separation; separately evaluate permitted real images/model against human-labelled rubric/match expectations, reporting sample IDs, model/prompt/config hashes, valid/failure counts, rating/match agreement and forbidden-claim count. Do not infer vision quality from stubs or conflate with D04 calibration.
6. Accessibility manual and visual checks web/native; profile bounded graph/event workload, SSE reconnection/foreground/background and offline storage; ensure same-revision `image_review_changed` updates refetch by `event_sequence` and job binding.
7. Publish evidence matrix pass/fail/unavailable with command/env/config hashes; do not label full app complete while D04/physical device/account/image-consent-retention prerequisites missing.
8. Build web/dist rồi validate combined Wrangler static routing, private media and same entrypoint; không đợi phase12 mới có runtime/config để chạy acceptance.
9. AM-C01: kiểm T16..T20, dispatcher DataRequest provenance -> valid/current policy S-F -> publication -> report -> authenticated typed ReviewResult -> reward evaluation -> feedback. Cover classification invalid/stale/failure/no-manual-fallback, result forged/replay/stale, no reward-before-result/technical half-commit, slot/budget/privacy/ties/Reset và both clients. Giữ IR-01..IR-12; baseline validation 34 US/66 operations không chứng minh phần mới.
10. AM-C02/T22..T24: student mode publish/classification/review -> DemoRecognitionEngine + phase03 trusted attendance -> atomic ledger/caps/campus ranking. Kiểm ba profile mặc định +2/+3/+5, 119/120/240 phút, hai thứ tự điều kiện, valid redundant vs duplicate/invalid, report/activity reuse/overlap/policy retry, cross-campaign trần kỳ/race; no normal bounty kép hoặc fake zero. Test labels/privacy/offline/Reset/expiry trên web/iOS/Android, không real-school approval/SSO prerequisite hoặc physics clock change.

## Todo list
- [ ] Step 11.01: Hydrate acceptance coverage US/POL/I/T and IR-01–IR-12 from current manifest/spec; check 66 operations/61 paths and 194 schemas only when exactly8 are added.
- [ ] Step 11.02: Run built web Playwright with local Worker + deterministic provider fixture, native Maestro iOS/Android dev build; cross-client actual image-review states
- [ ] Step 11.03: Adversarial API permissions, CSRF, revision/key replay, multiple dispatchers, reset saga, object eviction, R2/image errors, model injection/stale response and budget; include image-review binding/lease/supersession races.
- [ ] Step 11.04: Property-based safety across event sequences, capacities/pickup states, report conflicts/expiry and reward races
- [ ] Step 11.05: Calibrated T14 evidence gate and functional fixture separation; separately assess real-image/model evaluation, never stub-based vision claims
- [ ] Step 11.06: Accessibility manual and visual checks web/native
- [ ] Step 11.07: Publish evidence matrix pass/fail/unavailable with command/env/config hashes and consent/retention/account evidence
- [ ] Step 11.08: Validate full static+API Wrangler configuration trước remote deployment.
- [ ] Step 11.09: Verify AM-C01/T16..T20 trên candidate cùng contract SHA/hash, gồm cả hai client và đầy đủ configuration gates
- [ ] Step 11.10: Verify AM-C02/T22..T24, mode/fixture enrollment/activity/attendance, flat grant/caps/ledger, labels/privacy và normal-mode isolation sau same-version cutover

## Success criteria
- Roadmap coverage: 41 US (M1 31; M2 10), T01..T24/IR-01..IR-12. M1 hoàn tất bằng scoped web core/IR evidence; M2 từng extension có contract/config/client evidence, native/campaign/student claims cần web+iOS+Android. Student T22..T24 kiểm ReviewResult + attendance -> ledger/caps/campus rank, không đòi forecast/hub/defer/P2 hoặc general bounty/school approval; AI score không cấp ĐRL. Independent calibration claims là M3.
- All enabled feature requirements have deterministic behavior proof and user-surface smoke; five invariants zero violations.
- Full contract examples and client/server schemas consistent, no unresolved endpoint or role mismatch.
- Security/accessibility/release blockers resolved or explicitly external evidence gated, not silently waived.
- Với native/campaign extension M2, chứng minh browser web và native iOS/Android, cộng luồng liên thiết bị ở [surface matrix](specs/web-mobile-feature-surfaces.md): report/review/feedback, native dispatcher Execute/shared committed state, stale authority/Reset. Một app hoặc screenshots responsive không thay bằng chứng hai nền tảng.
- IR-01–IR-12 are supplemental to, not replacements for, the existing 34 US/15 T acceptance and five invariants. Live image evaluation requires an explicit scoped preview grant and permitted/human-labelled samples; report unavailable/blocked evidence honestly.

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
