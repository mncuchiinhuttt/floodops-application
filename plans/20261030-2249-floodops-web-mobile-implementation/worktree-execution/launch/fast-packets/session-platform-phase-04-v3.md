Resume the SAME SessionPlatform worker01a19032-cee6-734a-a967-a1f593f4b0ef, sol/ultra/fast actual settings managed by parent. Do not launch a duplicate writer. This is a narrow HTTP security/CORS correction, not a new feature.

NEW_WORK_ITEM=session-platform-phase-04-v3; NEW_BASE_SHA=30e058252d4176c76a8b17b40e25786f34b50b4c; NEW_RECEIPT=plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/launch/session-platform/session-platform-phase-04-v3.json; parent supplies exact containing NEW_LAUNCH_SHA. Expected worktree /Users/vominhlong/seahackathon-worktrees/04-session-platform, branch feat/floodops-session-platform. Previous signed clean R21d9dd831dbe19385bb82d4f7489b8ab25cf41a5 must be preserved.

Read receipt+amendment using git show NEW_LAUNCH_SHA:path, verify policy, C1 index/all306 artifact hashes and metadata-only BASE->launch; acknowledge baseline. Merge exact launch preserving history, no reset/rebase/stash/copy/moving HEAD. Frozen Bun1.4 install --ignore-scripts in your worktree. Existing API/test Node26 exception remains; app runtime is Workerd.

Read AGENTS.md, role04 and plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/amendments/session-platform-response-headers-v1.json. Scope ONLY app/create-app.ts, app/http.ts, features/session/stream.ts, session-runtime/README.md, test/capabilities/tsconfig.json, test/{capabilities,replay}/ and exact report. No manifests/lock/entrypoint/Lead tooling/gates or other owner source writes. No new dependency needed; existing @types/node26.6.6 explicitly provided.

Lead accepted exact6-path correction, merged264b0fdaba27fdee65680fa3045fe9530e3698c2 and independently reran73 real Workerd tests plus prior fault-injection privacy probe1 pass. New actual integration failure: middleware c.header security/CORS settings are discarded when send() / streamEvents() returns a new Response. Health returns null X-Content-Type-Options instead of nosniff in BOTH Bun/Hono and real Workerd. CSP/Referrer/allowed-Origin headers similarly need exercise. Retained Lead tests are tooling/bootstrap-health.test.ts and tooling/runtime/composition.workerd.ts; do not weaken or replace them. platform-ready is not published.

Fix response header composition consistently for successful JSON, typed errors/unknown routes,204,web cookies and SSE. Preserve CSP/nosniff/no-store/Referrer, strict Origin/CORS including credentials+exposed ETag/requestID/retry and no allow-origin for rejected origins; preserve correct body type/status/ETag/Set-Cookie/Retry-After. Test actual Workerd: allowed web preflight+readable JSON, native no Origin, bad Origin, 4xx/503/unknown errors,204 and SSE. No security bypass, source-only assertion, mock header echo or blanket catch.

Lead actual entrypoint now validates the integrated immutable synthetic functional bundle with Workerd node:crypto; checkpoint stores reference+state, no repeated graph/config. FOUR composed runtime tests pass for replay/persistence, bound invite/claim, Reset fencing and invalid hash/version. Only fifth header assertion fails; Bun tooling32 pass1 same failure. API and Lead tooling types/lint pass; test/capabilities tsconfig overrides types and must add node to match central API entrypoint (authorized one config path). Run full73+ tests, API and test strict types, scoped lint, bun test tooling and bun --bun run vitest run --config tooling/runtime/vitest.config.ts before delivery. No production test seed/fake projection; missing feature projections remain503 until owners implement.

Public wire remains66API/194schemas/8tools; no model/device/D04/preview/production/security acceptance claims. Calibration incomplete; high ExpoCLI Zod3/low deepmerge release blockers persist. Do not change pins, waivers, permissions or safety tests. No remote push/main promotion/deploy/account/resource/key/paid provider/device actions; loopback8784 only for own local diagnostics.

Deliver sourceC then report-only R at plans/reports/worktree-session-platform-session-platform-phase-04-v3.md referencingC; return exactR to parent. No self gate. Parent will pass to Lead for independent test+integration; SourcesMedia can launch once this concrete platform gate passes without waiting for UI.

<transcript_evidence>
User message Sentinel_b76954aabd7c8191a346161cc6ff7e86:
Catch-up FloodOps: bổ sung AI hỗ trợ review ảnh cộng đồng vào US-30, trên cả web và Expo mobile.

1. Trong màn Review hiện có, dispatcher chủ động bấm “AI nhận xét”. AI hỗ trợ:
- Chấm chất lượng ảnh.
- Mô tả nội dung nhìn thấy.
sharpness, lighting, scene_visibility, detail.
Model trả ratings; SERVER tính:
quality_score = floor(100 × tổng ratings / 8 + 0.5).

Ví dụ ratings (1,2,1,2) → 75/100.
Điểm này là chất lượng ảnh theo rubric, KHÔNG phải “75% ảnh thật”, “AI đúng 75%” hoặc “đường an toàn 75%”.

4. Gợi ý do server derive:
- Score <50 hoặc match=unclear → insufficient_evidence.
- Còn lại, match=no → needs_manual_check.
- Còn lại, score ≥75 → looks_consistent.
- Các trường hợp khác → needs_manual_check.
Mốc 50/75 là rubric UX, không phải ngưỡng an toàn. Ảnh 100/100 nhưng mô tả không khớp vẫn cần kiểm tra.

5. Boundary bắt buộc:
AI không tự Accept/Reject, mở đường, đổi confidence/TTL/vehicle scope, cộng điểm hoặc Execute. Duplicate kiểm bằng hash/code; thưởng theo rule server. Dispatcher vẫn quyết định thủ
công, kể cả AI đang chạy/lỗi/timeout. Không có kết quả thì result=null, không fake score=0.

6. API bổ sung:
POST /api/v1/sessions/{session_id}/reports/{report_id}/image-review-jobs
GET  /api/v1/sessions/{session_id}/reports/{report_id}/image-review
Dispatcher-only; POST body {}, Idempotency-Key. Tổng API thành 66 operations; giữ nguyên 8 Commander tools.

7. ReviewRewards sở hữu advisory service/job trong reports/review; SourcesMedia cung cấp normalized-image/digest port; SessionPlatform giữ durable metadata/lease/quota. Web/mobile
làm AI card trong Review. Giữ 13 roles và 9 waves.

Nguồn:
- FloodOps/prd.md — US-30 và §6.3.1
- plans/20261030-2249-floodops-web-mobile-implementation/specs/ai-assisted-image-review.md
- contracts/openapi.json, examples và testing-strategy.md trong cùng plan.

Nhờ IntegrationLead publish contract/baseline amendment trước khi các owner tiếp tục; không dùng receipt/hash cũ hoặc tự sync đè repo ứng dụng. IR-01–IR-12 là acceptance cần triển
khai; chưa có bằng chứng vision model/device đã chạy.
</transcript_evidence>


<transcript_evidence>
User: "cứ làm tiếp đi nhé xong rồi cứ tiếp tục task mới nhé, chạy nhiều task song song nếu được nhé"
</transcript_evidence>
