Resume SAME existing simulation-data cloud task 01a19021-eb66-726b-9a3c-447d01c1c0d3; parent controls actual sol/ultra/fast. No duplicate writer/other role.

ROLE_ID=simulation-data; WORK_ITEM=simulation-data-scope-conflict-v3; NEW_BASE_SHA=3cebe9e8d8b4fd4fd11cd319b1549952c119caa5; NEW_RECEIPT=plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/launch/simulation-data/simulation-data-scope-conflict-v3.json; parent supplies exact containing NEW_LAUNCH_SHA. Expected CWD /Users/vominhlong/seahackathon-worktrees/03-simulation-data; branch feat/floodops-simulation-data; previous clean signed report HEADf327ea3120d00042da62a1a700a784c4aedb594e must be preserved.

Read new committed receipt/amendment via git show NEW_LAUNCH_SHA:path before mutation. Verify clean previous R, pinned policy/index/all raw-byte artifact hashes and required gate ancestry; BASE->launch metadata only. Merge exact NEW_LAUNCH_SHA preserving history, never reset/rebase/stash/copy or track moving integration. Frozen Bun1.4.0 install --ignore-scripts own worktree, no env/node_modules/state copy. Acknowledge new baseline and actual model metadata if exposed, else unverified.

Read AGENTS.md, role/phase and plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/amendments/full-source-platform-continuation-v1.json. Its work_items inclusion and manifest ownership/exclusions define exact scope; Lead protected files still denied.

Resume ONLY narrow producer consistency correction: packages/simulation/src/scenario/validate-knowledge.ts, packages/simulation/README.md and tests under simulation/test/{scenario,movement}/. No domain/source/reporting/fixture data/contracts/other simulation implementation/central files changed. This is a real bounded bugfix, not another whole phase.

Source partial integrated and public @floodops/domain/{sources,knowledge,reporting} exports now exist. Inspect amendment known_defect, source report and current guard/tests. Current known-state validator observations.some(item=>item.has_conflict||item.condition!==knowledge.condition) treats Observation.has_conflict globally. A shared accepted normal observation for bike+car and fresh contradictory bike-only observation means bike is unresolved but car has only consistent normal evidence; global shared flag true wrongly rejects known car.

Derive consistency from actual relevant segment/vehicle/current epoch/available fresh supporting conditions, not global conflict bit as a per-scope veto. Preserve actual current contradictory evidence hard conflict, no omission/subset trick, TTL/profile/closure/reopening/vehicle/epoch validation and all frozen safety invariants. Do not simply ignore real conflict or alter wire schema/global metadata to hide it. Explain exact semantic treatment in README.

Add actual public loadScenario/applyKnowledgeTransition regressions for shared multi-vehicle evidence with conflict in only bike, consistent car known, both scoped conflict, reversed vehicles, expired/future/other epoch observations and restricted closure unchanged. Test true unsupported consistent/fake-known projections still fail. New split-per-vehicle source pipeline already passes; legacy shared case must work at producer seam, not only compare DTOs.

Do NOT edit/remove SourcesMedia reconcileEvidence SOURCE_SCOPE_INCOMPATIBLE guard or its tests; that consumer is separately owned and remains until your producer delivery is integrated and fresh consumer continuation is authorized. You may call public Source deriveKnowledgeSnapshot for a diagnostic/test if useful, no deep imports/private copy. No new registry package/manifest change needed. Re-run55+ pure simulator/fixture tests, strict source/tests types, focused lint and full CLI smoke. No source-ready/calibration/backend/model/device gate claim.

Code<200lines, public entrypoints only, domain portable and explicit clock/config, strict schemas and no hidden I/O. C1 remains66operations194schemas8Commander tools. No worker push/main promotion/deploy/account/resource/key/new paid provider/model/Images/EAS/device/store actions. Loopback own role port8785/8783 only if needed; no LAN. D04/licence/holdout/calibration remain missing; no fake ROI/safety/model quality. Existing high ExpoCLI Zod3/low deepmerge remain release blockers; no ignore/forced major.

Deliver signed SourceC then direct report-only childR at plans/reports/worktree-simulation-data-simulation-data-scope-conflict-v3.md referencingC, never ownR. Return exactR/public exports/actual commands/errors/failures/limitations and central integration requests to parent. Do not self-publish gate or automatically change phase. Parent owns launches/messages, Lead merges exact evidence.

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
User: "spawn thêm để làm các wave khác nữa đi ní"
</transcript_evidence>
