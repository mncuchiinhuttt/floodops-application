# DRAFT — NOT AUTHORIZED TO LAUNCH

Prepare SourcesMedia only after actual simulation-ready + platform-ready and ContractsClient ancestry are integrated. Read its role/phase05 and the draft JSON beside it. BASE/LAUNCH/combined interface index are deliberately absent until producer delivery, review and focused post-merge evidence exist. Do not copy unmerged worker ports, guess producer signatures or reuse a foundation/old design hash.

Target worktree 05-sources-media, branch feat/floodops-sources-media, port127.0.0.1:8785. One writer, own source/excludes and report as role prompt; reports/review and knowledge/conflict-review stay ReviewRewards-owned. Manifests, bindings, migrations and aggregate exports stay Lead-owned. No new third-party package is currently justified: C1/Hono/Workers test stack exists; add only exact reviewed workspace/export/binding requests after producer ports freeze.

## Integration evidence to obtain after implementation

- Real Hono->DO->local private R2 path: actor-derived identity/Origin-CSRF/native bearer; wrong-session/resource refs do not disclose private objects.
- Reserve->bounded streaming upload->sniff/dimensions/decode/normalize->atomic complete; enforce 5,242,880 actual bytes without trusting Content-Length and 4096-per-side limits. JPEG/PNG mismatch, truncated files, SVG/HTML/animation and decompression bounds must fail safely. Actual decoded derivative strips EXIF/location; unavailable transformer fails controlled, never raw fallback. Mocks do not prove normalization.
- Crash/Reset/expiry between R2 output and DO completion cannot attach old-generation images. Durable orphan/delete outbox retries, session-owned generated keys only; never delete shared SCENARIO_ASSETS.
- Authorized derivative GET is owner/reviewer scoped, no-store/nosniff with explicit type; raw staging and arbitrary URLs are never exposed/fetched.
- Same idempotency key/body replays stable result, changed body conflicts; quota reservation/release and duplicate normalized hash are server-derived/session-scoped. No award at raw submit or duplicate check.
- Weather/tide/river context cannot imply street depth/passability; stale evidence/epoch/vehicle/mapping ambiguity cannot silently become accepted. Pure proposed knowledge transitions do not bypass ReviewRewards atomic composition.
- New normalized-image port binds authorized pending report/session/generation/media/readiness/digest and returns verified derivative only. It never calls vision, changes confidence/TTL/vehicle scope, auto-reviews/rewards or Executes. Test late input/report/Reset changes and no sensitive advice/image in event/log payloads.
- Recheck 66 API/194 schema/eight Commander drift and consumer public-interface imports; source/report evidence C->R then exact delivery to parent. Keep real model, physical device, D04/calibration and Images entitlement/quality evidence separate.

Run preflight before issuing a real receipt:

`bun tooling/orchestration/verify-producer-gates.ts EXACT_INTEGRATED_CANDIDATE contracts-ready simulation-ready platform-ready`

Exit2 means committed prerequisite evidence is blocked, not a feature test failure and not authorization to invent gates. Even exit0 checks only coordination; producer semantic/runtime tests and trusted authority remain mandatory.

## Human image-review amendment to carry into the authorized prompt

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
