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
- Chuẩn: [PRD v0.3, mục 3.4](../../FloodOps/prd.md), toàn bộ34 US gồm P1/P2. **Hai deliverable bắt buộc:** web app trong trình duyệt và một app native Expo cài trên iOS/Android; không responsive-only, PWA hoặc reporting-only companion.
- Web: React + React Router Data Mode + Tailwind CSS v4 + shadcn. Native: Expo Router/RN, shared tokens + native components + SVG isometric package adapter.
- Backend: Hono Worker + static web assets, Session Durable Object/SQLite + private R2; không D1/KV/SaaS accounts/live provider connectors.
- Delta prototype gốc no-DB: durable session và scoped capabilities để cross-device/reconnect an toàn, đã làm rõ trong PRD §3.4/9.1; xem [decisions](specs/decisions-prerequisites.md).
- Theo người dùng: web ưu tiên dispatcher; mobile ưu tiên driver/contributor và vẫn có dispatcher đầy đủ. Driver đọc phân công/tuyến/ETA đã commit, không nhận cuốc/turn-by-turn; workspace theo capability, không theo tên thiết bị.
- Cùng backend/session authority; UI/tương tác riêng theo nền tảng. Nghiệm thu phải có mobile report → web review → mobile status/points và mobile dispatcher Execute → web/driver cùng committed outcome.
- US-30 bổ sung AI nhận xét ảnh: ratings0–2 → code tính chất lượng0–100, match yes/no/unclear và lý do; chỉ advisory, manual review không phụ thuộc AI. Hai API mới và IR-01–IR-12 theo [image review spec](specs/ai-assisted-image-review.md).
- Không phân thời gian/effort, không viết code ứng dụng hoặc deploy trong bước này. Thứ tự dưới là dependency, không lịch thi.

## Phases
| # | Deliverable | Depends on | Status |
|---|---|---|---|
| 01 | [Workspace và contracts dùng chung](phase-01-workspace-contracts.md) | — | Pending |
| 02 | [Design system, token và isometric vector package](phase-02-design-system-icons.md) | 01 | Pending |
| 03 | [Scenario, graph tỉ lệ thực và simulator tất định](phase-03-scenario-graph-simulator.md) | 01 | Pending |
| 04 | [Hono session runtime, capabilities và consistency](phase-04-session-runtime-security.md) | 01 | Pending |
| 05 | [Nguồn, observation, report và upload ảnh an toàn](phase-05-sources-observations-media.md) | 03, 04 | Pending |
| 06 | [Commander, route tools, policy gate và Execute](phase-06-planning-safety-execution.md) | 03, 04, 05 | Pending |
| 07 | [Review cộng đồng/AI ảnh định lượng, conflict, gap và điểm exactly-once](phase-07-review-gaps-rewards.md) | 04, 05 | Pending |
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
- [API security](specs/api-conventions-security.md) · [Operational limits](specs/operational-limits.md) · [Testing matrix](specs/testing-strategy.md) · [Cloudflare/EAS release](specs/cloudflare-deployment.md).
- [Task manifest/DAG](implementation-tasks.json) · [Platform research](research/cloudflare-hono-platform.md) · [Web/native research](research/web-expo-design-compatibility.md).

## Execution và ownership
- Phase01 freeze contracts;02/03/04 có thể song song,05 sau03+04;06 sau05;07 sau05;08 sau06+07;09/10 song song khi upstream đủ;11 rồi12.
- Runtime harness phase04; full backend composition phase08; combined config phase11; deploy phase12. Khi chạy worktree, [ownership manifest](worktree-execution/roles.json) quyết định writer: central manifests/lock/entrypoint/config chỉ IntegrationLead ghi.
- Các implementation task đang pending; phase complete chỉ khi tests và smoke thực có evidence. Plan validation không là application verification.
- External gates: D04 data/licence/holdout, Images entitlement, OpenAI credits, Cloudflare account/domain, EAS/iOS/Android signing. Functional fixtures không thay D04 evidence.

## Agent roles và worktrees
- Đọc [root AGENTS.md](../../AGENTS.md), rồi [start-here exact role order](worktree-execution/start-here.md):13 roles có prompt/branch/worktree/ownership/ports/acceptance.
- [IntegrationLead](worktree-execution/orchestrator.md) dispatch theo DAG; [bootstrap/recovery](worktree-execution/agent-bootstrap.md) và [injection rules](worktree-execution/prompt-injection-policy.md) áp dụng mọi role, không13 agents tự chạy cả plan.
- [Runbook](worktree-execution/worktree-runbook.md) và [work item receipts](worktree-execution/work-items-and-handoff.md) pin actual base/gate/contract SHAs. Commit plan trước khi tạo worktrees.

## Review và validation
- Kết quả kiểm chứng plan/contracts và red-team được ghi ở [validation report](reports/plan-validation.md).
- Root policy/role startup/injection được kiểm chứng riêng tại [strict policy validation](worktree-execution/reports/strict-policy-validation.md); không chứng minh application hoặc agent chống được injection.
- Acceptance: all34 US, POL01–08/I1–I5/T01–T15 và US-30/IR-01–IR-12 covered; schema refs/DAG/client parity hợp lệ. AI score không là Observation confidence, authenticity hoặc road-safety probability.
- Effort/time fields cố ý bỏ theo yêu cầu. Active-plan helper absent trong repo; entrypoint là file này, không tạo helper giả.

## Handoff
Multi-worktree entrypoint: `/ck:cook /Users/vominhlong/seahackathon/floodops-application/plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/orchestrator.md`. Worker chỉ nhận đúng role prompt+receipt, không chạy root global cook riêng.
