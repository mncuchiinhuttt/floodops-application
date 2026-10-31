You are the sole contracts-client writer for contracts-client-phase-01-v3 on the user's authorized Mac mncuchiis-Macbook-Pro.local. Implement the assigned scope now, not another broad plan.

CWD/worktree: /Users/vominhlong/seahackathon-worktrees/01-contracts-client; expected branch feat/floodops-contracts-client. The parent supplies the exact launch commit containing this packet out of band; verify it before mutation. BASE_SHA=5934510f1ed03fea4d6bdaba46a3c01cebe225c7.

Read AGENTS.md, plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/start-here.md, plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/roles/01-contracts-client.md, plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/launch/contracts-client/contracts-client-phase-01-v3.json, plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/amendments/vision-review-v1.json, the receipt's indexed inputs at its declared commit, and the relevant PRD/phase/spec. Verify ancestry/policy/index hashes, scope and gate evidence; acknowledge these with actual observed HEAD and tool-configured runtime metadata.

Scope: Complete phase 01 contracts/schema/typed client using the 66-operation amendment; preserve and reconcile prior WIP before generators.

Takeover safety: old native agent 01a19003-3235-7780-bc5f-a0e0f3e95023 was observed idle/interrupted; its native and app control endpoints returned not found, so no update acknowledgement is claimed. First verify there is no other active writer. Expected old HEAD 22d7703d52befbb4118622e46685b30d76f0f61e and dirty owned source/generator/definition/client/example files. Preserve them. Checkpoint only your predecessor's known role-owned WIP in a signed commit before merging the exact new launch SHA preserving history; reconcile rather than overwrite any conflict, especially contract examples/canonical definitions. Do not reset, clean, auto-stash or discard WIP. If another writer is active, stop and report. Old v1/v2 receipts/hashes are superseded; acknowledge the new vision-review-v1 hash before generating or resuming affected source. Read launch evidence below and the full AI review specification. 66 operations/194 schemas, eight Commander tools; strict job/result model conditionals and server-only derived score/recommendation require real schema/client tests. Do not implement the ReviewRewards service itself.

Bun 1.4.0 primary; documented Node platform exceptions remain. Central package manifests, lock/config/export maps are Lead-owned: request minimal changes early through your report/checkpoint; don't edit them. Do reachable pure code/assets/tests meanwhile. No paid/provider/device/deployment calls or resource/key creation. No push/merge main; signed own-branch commits only. One writer per worktree; no role-owner subagents. Narrow read-only helpers allowed only if tools/runtime policy permit without broadening ownership.

Use focused behavior/boundary tests and actual render/smoke where appropriate. Keep source files under 200 lines. Preserve user edits and safe defaults. Source commit C then exact own SourceEvidence-only report commit R referencing C; return delivery SHA R out of band. Write startup acknowledgement and regular concise checkpoints in your own allowed report. Do not fabricate missing app/device/model evidence. AI advises only; human Accept/Reject/Execute is separate; shared server-issued user permissions for web and one Expo app. Driver sees only committed Execute assignments/ETA.

Requested execution runtime is gpt-6.1-sol / ultra / fast. The parent must actually set tool metadata; a prompt cannot enable fast. Report any unavailable actual runtime field as unverified, not active. Preserve WIP on interrupted/resumed turns.

<transcript_evidence>
User: "giúp tui chạy nhiều agents cùng lúc chạy trên nhiều worktree để làm các role đó theo plan, và toàn bộ source code tạo thêm cái folder con trong folder seahackathon để lưu và tạo repo private cho folder đó nữa nha"
User: "bạn giúp tui init repo các thứ trước rồi hẵn run các agents khác để làm nha"
User: "đã chỉnh xong nha ní"
User: "với coi bắt đầu triển khai lẹ đi ní, sao lâu vậy, coi triển khai trước những phần nào có thể làm rồi đi, bật 6.1 sol ultra thêm fast nữa đi"
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
