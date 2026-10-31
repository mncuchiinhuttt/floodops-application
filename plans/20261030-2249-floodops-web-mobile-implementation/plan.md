---
title: "FloodOps — full web, Expo mobile và Cloudflare API"
description: "Feature-based implementation plan với contracts, safety rules, design system và kiểm chứng end-to-end."
status: pending
priority: P1
branch: main
tags: [feature, frontend, backend, api, mobile, cloudflare, design-system]
created: 2026-10-30
---
# FloodOps implementation plan

## Phạm vi và quyết định
- Toolchain amendment theo user 2026-10-31: Bun 1.4.0 workspace/package manager/scripts, một `bun.lock`; Node ngoại lệ cho Wrangler/Expo, Worker vẫn `workerd`. [Bun toolchain decision](../../docs/architecture/bun-toolchain.md) là chuẩn cho lệnh runtime/tooling.
- Chuẩn: [PRD v0.5, mục 3.3/3.4](../../FloodOps/prd.md): 34 US gốc + 4 AM-C01 + US-39 forecast AM-AI02 + 2 AM-C02 = **41 US; M1 31, M2 10**. M1 là functional web core; native iOS/Android, campaign thường/sinh viên và forecast thuộc M2; calibration/pilot claims thuộc M3. Native vẫn là deliverable M2, không lấy responsive web thay evidence.
- Web: React + React Router Data Mode + Tailwind CSS v4 + shadcn. Native: Expo Router/RN, shared tokens + native components + SVG isometric package adapter.
- Backend: Hono Worker + static web assets, Session Durable Object/SQLite + private R2; không D1/KV/SaaS accounts/live provider connectors.
- Delta prototype gốc no-DB: durable session và scoped capabilities để cross-device/reconnect an toàn, đã làm rõ trong PRD §3.4/9.1; xem [decisions](specs/decisions-prerequisites.md).
- Theo người dùng: web ưu tiên dispatcher; mobile ưu tiên driver/contributor và vẫn có dispatcher đầy đủ. Driver đọc phân công/tuyến/ETA đã commit, không nhận cuốc/turn-by-turn; workspace theo capability, không theo tên thiết bị.
- Cùng backend/session authority; UI/tương tác riêng theo nền tảng. M1 kiểm web với capabilities/browser contexts riêng. M2 kiểm mobile report → web review → mobile status/points và mobile dispatcher Execute → web/driver cùng committed outcome.
- US-30 bổ sung AI nhận xét ảnh: ratings0–2 → code tính chất lượng0–100, match yes/no/unclear và lý do; chỉ advisory, manual review không phụ thuộc AI. Hai API mới và IR-01–IR-12 theo [image review spec](specs/ai-assisted-image-review.md).
- **AM-C01, user chốt 31/10/2026:** contributor có campaign theo khu vực/kỳ, mission collect/verify/update cấp S-F, versioned points, regional ranking và benefit/prize catalog Simulated. [Đặc tả](specs/contributor-campaigns.md) quy định scope, eligibility, privacy và T16..T20; exact points/thresholds/budget/real fulfillment còn TBD.
- **Workflow campaign M2 hiện hành:** dispatcher gửi DataRequest -> code tính MissionClassification S-F từ bound request/rules/policy -> validate/publish -> contributor gửi ảnh/thông tin -> optional US-30 photo advice -> dispatcher ReviewResult -> reward/recognition engine tất định -> feedback. Không grade client/default shortcut hoặc reward trước human result; free report M1 không đòi mission.
- **AM-C02, user chốt 31/10/2026, extension M2:** [student volunteer demo](specs/student-volunteer-demo.md) thêm US-40/US-41, T22..T24, D13; giữ US-39/T21/D11 forecast và D12 milestones. Sau ReviewResult, RewardEngine rẽ DemoRecognitionEngine: attendance synthetic >=120 phút + quality report hợp lệ, profile hư cấu +2/+3/+5, tối đa 2 activity/campaign và 3/kỳ xuyên campaign. Không bounty/voucher kép, S-F multiplier hoặc trường thật công nhận.
- **Contract cutover pending:** 66 operations/8 tools là baseline legacy, chưa refreeze theo AM-AI02/AM-M01/AM-C01/AM-C02. Chỉ photo advice US-30 (M1) và gated forecast US-39 (M2) là runtime AI; planner và mission classification là code. Phase 01 đồng bộ schemas/client/access/events/Reset với producers/consumers/tests trước implementation; không gọi legacy tools model-callable hoặc gate cũ đã pass phần mới.
- Không phân thời gian/effort, không viết code ứng dụng hoặc deploy trong bước này. Thứ tự dưới là dependency, không lịch thi.

