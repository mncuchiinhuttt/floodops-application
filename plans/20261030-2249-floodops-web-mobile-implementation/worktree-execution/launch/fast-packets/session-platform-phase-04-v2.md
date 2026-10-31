Resume the same SessionPlatform worker01a19032-cee6-734a-a967-a1f593f4b0ef. Fix the concrete verified event isolation regression now; this is a narrow phase04 correction, not a new business feature or permission expansion.

NEW_WORK_ITEM=session-platform-phase-04-v2; NEW_BASE_SHA=3f796bc0cb78d5d942f923945e73bb9738994134; NEW_RECEIPT=plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/launch/session-platform/session-platform-phase-04-v2.json; parent supplies exact NEW_LAUNCH_SHA as the containing commit. Worktree /Users/vominhlong/seahackathon-worktrees/04-session-platform; branch feat/floodops-session-platform.

Before edits verify clean signed previous report HEAD43a0553fd98ff79e1b22d61447c80534a71e0fef and no other writer. Read new receipt/amendment using git show NEW_LAUNCH_SHA:path, verify metadata-only BASE->launch and pinned policy/C1/gates, then explicitly merge exact NEW_LAUNCH_SHA preserving history. Do not reset/rebase/stash/copy or follow moving integration. Frozen Bun1.4 install --ignore-scripts in this own worktree; verify306 C1 artifact hashes and acknowledge the new baseline. Parent retains actual sol/ultra/fast settings; unavailable self-introspection remains unverified.

Read AGENTS.md, role04 and plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/amendments/session-platform-image-event-isolation-v1.json. Its work_items paths narrow your original role: only src/session-runtime/events.ts, its README, test/runtime-worker.ts and test/{replay,commands,capabilities}/ plus exact own report. Do not change manifests/lock/config, other platform files, receipts/gates or Lead entrypoint. No new package is needed.

Lead verified your exact44-path signed source/report, merged it and reran the real44 Workerd tests, source/test types and scoped lint successfully. A separate actual Hono/SQLite DO fault-injection probe then failed: an authenticated owner metadata reducer emitted image_review_changed with audience contributor and participantIds=[contributor participant]; contributor GET/events returned1 matching event, expected0. appendEvents forces dispatcher roles but retains participants; eventPage accepts role OR participant. This is downstream trusted reducer misconfiguration exposure, not proof public callers can register reducers.

Enforce dispatcher-only image_review_changed regardless of caller-supplied audience and explicit participantIds. Consider both persisted normalization and read-time protection for legacy/misdirected rows. Add real Workerd regressions covering explicit contributor/driver/viewer participant targeting, dispatcher visibility, hidden-event scan-cursor progress and JSON/SSE parity. Use the existing fixture registry/controlled SQL only for fault injection; never production stubs, empty/mock event handlers or weakened expectations. No image/advice text or credential payload may appear; preserve same operational revision and existing actor/capability/Reset/lease behavior.

Re-run full runtime suite including the final Reset change plus new regressions, API/test typechecks and scoped lint. Public API schemas remain66 operations/194 schemas/8 Commander tools; this bugfix does not require wire semantic edits. Keep code<200 lines. Existing high Expo CLI Zod3/low deepmerge qualifiers persist; no force major/advisory ignore/release waiver. No worker push/main merge/deploy/account/key/resource/paid provider/device actions. No sibling env/node_modules/state. Loopback8784 only if a local diagnostic is required.

Return sourceC then report-only R at plans/reports/worktree-session-platform-session-platform-phase-04-v2.md referencing C; send exact R out of band to parent. Do not self-publish platform-ready or implement Lead/business composition. Lead will compose the real registered class/bindings/scenario/feature ports from integrated producer exports; absent real scenario/business projections must not be replaced with synthetic production data. Work independently of DesignSystem and SimulationData; do not touch their sources or launch baselines.

<transcript_evidence>
User: "giúp tui chạy nhiều agents cùng lúc chạy trên nhiều worktree để làm các role đó theo plan, và toàn bộ source code tạo thêm cái folder con trong folder seahackathon để lưu và tạo repo private cho folder đó nữa nha"
User: "bạn giúp tui init repo các thứ trước rồi hẵn run các agents khác để làm nha"
User: "đã chỉnh xong nha ní"
User: "với coi bắt đầu triển khai lẹ đi ní, sao lâu vậy, coi triển khai trước những phần nào có thể làm rồi đi, bật 6.1 sol ultra thêm fast nữa đi"
User: "cứ làm tiếp đi nhé xong rồi cứ tiếp tục task mới nhé, chạy nhiều task song song nếu được nhé"
</transcript_evidence>

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
