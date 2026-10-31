You are review-rewards, sole writer for an explicitly narrow independent later-wave domain slice. Parent must actually launch gpt-6.1-sol/ultra/fast. Do real code/tests, not a plan. Do not spawn another role or duplicate writer.

ROLE_ID=review-rewards; WORK_ITEM=review-rewards-domain-foundations-v1; RECEIPT=plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/launch/review-rewards/review-rewards-domain-foundations-v1.json; BASE_SHA=8074d280b8c315b96df7ba018311690e050a718b; parent supplies exact containing LAUNCH_SHA. Expected worktree /Users/vominhlong/seahackathon-worktrees/07-review-rewards; branch feat/floodops-review-rewards.

Read AGENTS.md, role prompt/phase and relevant frozen PRD/specs/policy plus receipt/amendment before edit. Verify clean exact launch, ancestry/gates, policy and all371 indexed artifacts (including raw PNG bytes) at indexed source/index/launch. Use the supplied byte-safe verifier; no UTF8 image hashing, no bypass. Frozen Bun1.4.0 install --ignore-scripts, own worktree/state only, no copied env/node_modules. Record startup/model metadata if exposed, otherwise unverified.

Read plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/amendments/independent-downstream-domain-v1.json. This amendment NARROWS full role scope and explicitly defers platform/sources gates for only these pure functions. ONLY packages/domain/src/rewards/, apps/api/src/features/reports/review/rubric/, apps/api/test/{review,rewards,coverage}/ and own exact report. No other review service/controller/router/DO/provider/media/knowledge commit writes. Central manifests/exports/lock/config/receipts/gates/AGENTS stay Lead-owned; no wire changes, other-owner edits or API scaffolds.

Implement the real pure server advisory rubric under reports/review/rubric, separate from reward code. Consume C1 ImageReviewModelOutput strict validation; score=floor(100*sum(ratings)/8+0.5), four integer ratings0..2. Server derives recommendation in exact precedence: score<50 OR unclear=>insufficient_evidence; else match=no=>needs_manual_check; else score>=75=>looks_consistent; else needs_manual_check. Model text is only bounded data; no authority fields, no confidence/safety/authenticity percentage, no knowledge/award/Execute effect.

Exhaustively exercise all81 rating combinations times3 match states=243 cases using exact frozen enum/rubric, and boundaries50/75, (1,2,1,2)=>75, score100+no=>manual. Reject unknown authority/points/condition/TTL fields, invalid rating/floats/nonfinite/missing fields/overlong strings using canonical constraints. No result stays null, never fake0. Do not import PlannerSafety provider internals, call any provider, read image bytes or implement job/lease/router before fresh full receipt.

Implement independent pure useful-coverage/gap/reward ledger proposal transitions in domain/rewards using canonical wire report/knowledge/gap/award shapes and explicit server-owned state/config/time. Fresh accepted current nonunknown nonconflict relevant segment+vehicle+epoch can count coverage even low confidence; still not route approval. Opening/filling gap occurrences, duplicate normalized hash across contributors, report uniqueness and first-fill unique gap must be deterministic immutable transitions. Use configured award values/eligibility; missing essential config fails explicitly, no arbitrary constants. Expiry can open a new occurrence without clawback or awarding the same old report twice; Reset seeds a separate empty ledger.

Source acceptance/conflict normalization is an unmerged producer: do not invent/copy that implementation or mutate its state. Test the pure eligibility/proposed ledger using canonical accepted-evidence inputs; unresolved conflicts/closure remain in force, no pure award proposal can auto-review/open road. Durable atomic acceptance+knowledge+gap+award, race/crash-after-commit/idempotency and actor authorization are DEFERRED to full source/runtime integration; do not claim those from an in-memory test. Actual tests should prove same input replay/duplicate report/photo/new contributor, redundant/expired/conflict/vehicle/epoch cases and immutable prior ledger, in addition to243 rubric cases. Keep AI rubric entirely unable to alter human decision/reward state.

Use public frozen contracts66API/194schemas/8Commander tools and integrated simulator functional_fixture only. Domain imports no Bun/Node/Hono/Cloudflare/React/provider, no hidden Date.now/random/network. API-side rubric remains a pure isolated function without runtime import/effects. Exact own public index can be referenced relatively from own tests until Lead maps package exports after source exists; request precise central needs, never fake unmerged seams. Files<200 lines, strict types/scoped lint, actual tests/smoke; no source-string/mock-echo gate or weakened safety assertions.

Existing platform73+privacy1 Workerd tests pass; separate HTTP header defect is in SessionPlatform phase04v3. Root tooling has one retained header-red assertion unrelated to this slice; do not fix/waive it or call full backend ready. Qualified simulation55tests4979assertions plus full CLI smoke passed but D04 provenance/licence/holdout/tolerances remain missing, Calibration incomplete. High ExpoCLI Zod3/low deepmerge remain QA/release blockers. This partial work is not phase06/07/planner-ready/review-ready, durable security/race proof, device/model/calibration or app acceptance.

Deliver signed sourceC then report-only childR at plans/reports/worktree-review-rewards-review-rewards-domain-foundations-v1.md referencingC, never ownR. Return exactR/public exports/checks/limitations/central requests to parent. Do not push remote, merge siblings/main, change role/gates or auto-start full phase. Parent/Lead review and issue full continuation on real predecessor gates. No account/resource/key/new paid service/provider/model/Images/device/preview/production actions. Ports8787 only own loopback diagnostic if needed, no0.0.0.0.

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
User: "soa mới tới wave 2 vậy, làm nhanh lên còn nhiều wave khác nữa mà, chạy nhiều agents cùng lúc làm thêm đi"
</transcript_evidence>
