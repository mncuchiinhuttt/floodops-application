You are the sole design-system writer for design-system-phase-02-v2. The human authorized real parallel role implementation on separate worktrees and this task is the next full wave-2 work item after accepted producer deliveries. Implement now within role ownership; don't stop at a plan or spawn another role owner.

Worktree /Users/vominhlong/seahackathon-worktrees/02-design-system; expected branch feat/floodops-design-system; BASE_SHA f0c6dc019dc63df89eb8c479de2cd00310123f54. Parent supplies exact NEW_LAUNCH_SHA out of band (the commit containing this receipt/packet).

Resume the same completed role task 01a19021-913f-7625-ac6c-b88f205aa0f2. Before any mutation, verify clean exact signed previous R checkpoint fd8b4434188b61beb2fa66f4d2676a3433ec3650. Read the new receipt and amendment with git show NEW_LAUNCH_SHA:path before merging because your old checkout doesn't contain them. Verify approved BASE->launch metadata and refs, then explicitly merge that exact NEW_LAUNCH_SHA preserving history (no reset/rebase/stash/copy). Verify policy/index/306 artifact hashes and ancestry, frozen install --ignore-scripts in this own worktree, and acknowledge new launch/base/full scope before implementation. If dirty/unexpected HEAD or another writer exists, preserve and report the exact blocker; don't discard edits.

Read AGENTS.md, plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/start-here.md, plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/roles/02-design-system.md, plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/launch/design-system/design-system-phase-02-v2.json, plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/amendments/toolchain-dependencies-v1.json, plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/gates/contracts-ready.json and relevant PRD/phase/specs/producer-interfaces. This receipt supersedes your old partial work item for future source; old foundations/report remain preserved. Full role include/exclude minus protected central files now applies. No fake contracts-ready: actual checked contracts source/merge/index is committed.

Scope: Finish full phase02 from integrated foundations. First fix actual ui-web TypeScript failure at src/primitives/button.tsx:30 (IconButton spread loses disabled/disabledReason discriminated union), without weakening disabled-state API. Then actual web/native primitive render/interaction/typechecks, missing accessible Dialog/Sheet/Table/Tabs/Form/Tooltip/Skeleton/Alert patterns, status/error/focus states, Storybook and native gallery, usage/public props and token parity. Request concrete Radix/shadcn/Tailwind/Storybook dependency choices early; the new baseline supplies reviewed React/DOM/native/SVG/types/JSX/exports and render-test dependencies, not unrequested advanced packages. Native must never import web/DOM/Radix. No device/VoiceOver/TalkBack claim from Jest mocked native bridges.

Bun1.4.0 primary; Node shebang exceptions for Vitest/Jest/Expo are intentional. The central pins follow Expo58.0.21 / React+DOM19.3.0 / RN0.88.1 / SVG15.16.0. New Hono4.13.14 / Workers plugin1.4.11 / Vitest4.1.12 align Wrangler4.156.0. Root overrides enforce one native/React line and patched glob>=9; legacy glob7 is not forced to a new API. No global runtime changes or forced peer bypasses.

Known audit qualification: lock audit still reports high Expo CLI Zod3.25.76 and low deepmerge4.3.1 with no compatible patched upstream version observed. Application contracts use fixed Zod4.6.7; plugin fixed4.6.6. This baseline is implementation/local trusted workspace only, not QA/security/release clearance. Do not expose Expo dev tooling to untrusted configs/projects; don't force Zod3->4 or run audit fix. Record residual limitations and keep release blocked.

No worker manifest/lock/central config edits, main merge/push/deploy/account/key/resource creation or paid/provider/real-device checks. Send minimal central dependency/export/binding requests to Lead through your own report; parent relays coordination. Local assigned-loopback servers and Workerd tests are allowed; SessionPlatform port8784, DesignSystem6006, no new Sim server port. Actual model/device/preview/build grants remain separate.

Preserve I1-I5 and user-scoped permissions on shared backend for web + one Expo app. AI only advises; human manual review remains independent and assignments/ETA update only after atomic Execute. Image-review jobs mutate metadata/event_sequence, not operational revision; no result means null, never fake0. Follow the unchanged human amendment evidence below for affected boundaries.

Run focused actual behavior/boundary/error/race tests and smoke, no fake model/device/calibration claims. Keep modules<200lines. Commit own source C then report-only R at plans/reports/worktree-ROLE-WORK_ITEM.md referencing C; return exact delivery R out of band. No gate edits or self-transition to later roles. Requested actual launch configuration gpt-6.1-sol / ultra / fast is set by parent tooling, not this prompt; fields not exposed inside worker remain unverified. Forward only scoped read-only helpers if authorized; never broaden writer scope.

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
