# Phase 01 — Workspace và contracts dùng chung

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [architecture.md](specs/architecture.md) · [feature-implementation-guide.md](specs/feature-implementation-guide.md) · [api-conventions-security.md](specs/api-conventions-security.md)

## Overview
- AM-AI02/AM-M01 integration: M1 chỉ functional web core; campaign/student và native parity thuộc M2, calibration claims M3. Student US-40/US-41/T22..T24 dùng deterministic MissionClassification, không model publishing gate; US-39/T21 forecast là extension độc lập. Legacy contracts/phase/DAG chưa đồng bộ không tự mở implementation hoặc mark gate pass.
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Không có. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [ContractsClient](worktree-execution/roles/01-contracts-client.md). Deliverable paths dưới đây; write authority theo [ownership](worktree-execution/ownership.md), central manifests/lock/config do IntegrationLead bootstrap và commit.

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


## AM-C01 - Contract delta trước triển khai contributor
- User đã chốt [campaigns/missions/ranking/benefits](specs/contributor-campaigns.md); baseline 66 operations/8 tools chưa có DTO hoặc operations tương ứng. Phase 01 cần review/freeze delta thay vì đoán endpoint hoặc nhét field lạ vào strict schema.
- Candidate M2 bổ sung DataRequest/version, MissionClassification, ReviewResult, Campaign/Mission S-F/Completion, versioned Award/ranking/prize; update access/events/Reset/errors/examples/client/tests cùng lần. Code derive S-F/rationale/rule IDs từ bound request/urgency/impact/deadline/freshness và input/policy hashes; không model/client grade/points/budget.
- Bind ReviewResult với report/request/mission/generation/review ID/version/decision/reasons/validated facts; reward chỉ nhận current human result. Classification enum S-F/rule IDs/current request-policy binding, thiếu rules/threshold/config hoặc stale thì draft/recompute, không default/manual bypass. 66 API/8 tools là legacy pending AM-AI02/AM-M01/AM-C01/AM-C02 cutover; US-30/IR riêng.
- Producer 05/07, web/native 09/10 và QA 11 dùng cùng contract SHA/hash mới; migration/rollback hoặc new-session cutover được ghi rõ. Current scope sau AM-C02 là 41 US/T01..T24/IR-01..IR-12, phải map trước release.
- Historical plan-published/contract-index/receipts chưa chứng minh delta đã được freeze. Lead publish amendment/resync và ownership của phần mới trước worker launch; tài liệu này không tự cấp grant hoặc đổi protected metadata.

## AM-C02 - Contract delta student demo
- [Student volunteer demo](specs/student-volunteer-demo.md) thêm mode campaign, server fixture StudentDemoEnrollment/profile/academic period/allowed campaign, canonical activity/attendance confirmation, recognition status/ledger/counters/campus projection. Baseline vẫn 66 API/8 tools; chưa có operationId hoặc DTO mới trong docs task.
- Freeze student-recognition-demo-v1 (+2/+3/+5, campaign caps4/6/10 và period caps6/9/15), hai điều kiện >=120 fixture minutes + accepted quality report/ReviewResult, key unique độc lập policy version và backing-report reuse guard; aggregate trần kỳ xuyên campaign.
- Mode-based access/publish/evaluation tách general bounty/voucher với DemoRecognitionEngine. Student publish cần valid classification/config mode, không general reward TBD hoặc trường duyệt; client không chọn arbitrary enrollment/profile/kỳ, ghi attendance/credits hoặc có role mới.
- Cùng SHA/hash cho fixture producer03 (ownership hiện có), report05, recognition07, web09/native10/QA11, schemas/errors/events/Reset/client/tests và migration. Giữ US-30/IR/vision metadata riêng; contract cutover còn pending, không sửa receipts/baselines cũ hoặc launch owners.

## Related code files
- Create/modify `package.json; bunfig.toml; tsconfig.base.json; eslint.config.js (root workspace/import rules)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `packages/contracts/src/** (common + session/scenario/operations/evidence/planning/simulation DTOs)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `packages/api-client/src/** (typed HTTP, auth adapter, idempotent command, SSE parser)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `packages/contracts/test/**; packages/api-client/test/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Khởi tạo Bun workspace private, strict TypeScript/noUncheckedIndexedAccess, app/package naming @floodops/*, ESM exports hẹp; pin toolchain và lockfile sau advisory/licence check.
2. Chuyển schema thiết kế OpenAPI thành Zod source có cùng required/nullable/enum/finite constraints; generate OpenAPI snapshot và typed API client, CI semantic diff. Không copy 177 schema thành nhiều interfaces viết tay.
3. Implement error/status catalog, successful envelope, request_id/ETag/If-Match/Cursor, credential delivery web/native; domain types không import cloud runtime.
4. HTTP client inject fetch/credential provider, bounded GET retry, command key giữ nguyên qua network retry, no auto rebase after412; cancel obsolete session requests.
5. SSE parser handles arbitrary byte/chunk UTF-8, multiple data lines/comments, abort, sequence duplicate/gap; snapshot-after-cursor bootstrap. Native fetch adapter supplied phase10.
6. Set import boundaries and maximum module size; create fixtures builders explicit known vs invalid payloads, not consumer source-text assertions.

## Todo list
- [ ] Step 01.01: Khởi tạo Bun workspace private, strict TypeScript/noUncheckedIndexedAccess, app/package naming @floodops/*, ESM exports hẹp
- [ ] Step 01.02: Chuyển schema thiết kế OpenAPI thành Zod source có cùng required/nullable/enum/finite constraints
- [ ] Step 01.03: Implement error/status catalog, successful envelope, request_id/ETag/If-Match/Cursor, credential delivery web/native
- [ ] Step 01.04: HTTP client inject fetch/credential provider, bounded GET retry, command key giữ nguyên qua network retry, no auto rebase after412
- [ ] Step 01.05: SSE parser handles arbitrary byte/chunk UTF-8, multiple data lines/comments, abort, sequence duplicate/gap
- [ ] Step 01.06: Set import boundaries and maximum module size

## Success criteria
- Mọi operation trong API inventory có typed client/request/response validation và matching operationId; malformed response gives contract error, no implicit success.
- Mọi positive/negative design example case có outcome đúng; response unknown-key/NaN/null edge cases có focused tests.
- Client retry lost response preserves key; 412/410 stops command and exposes rejoin/replan path.

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
