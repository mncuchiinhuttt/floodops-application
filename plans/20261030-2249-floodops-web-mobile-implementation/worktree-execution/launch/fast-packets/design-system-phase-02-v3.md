Resume the same DesignSystem worker thread01a19021-913f-7625-ac6c-b88f205aa0f2. Implement the remaining full phase02 now; all dependencies explicitly requested in v2 are supplied together. Do not spawn a duplicate writer or wait for SimulationData/SessionPlatform.

NEW_WORK_ITEM=design-system-phase-02-v3; NEW_BASE_SHA=ba41d3d2d7dace7bef961713d523afe6bd4a34e6; NEW_RECEIPT=plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/launch/design-system/design-system-phase-02-v3.json; NEW_LAUNCH_SHA is supplied out of band as this packet's containing commit. Worktree /Users/vominhlong/seahackathon-worktrees/02-design-system, branch feat/floodops-design-system.

Before mutation verify clean signed previous report HEAD4e06b82065aa18abec897af00eae35889d7aed60 and no other writer. Use git show NEW_LAUNCH_SHA:path to read the receipt/amendment before merge. Verify metadata-only BASE->launch and contract/policy/gate ancestry, then explicitly merge exact NEW_LAUNCH_SHA preserving history. No reset/rebase/stash/copy. Frozen Bun1.4.0 install --ignore-scripts in own worktree, verify all306 C1 artifact hashes and acknowledge new refs before coding. Unexpected changes stay preserved and get reported.

Read AGENTS.md, plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/roles/02-design-system.md, phase02/design-system specs and plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution/amendments/design-system-completion-dependencies-v1.json. Full existing four-package role scope minus protected central files; only own report. No root/consumer app/manifest/lock/central config changes. v3 supersedes v2 for further source writes.

Central dependency sourcee3cbf508d11615afce8320cfe7da588619ef7053: icons now declares Babel runtime7.29.7; UI-web has Radix Dialog1.3.1/Tabs1.2.1/Tooltip1.4.1, Tailwind+plugin4.3.3/Vite8.3.5, matching Storybook/core CLI/react-vite/addon-a11y10.6.5 and axe-core4.14.0. ui-native/gallery exports your internal gallery only. Existing React19.3/RN0.88/SVG15.16/Expo58/Jest/RNTL pins retained. No Storybook init/create/skills/tools or remote generator calls; package-local .storybook/stories/Vite Tailwind integration is your source responsibility, not a reason to stop for already supplied packages.

Lead re-ran actual merged source. Native missing-runtime blocker is fixed:2 suites execute9 tests,6 pass3 fail. Correct test/primitives.test.tsx:16 and test/patterns.test.tsx:33 TypeError toHaveAccessibilityState unavailable in installed RNTL14; inspect its local docs/api/jest-matchers.md and use supported semantic assertions preserving disabled/busy/selected checks. Also fix native gallery getByLabelText('Example name, required') at test/primitives.test.tsx:41: inspect accessibilityLabelledBy versus explicit accessibilityLabel and visible required label. Preserve accessible names, required/error semantics, retained draft and actual component interaction; don't mock icons or drop assertions to turn tests green.

Then finish actual Radix web Dialog/Sheet/Tabs/Tooltip, all remaining phase02 shared status/presentation patterns, Storybook stories/config/a11y and usage/public-prop documentation. Build Storybook using the new script, exercise real keyboard/focus restoration/escape/disabled/pending/reflow and axe where supported. Actual Lead probes validated Tailwind utility/shared-token CSS compile, module resolution and a limited axe button-name diagnostic, not full component/Storybook acceptance. Don't replace the existing original isometric vectors with emoji or web packages in native.

Previous merged web13 tests, token/icon26 tests424 assertions, four package types/web disabled-prop compile and scoped ESLint passed. Rerun affected checks after your fixes/new components. Keep source<200lines. Gallery must not leak into production root. Native Jest bridge is mocked, not physical iOS/Android/VoiceOver/TalkBack proof; those remain later authorized operator/device evidence. No ui gate self-claim: return sourceC then exact own SourceEvidence-only R with sourceC, path plans/reports/worktree-design-system-design-system-phase-02-v3.md; send exact R out of band for Lead review.

No worker push/main merge/deploy, new account/resource/credential, paid/model/real-device/build grant. Loopback6006 only and one preview at a time; no sibling node_modules/env/state. Audit remains known high Expo CLI Zod3 and low deepmerge; no ignore/force-major/security-release waiver. Dependency licences reviewed; axe-core MPL2 unmodified dev tooling, preserve notices. Parent retains launch/messaging and actually sets gpt-6.1-sol/ultra/fast; do not merely claim prompt enables tier.

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
