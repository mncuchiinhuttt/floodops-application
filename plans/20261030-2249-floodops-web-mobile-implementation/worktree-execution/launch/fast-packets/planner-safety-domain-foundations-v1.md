You are planner-safety, sole writer for an explicitly narrow independent later-wave domain slice. Parent must actually launch gpt-6.1-sol/ultra/fast. Do real code/tests, not a plan. Do not spawn another role or duplicate writer.

ROLE_ID=planner-safety; WORK_ITEM=planner-safety-domain-foundations-v1; RECEIPT=plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/launch/planner-safety/planner-safety-domain-foundations-v1.json; BASE_SHA=8074d280b8c315b96df7ba018311690e050a718b; parent supplies exact containing LAUNCH_SHA. Expected worktree /Users/vominhlong/seahackathon-worktrees/06-planner-safety; branch feat/floodops-planner-safety.

Read AGENTS.md, role prompt/phase and relevant frozen PRD/specs/policy plus receipt/amendment before edit. Verify clean exact launch, ancestry/gates, policy and all371 indexed artifacts (including raw PNG bytes) at indexed source/index/launch. Use the supplied byte-safe verifier; no UTF8 image hashing, no bypass. Frozen Bun1.4.0 install --ignore-scripts, own worktree/state only, no copied env/node_modules. Record startup/model metadata if exposed, otherwise unverified.

Read plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/amendments/independent-downstream-domain-v1.json. This amendment NARROWS full role scope and explicitly defers platform/sources gates for only these pure functions. ONLY packages/domain/src/planning/ and apps/api/test/{policy,planning,execution}/; own exact report. ALL API feature routers, OpenAI/controller/jobs/DO/Execute commits deferred. Central manifests/exports/lock/config/receipts/gates/AGENTS stay Lead-owned; no wire changes, other-owner edits or API scaffolds.

Implement a real pure deterministic policy/candidate evaluator and dependency/group closure, consuming frozen wire schemas and actual @floodops/simulation and @floodops/domain/operations public exports. Reuse assignment/capacity/defer/projected physics and objective implementations, do not copy/fork them. Evaluate server-owned captured snapshot, explicit clock/config, full candidate/group selection and explicit approval bindings; no live provider/HTTP/DO dependency.

Implement relevant POL01..08/I1..I5: authoritative closure/effective impassable hard-block by vehicle at entry, unresolved conflict hard-block, expired evidence needs replan, ordinary unknown/low needs exact action+plan+revision approval. Approval never overrides hard rules; clear uncertainty never means safe-road probability. Preserve original tier/SLA, custody and transient capacity/pickup/hub/turn constraints. Validate group/dependency cycles/missing refs and combined candidate consistency. POL05 lexicographic objective uses the same H/snapshot/physics, no weighted standard benefit overriding critical loss. Defer only standard within configured cumulative cap; no invented default when missing.

Proposals/readiness do NOT mutate committed route/assignment/ETA or execute. Pure stale/latest-plan/job/generation predicates can be tested with explicit trusted expected IDs, including same-revision supersession, but cannot claim durable race/idempotency proof without later DO composition. No stub atomic executor, Commander8 implementation, AI adapter or feature handler in this slice. Future Sources knowledge comes from canonical SegmentKnowledge/server-owned explicit inputs only; no fabricated SourcesMedia API/type fork.

Actual pure tests should cover every reachable hard/soft/freshness/epoch/vehicle/approval boundary, combined dependent action rejection, critical/SLA/custody/load/hub/defer negatives, same-revision superseded ID and non-mutation. Exercise a real canonical functional scenario/projectCandidate path for candidate evaluation, not just mocks/DTO echoes. Publish exact pure evaluator/group/compiler interfaces and consumer integration needs within owned planning module docs.

Use public frozen contracts66API/194schemas/8Commander tools and integrated simulator functional_fixture only. Domain imports no Bun/Node/Hono/Cloudflare/React/provider, no hidden Date.now/random/network. API-side rubric remains a pure isolated function without runtime import/effects. Exact own public index can be referenced relatively from own tests until Lead maps package exports after source exists; request precise central needs, never fake unmerged seams. Files<200 lines, strict types/scoped lint, actual tests/smoke; no source-string/mock-echo gate or weakened safety assertions.

Existing platform73+privacy1 Workerd tests pass; separate HTTP header defect is in SessionPlatform phase04v3. Root tooling has one retained header-red assertion unrelated to this slice; do not fix/waive it or call full backend ready. Qualified simulation55tests4979assertions plus full CLI smoke passed but D04 provenance/licence/holdout/tolerances remain missing, Calibration incomplete. High ExpoCLI Zod3/low deepmerge remain QA/release blockers. This partial work is not phase06/07/planner-ready/review-ready, durable security/race proof, device/model/calibration or app acceptance.

Deliver signed sourceC then report-only childR at plans/reports/worktree-planner-safety-planner-safety-domain-foundations-v1.md referencingC, never ownR. Return exactR/public exports/checks/limitations/central requests to parent. Do not push remote, merge siblings/main, change role/gates or auto-start full phase. Parent/Lead review and issue full continuation on real predecessor gates. No account/resource/key/new paid service/provider/model/Images/device/preview/production actions. Ports8786 only own loopback diagnostic if needed, no0.0.0.0.

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
