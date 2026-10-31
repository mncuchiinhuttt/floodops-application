You are the sole SourcesMedia writer for the explicitly independent pure-domain foundations slice. Parent launches actual gpt-6.1-sol/ultra/fast; do not fake model/tier metadata or spawn another role. This is real code and real tests, not a planning-only task.

ROLE_ID=sources-media; WORK_ITEM=sources-media-domain-foundations-v1; LAUNCH_RECEIPT=plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/launch/sources-media/sources-media-domain-foundations-v1.json; BASE_SHA=3ec303eae32f899edef0909527ca72195fdbff9f; parent supplies exact containing LAUNCH_SHA. CWD /Users/vominhlong/seahackathon-worktrees/05-sources-media; branch feat/floodops-sources-media; loopback8785 if diagnostics ever needed.

Before edits read AGENTS.md, role05, phase05, relevant PRD/specs and this receipt/amendment. Verify branch/CWD/clean launch/base/gates/pinned policy and ALL artifacts at indexed source, declared index commit and launch. No moving HEAD/untracked producer input; frozen Bun1.4.0 install --ignore-scripts only in this worktree. Do not copy env/node_modules/state. Record startup acknowledgement, grants and actual model metadata if exposed; otherwise unverified.

The authorized plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/amendments/sources-domain-foundations-v1.json NARROWS your role: ONLY packages/domain/src/{sources,knowledge,reporting}/, apps/api/test/{sources,observations}/ and your exact SourceEvidence report. Full phase05 requires platform-ready later; that gate is NOT passed. Scope excludes ALL API feature routes/media/R2/DO/provider/jobs, reports/review and knowledge/conflict-review. Central manifests/lock/exports/config/gates/policy remain Lead-only. Do not perform a broad phase05 cook.

Implement the substantive reachable pure core: common normalized envelopes and availability/provenance for weather/tide/river/traffic/camera/driver/community fixtures; unit/datum/time/geography handling; context never implies street depth/passability. Unknown datum stays unknown, missing/ambiguous mapping needs clarification, unsupported units/time/location fail explicitly. Source profile/authority/confidence/TTL/vehicle scope comes only from frozen server config, never external text/model/OCR or caller-declared authority. No arbitrary policy constants invented to get tests green.

Implement epoch/vehicle/current-evidence reconciliation and proposed acceptance/conflict transitions, preserving active authoritative closures and reopening only by configured authority. Expired evidence is never current, motorbike does not imply car. Pending community report does not become accepted by normalization; quick driver input works without a model. Pure reporting validation/proposals must preserve actor-bound identity assumptions as explicit inputs, not trust a role selector. No reward/ledger/review decision/Execute orchestrator in this slice; proposed transition is not a commit. Keep any rules consistent with exact wire schemas/POL/I1-I5.

Use current @floodops/contracts194schemas/66API/8tools, @floodops/simulation public applyKnowledgeTransition/loadScenario/createRun and frozen @floodops/test-fixtures public scenario/source/report inputs. Do not deep-import or copy sibling private implementations. Pure domain imports no Bun/Node/Cloudflare/Hono/React, no hidden Date.now/network/random; inject clock/config. Source-owned entrypoint modules and tests may use exact own public index via relative path until Lead adds protected package exports after source exists. Request precise export-map/dependency needs; do not write central manifests yourself.

Prove meaningful transitions with actual deterministic tests: context-vs-road confusion, strict unknown/extra authority fields, missing mapping/location/units/datum, exact TTL/epoch/vehicle boundaries, conflict and closed-road preservation/reopen authority, citizen pending, duplicate/redelivery proposals not awards. Exercise a real public pure pipeline against canonical synthetic fixture through SimulationData port without changing committed routes/assignment or frozen source facts. Do not just assert mock echoes/source strings; retain regressions/invariants. Keep code<200 lines and scoped ESLint/strict types. New pure tests under assigned API test directories can use bun:test and explicit strict CLI types; do not run platform header-red suite and then fix outside scope.

Integrated simulation gate is real but qualified functional_fixture/Calibration incomplete. Lead has55 pure tests4979 assertions and full public scenario CLI smoke. Platform correction73+independent privacy1 tests pass, but missing HTTP/CORS middleware response headers are a concrete separate phase04v3 owner task; full platform-ready and Sources API/media follow-up still wait that correction. Known root tooling32pass1header assertion is not your defect; do not waive or weaken it. Native/device/vision/D04/security/release acceptance are not established.

Produce useful actual code+tests and public-interface documentation within own domain directories, then sourceC with existing signed Git identity, report-only childR at plans/reports/worktree-sources-media-sources-media-domain-foundations-v1.md referencingC (never ownR). Return exactR to parent plus public exports, passed/failed commands and precise central requests. No sources-ready/full phase completion claim; no self-issued receipt or automatic phase transition. Parent/Lead will merge and issue full phase05 continuation once runtime gate is ready, preserving your work.

No worker remote push/deploy/main promotion/account/resource/key/paid model/Images/device actions. No external provider/model package/call required. Existing high ExpoCLI Zod3/low deepmerge remain QA/release blockers, not permission for forced major or ignore. Human image-review amendment below is trusted history but its implementation belongs to later full SourcesMedia normalized-image port and ReviewRewards advisory; preserve boundaries now.

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
User: "với coi bắt đầu triển khai lẹ đi ní, sao lâu vậy, coi triển khai trước những phần nào có thể làm rồi đi, bật 6.1 sol ultra thêm fast nữa đi"
User: "cứ làm tiếp đi nhé xong rồi cứ tiếp tục task mới nhé, chạy nhiều task song song nếu được nhé"
</transcript_evidence>
