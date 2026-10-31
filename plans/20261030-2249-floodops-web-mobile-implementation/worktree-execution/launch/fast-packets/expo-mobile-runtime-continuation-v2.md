Resume SAME worker 01a19067-c8ea-7435-9e24-fdaea01120e0 as sole expo-mobile; parent controls actual gpt-6.1-sol/ultra/fast. Do not spawn duplicate or edit another role.

WORK_ITEM=expo-mobile-runtime-continuation-v2; BASE_SHA=223a58654210e934dfb1eda1092be33a7fdc30fe; RECEIPT=plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/launch/expo-mobile/expo-mobile-runtime-continuation-v2.json; containing exact NEW_LAUNCH_SHA supplied out of band. Expected CWD /Users/vominhlong/seahackathon-worktrees/10-expo-mobile, branch feat/floodops-expo-mobile.

Read AGENTS.md, start-here, role/phase/specs, receipt and plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/amendments/backend-repairs-client-runtime-v1.json. Verify clean/existing own WIP checkpoint, exact launch/base/required gates ancestry, pinned policy/index and ALL raw-byte artifacts at source/index/launch. Idle worker may fast-forward from its already merged exact report. Active Sources must first receive parent safe-checkpoint update and preserve owned WIP before authorized merge. No reset/stash/rebase/force/movingHEAD. Frozen Bun1.4.0 install --ignore-scripts, no copied credentials/env/node_modules/state. Record startup acknowledgement.

Implement actual Expo Router one-app bootstrap/app routes/app.config/Metro and native SecureStore credential adapter, image-picker normalized upload pipeline adapter, FileSystem principal-scoped offline report drafts and foreground refresh/stream. Expo58/RN0.88 compatible Router/SecureStore/image-picker/FileSystem/crypto/network/gesture/reanimated/worklets peers supplied and modulePaths/watchman Jest issue fixed. Do not import DOM or @react-navigation (Expo58 Router API only); no credentials public env/URL/localStorage. Require SecureStore fail-closed behavior, namespace drafts/media by session/generation/principal and do not transfer A drafts to B just because same role. Test mounted participant change hides foreign draft fields immediately; explicit same-owner stale/Reset review-relink flow retains data without automatic deletion. Fix PlanScreen all-groups-ready/all-groups Execute: allow user-selected independently eligible closure, keep server latest plan/job/revision and hard guard, no auto Execute. Advice input fence: canonical ImageReviewJob has NO input_revision field. Capture observable report photo/input context and hide stale advice immediately when description/segment/capture/vehicle/media/status changes before async refetch. Do NOT compare unrelated global session revision or add a schema field: valid equal-revision job progress/unrelated mutation must remain current. Test manual decisions independent of AI failure and proper status rules. Run native render tests + offline local iOS/Android JS exports/Metro as reachable; these are NOT device/build/VoiceOver proof. app main expo-router/entry already set centrally. No prebuild/EAS/signing/device/account/resource/notification/GPS/paid actions. Real backend session adapter reachable, full backend business integration gated. Metro8082/API8790 loopback only; no LAN/tunnel.

Write ONLY amendment include paths minus existing global excludes/central protected files and exact own report. No package/lock/centralconfig/exports/policy/schema/gate edits; request exact minimal central seam if missing, continue independently reachable source. No full-role gate or silent next-scope transition.

Bun runtime batch includes ReactRouter8.5.1/Query5.105/ViteReact6.1.2, Expo58 recommended Router58.0.28/SecureStore58.0.2/ImagePicker58.0.10/FileSystem58.0.13 and matching peers. package names/versions committed, do not install other packages. Standard domain ./planning/./rewards exports+simulation dependency and API test-fixtures supplied. Known Zod3/deepmerge advisories not waived; release gated.

Canonical66API194schemas8tools,34US remain frozen. Web dispatcher-first; one Expo app by server user capability, driver own committed jobs/route/ETA only, contributor ownreports/simulatedpoints. AI advisory/manual-only; no probability score, fake0, autoAccept/Execute or optimisticcommitted assignment. No offline commandoutbox.

Implement/test real changed behavior via focused unit/render/Workerd tests and actual public runtime smoke. Do not call mocks/schema/device/model/paidImages checks equivalent. FullSources/Planner/Review/Results/backend/web/mobile not passed merely because partial runtime now authorized. Fail closed when a required genuine dependency is unavailable. Supply public composable entrypoints/Lead registration requests early.

Deliver signed source C followed by report-only childR at plans/reports/worktree-expo-mobile-expo-mobile-runtime-continuation-v2.md referencing C, return exact R out-of-band. No ownR selfreference, shared branch push/main/deployment/account/key/resource/provider/paid/EAS/prebuild/device/store action. Parent collects delivery and Lead merges. Continue until assigned slice truly implemented/tested or exact external blocker.

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
