Resume SAME existing review-rewards task 01a19064-77ea-75c7-a498-357c523c30d1, parent supplies actual sol/ultra/fast and exact containing NEW_LAUNCH_SHA. No duplicate or other role.

WORK_ITEM=review-rewards-runtime-foundations-v3; RECEIPT=plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/launch/review-rewards/review-rewards-runtime-foundations-v3.json; BASE_SHA=c335056c7aec373ef5ebec2d66bd46ce820746a3; CWD /Users/vominhlong/seahackathon-worktrees/07-review-rewards; BRANCH feat/floodops-review-rewards.

Read AGENTS/start-here/your original role+phase06or07/all linked relevant specs, receipt and amendment independent-business-runtime-v1. Verify clean own report, fast-forward/merge preserving history to exact launch; all required gate ancestry, pinned policy/index and every raw-byte artifact at source/index/launch. No moving HEAD/reset/stash/rebase/force or copied credentials/env/node_modules/state. Frozen Bun1.4.0 install --ignore-scripts. Startup acknowledgement first.

Implement reachable original phase07 SERVICES/JOBS/ROUTERS now using corrected rewards/active gaps and existing public pure Sources proposeObservationAcceptance/proposeConflictResolution/knowledge/reporting APIs. Build actual human review/conflict reducers atomically combining report+knowledge+gap+award+idempotency+revision/events under genuine DO; contributor-own dashboard/ledger and dispatcher reads, current epoch/vehicle projections. Do not accept via Source then separately award. Cross-client retry/races/crash-after-commit/duplicate normalized photo/late expiry/Reset must yield one report award/first-fill. Implement isolated AI advisory router/service/job/ImageReviewPort/provider adapter under reports/review, not Planner integrations. Generic durable ImageReviewMetadataPort reserve/read/start/complete is present. Use an explicitly typed injected normalized-image/readiness/digest/source-state port while full Source media factory delivery is pending; actual test media port is disclosed, not a production raw-byte fallback. Source owner will publish exact factory; provide constructor request so Lead adapts only public ports. Inputdigest binds actual normalized media+server report/session/generation/context/model/rubric, not unrelated operational revision. DO imageBinding reads only persisted normalized metadata; no R2/provider awaits in transaction. Model gets only self-contained C1 ImageReviewModelOutput schema, strict full output validation, server score/recommendation; no modelscore/authority. Implement IR01-IR11 actual local service/DO behavior including one call reservation/idempotency/quota/deadline/current pointers/equal-revision events/late human decision/Reset/expiry and manual independence. Missing provider/Images readiness returns canonical unavailable/null, no fake0/canned advice and no blocked human review. IR12 realvision remains explicitly unavailable without scoped grant. Contributor dashboard factory must use actor-owned reports/awards and current-scope coverage; no principal leak. Original reports parent and knowledge core belong Sources, do NOT edit them. Final full source/media integration and review-ready gate wait actual Source delivery.

Write only listed amendment paths minus global exclusions/central protected files and exact own report. Central manifests/lock/config/index/exports/gates/policy remain Lead. No public schema or producer signature fork. Existing Sources pure foundations are frozen; full Source service port only adopted after new Lead receipt, do not read sibling WIP. Missing injection is explicit unavailable, not permanent no-op implementation. Implement every reachable actual assigned path now, send precise dependency request early if needed.

All original PRD invariants and source/user capability boundaries apply: one backend/session across web/native, AI proposal only, manual decisions/Execute separate, no optimistic committed operations, no reward from AIscore, no offline command queue. No model/provider keys in URLs/logs/bundles. C1 remains66operations194schemas8tools/34US.

Use existing native fetch/AbortController/server hash and C1 getToolDefinitions/getImageReviewModelOutputSchema, strict full revalidation; no SDK dependency automatically needed. If adding dependency is genuinely required, request exact import/version/peers/licence, never bun add/central edit. Check official provider docs before adapter shape assumptions; no actual paid calls or credentials.

Run focused strict types/scopedlint/pure+actual HonoDO tests and executable public runtime smoke. Test providers/media declared fixtures NOT production fallback; real model/vision/device/calibration/Images-account gates remain unproved. Source/media full integration and original full phase gates still pending. No fake success from missing external resource.

Deliver signed sourceC then report-only childR at plans/reports/worktree-review-rewards-review-rewards-runtime-foundations-v3.md referencingC, returnR out-of-band plus exact public constructors/registry keys/lease hook/type requests EARLY. No remote push/main/deploy/provider/paid/device/EAS/account/key/resource/store actions. Finish assigned runtime slice, not only a report.

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
User: "triển khai làm tiếp cho done hoàn toàn api backend các thứ xong nối e2e frontend đi ní"
User: "Bây giờ spawn tiếp agent chạy, cố gắng rush thật nhanh hết mức có thể"
</transcript_evidence>
