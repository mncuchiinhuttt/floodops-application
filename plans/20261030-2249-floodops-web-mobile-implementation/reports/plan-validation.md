# Plan validation — FloodOps full application

## Kết luận
Bộ plan hoàn chỉnh ở mức tài liệu/contract, implementation status **pending**. Không viết application code, cài packages dự án, deploy, commit hoặc push trong bước này. User yêu cầu không phân thời gian được giữ nguyên.

Snapshot evidence bên dưới thuộc lần lập plan ban đầu, trước phần chia role/worktree. Kiểm chứng bổ sung tại [worktree validation](../worktree-execution/reports/validation.md); không coi số dòng overview cũ là kết quả kiểm hiện tại.

## Đã kiểm chứng thực sự
- Official OpenAPI3.1 structural schema: PASS; từng component JSON Schema2020-12: PASS.
- 64 operations /59 paths /186 component schemas;8 internal tool definitions.
- 19 positive/negative request-response examples và6 tool examples:25 outcomes đúng expectation.
- 1,551 internal/external local JSON references resolve; operation IDs unique, path parameters khai báo đầy đủ.
- 12 phases và88 detailed checklist steps; dependency order acyclic, required phase sections và manifest counts khớp.
- Coverage đủ34 US, POL-01..08, I1..5, T01..15, K1..6 và D01..09; API operation references tồn tại.
- Markdown fences/table columns/local file links PASS; overview55 lines (<80), không effort/time allocation fields.
- Mermaid architecture parse + render bằng pinned Mermaid11.12.1 trong browser:8 nodes,1052×333px, viewport1100px; screenshot xem được, không overflow. Tab đã đóng.

Máy đọc được: [validation-results.json](validation-results.json). Những check trên là plan/schema checks, **không phải unit/E2E/device tests của application**.

## Adversarial review
- [Resolution table](red-team-resolution.md):7 unique High accepted+resolved,0 Critical; cả source reviewers đã narrow recheck original findings và xác nhận closure.
- Resolved latest-plan supersession; Reset body-loss/cookie rotation; persisted reset isolation; advance crash recovery; scoped media paths; phase readiness cycle; candidate pickup-hub routing.
- Security/platform/ownership fixes đã propagate contracts, specs, tests được lập kế hoạch, manifest và phase files.

## Handoff và task hydration
- [implementation-tasks.json](../implementation-tasks.json) là persistent dependency/ownership handoff. 12 phase tasks +5 critical steps được đưa vào session tracker ở trạng thái blocked/pending execution vì user chỉ yêu cầu plan.
- Active-plan helper `.claude/scripts/set-active-plan.cjs` không có trong repo; không tạo helper giả hoặc sửa local skill config. Dùng absolute plan path.
- TaskCreate metadata effort cố ý bỏ theo user. Runtime todo tool không hỗ trợ dependency metadata; DAG authoritative nằm manifest, không giả đã gắn addBlockedBy vào tool không có field đó.
- Multi-worktree dùng [IntegrationLead orchestrator](../worktree-execution/orchestrator.md) rồi role prompt+receipt riêng. Không chạy global cook root plan trong từng worker.

## Chưa được chạy và external gates
- Không build/lint/unit/API/E2E/device suite nào của ứng dụng: repo hiện chưa có application implementation.
- D04 calibrated dataset/holdout/licence, Images entitlement, OpenAI model/key/budget, Cloudflare account/domain, EAS/signing/store credentials cần evidence theo [prerequisites](../specs/decisions-prerequisites.md).
- Không claim đạt KPI/hiệu chuẩn, runtime native SVG/SSE hoặc deployment thành công từ docs/API compatibility research.
- Package patch versions/toolchain phải freeze và security/licence check khi implementation. Docs-seeker Context7 fetch không thấy docs, đã fallback primary documentation links trong research notes.
- Optional local dependency scanner extension không chạy (sidecar/env port absent); không thêm project dependency, không claim đã vulnerability-scan package supply chain.

## Validation method
Dùng Python jsonschema hiện có cho OAS meta-schema/component/request-response/tool payloads; kiểm `$ref`, path parameters, US/API coverage, Markdown links/fences/tables và checklist/DAG bằng throwaway evaluation. Không để generator/test scaffolding trong app. Chỉ giữ contract examples và report để implementer tái lập.

## Bổ sung làm rõ web/native theo người dùng

- [PRD §2.1/3.4/9.1/DoD/D05](../../../FloodOps/prd.md) nay xác định hai deliverable: web trong trình duyệt và một app Expo native cài iOS/Android; không còn mô tả native như phần production để sau MVP.
- Web ưu tiên dispatcher; mobile ưu tiên driver/contributor, vẫn có dispatcher đầy đủ. Driver đọc own committed assignment/route/ETA và gửi report; contributor gửi ảnh, đọc own status/points. Không thêm accept/reject cuốc, turn-by-turn, GPS tracking, app người nhận hoặc payout.
- Đã đồng bộ root plan, architecture/planning contract, [surface matrix](../specs/web-mobile-feature-surfaces.md), phase09/10/11 và hai UI-role prompts. Hai route/screen cho own driver workspace và own community report history được ghi tường minh; dùng API đã có, không thêm endpoint.
- Kiểm chứng bằng throwaway evaluation:10 tài liệu cập nhật,134 local file links, Markdown fences/tables PASS;34 US cùng toàn bộ functional/safety/acceptance rows giữ nguyên;64 API operations giữ nguyên. OpenAPI, role/task manifests và root policy byte-for-byte không đổi.
- Bốn planned UI paths mới tường minh khớp đúng một existing owner; checklist counts phase09/10/11 và overview <80 dòng giữ đúng. Các scenario report→review→feedback, native Execute→shared outcome và stale/Reset là **nghiệm thu được yêu cầu**, chưa phải log chạy.
- Đây là document/contract consistency verification, không application suite, browser/native device test hay injection evaluation. Không sửa/sync repo `floodops-application`, không commit/push/deploy. IntegrationLead cần publish/amend baseline có tài liệu mới trước khi worker đang dùng bản cũ tiếp tục; không tự làm mất hiệu lực receipt hoặc grant.