## Phases
| # | Deliverable | Depends on | Status |
|---|---|---|---|
| 01 | [Workspace và contracts dùng chung](phase-01-workspace-contracts.md) | — | Pending |
| 02 | [Design system, token và isometric vector package](phase-02-design-system-icons.md) | 01 | Pending |
| 03 | [Scenario, graph tỉ lệ thực và simulator tất định](phase-03-scenario-graph-simulator.md) | 01 | Pending |
| 04 | [Hono session runtime, capabilities và consistency](phase-04-session-runtime-security.md) | 01 | Pending |
| 05 | [Nguồn, observation, report và upload ảnh an toàn](phase-05-sources-observations-media.md) | 03, 04 | Pending |
| 06 | [Planner tất định, policy gate và Execute](phase-06-planning-safety-execution.md) | 03, 04, 05; AM-AI02 cutover | Pending |
| 07 | [Review/AI ảnh, campaign/mission S-F, điểm thường và ĐRL mô phỏng](phase-07-review-gaps-rewards.md) | 03 fixtures, 04, 05; AM-C01/AM-C02 contract freeze | Pending |
| 08 | [Clock, kết quả, realtime projections và model evaluation](phase-08-simulation-results-evaluations.md) | 03, 04, 06, 07 | Pending |
| 09 | [React Router web console đầy đủ theo feature](phase-09-react-web-console.md) | 02, 03, 04, 05, 06, 07, 08 | Pending |
| 10 | [Expo native dispatcher, driver và contributor](phase-10-expo-mobile-application.md) | 02, 03, 04, 05, 06, 07, 08 | Pending |
| 11 | [Kiểm chứng đầy đủ contracts, invariants và cross-platform](phase-11-verification-acceptance.md) | 09, 10 | Pending |
| 12 | [Cloudflare Workers và EAS deployment/rollback](phase-12-cloudflare-eas-release.md) | 11 | Pending |

## Tài liệu triển khai bắt buộc
- [Architecture](specs/architecture.md) · [Feature recipes](specs/feature-implementation-guide.md) · [Full coverage](specs/requirements-coverage.md).
- [API inventory](contracts/api-index.md) · [OpenAPI3.1](contracts/openapi.json) · [8 tool contracts](contracts/tool-contracts.md) · [Examples](contracts/contract-examples.json).
- [Domain schemas](specs/domain-model.md) · [Safety/transition rules](specs/policy-rules.md) · [Atomicity/realtime](specs/concurrency-realtime.md).
- [Simulator/calibration](specs/simulation-calibration.md) · [Design system](specs/design-system.md) · [Web/mobile surfaces](specs/web-mobile-feature-surfaces.md).
- [AI-assisted image review](specs/ai-assisted-image-review.md): rubric/rounding, strict model vs API output, job/authority/budget/ownership và12 acceptance IR cases.
- [Contributor campaigns AM-C01](specs/contributor-campaigns.md): cấp S-F, collect/verify/update, ranking/quà và cutover checklist; target chưa là API đã có.
- [Student volunteer demo AM-C02](specs/student-volunteer-demo.md): server-bound enrollment/profile/kỳ, activity/attendance fixtures, +2/+3/+5 policy, eligibility/caps/ledger/campus ranking và T22..T24; không tích hợp hoặc chờ trường thật duyệt.
- [API security](specs/api-conventions-security.md) · [Operational limits](specs/operational-limits.md) · [Testing matrix](specs/testing-strategy.md) · [Cloudflare/EAS release](specs/cloudflare-deployment.md).
- [Task manifest/DAG](implementation-tasks.json) · [Platform research](research/cloudflare-hono-platform.md) · [Web/native research](research/web-expo-design-compatibility.md).

## Execution và ownership
- Phase01 freeze contracts;02/03/04 có thể song song,05 sau03+04;06 sau05;07 sau05;08 sau06+07;09/10 song song khi upstream đủ;11 rồi12.
- Runtime harness phase04; full backend composition phase08; combined config phase11; deploy phase12. Khi chạy worktree, [ownership manifest](worktree-execution/roles.json) quyết định writer: central manifests/lock/entrypoint/config chỉ IntegrationLead ghi.
- Các implementation task đang pending; phase complete chỉ khi tests và smoke thực có evidence. Plan validation không là application verification.
- External gates theo milestone: M1 cần allowed images/model/budget và provenance/assumption labels; thiếu independent D04 evidence phải ghi Calibration incomplete. M2 native cần EAS/iOS/Android evidence, campaign/forecast có data/config gates riêng; M3 mới claim full calibration. Account/deploy/model calls vẫn cần grant thực.
- AM-C01 bổ sung configuration gates: grade/reward policy, verification slots, activity/review windows, budget/inventory/tie policy; nhà tài trợ/quà thật là prerequisite riêng, không quyền payout từ scope docs. Lead cần amendment/resync cho worker đã launch trước khi đổi contract baseline.
- AM-C02 publish chỉ yêu cầu current policy classification và cấu hình student-recognition-demo-v1/profile/kỳ/activity/review; general bounty/voucher/sponsor/real-school approval không chặn student demo. Phase03 SimulationData bàn giao synthetic enrollment/activity/nonoverlap attendance fixtures theo ownership hiện có; phase05 bind report, phase07 recognition, phase09/10 parity và phase11 kiểm T22..T24. Không launch owner hoặc sửa fixture code/JSON trong docs task.
- AM-C02 contract delta còn pending: mode/access/enrollment/profile/period/activity/attendance/result/ledger/counters/campus projection/events/Reset phải refreeze cùng producers03/05/07, web/native/QA trước implementation, giữ protected baseline 66 operations/8 tools và US-30/IR.

## Agent roles và worktrees
- Đọc [root AGENTS.md](../../AGENTS.md), rồi [start-here exact role order](worktree-execution/start-here.md):13 roles có prompt/branch/worktree/ownership/ports/acceptance.
- [IntegrationLead](worktree-execution/orchestrator.md) dispatch theo DAG; [bootstrap/recovery](worktree-execution/agent-bootstrap.md) và [injection rules](worktree-execution/prompt-injection-policy.md) áp dụng mọi role, không13 agents tự chạy cả plan.
- [Runbook](worktree-execution/worktree-runbook.md) và [work item receipts](worktree-execution/work-items-and-handoff.md) pin actual base/gate/contract SHAs. Commit plan trước khi tạo worktrees.

## Review và validation
- Kết quả kiểm chứng plan/contracts và red-team được ghi ở [validation report](reports/plan-validation.md).
- Root policy/role startup/injection được kiểm chứng riêng tại [strict policy validation](worktree-execution/reports/strict-policy-validation.md); không chứng minh application hoặc agent chống được injection.
- Acceptance roadmap: **41 US (M1 31; M2 10), T01..T24/IR-01..IR-12**. M1 scoped web/IR + core acceptance theo PRD 8.5; T16..T20 campaign/native, T21 forecast và T22..T24 student là M2, calibration claims M3. Chỉ mark milestone sau same-version cutover và evidence tương ứng; AI score không là thưởng/ĐRL/confidence/authenticity/road safety.
- Effort/time fields cố ý bỏ theo yêu cầu. Active-plan helper absent trong repo; entrypoint là file này, không tạo helper giả.

## Handoff
Multi-worktree entrypoint: `/ck:cook /Users/vominhlong/seahackathon/floodops-application/plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/orchestrator.md`. Worker chỉ nhận đúng role prompt+receipt, không chạy root global cook riêng.
