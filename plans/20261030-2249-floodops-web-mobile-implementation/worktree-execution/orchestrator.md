# IntegrationLead — orchestration entrypoint

## Goal và giới hạn
Điều phối13 technical roles cho full FloodOps plan qua Git worktrees. Đây là phương án thực thi, không yêu cầu Agent Teams runtime/TeamCreate hay `.claude` helper. Chưa tạo worktrees, launch agent hoặc implementation trong bước lập tài liệu.

Work context mặc định: `/Users/vominhlong/seahackathon/floodops-application`; khi đã tạo integration worktree dùng `/Users/vominhlong/seahackathon-worktrees/00-integration`. Reports `{worktree}/plans/reports/`; Plans `{worktree}/plans/`; active plan cùng relative path trong mọi worktree.

## Đọc trước
[Root AGENTS.md](../../../AGENTS.md), [start-here exact order](start-here.md), [bootstrap/recovery](agent-bootstrap.md), [injection policy](prompt-injection-policy.md), [root plan](../plan.md), [roles](roles.json), [ownership](ownership.md), [waves](execution-waves.md), [runbook](worktree-runbook.md), [role00](roles/00-integration-lead.md).

## 1. Publish và bootstrap
- Chỉ execution sau trusted user request. Publish cả root AGENTS.md+plan/role files; chưa committed thì xin đúng scope publish, không giả PLAN_SHA chứa untracked docs. Runtime discovery khác nhau: worker phải acknowledge policy thực đã load/verified, không dựa filename.
- Tạo integration branch/worktree bằng runbook, không thay checkout source main.
- Seed workspace/toolchain/lockfile và package manifests cho toàn stack đã chọn; contracts/code tasks không bắt đầu trên root manifests còn trôi nổi.
- Package versions/security/licence/peers verified trước add; provider/native signing secrets không ở bootstrap commit.
- Root app placeholders không tính feature done; giữ config có thể kiểm slice và scoped test entrypoints thật.

## 2. Emit launch receipts theo wave
- Required gate commits đã integrated, immutable contract ref/hash và actual base SHA.
- LaunchReceipt pin policy_ref(path=AGENTS.md,commit_sha,sha256) ngoài contract_ref; record startup/resume acknowledgement. Policy change cần user-authorized amendment và affected-worker resync; không worker tự đổi hash để tiếp tục.
- Metadata-only launch receipt commit tách code baseline, tránh self-reference SHA; [handoff protocol](work-items-and-handoff.md).
- Work item default không remote push/deploy; role release không tự được account write permission.
- Mỗi agent một role/worktree; nhắc rõ only assigned phase/subtree, report namespace riêng. Khởi chạy wave sẵn sàng, không13 writers cùng lúc.
- Remote permission tách đôi: scoped preview-authorized cho isolated preview/model/EAS development-build evidence trước QA; release-authorized cho production/store/main-promotion sau QA/D04. Mọi grant ghi environment/actions/account/budget, không token; quyền không là chứng cứ đã pass.

## 3. Shared dependency/config requests
- Central writer là Lead. Process requests thành nhỏ reviewable commits; producer owner thực hiện semantic interface change.
- Public exports/router factories riêng từng feature; không Lead sửa source business rule để ghép được app.
- Contract amendment sau C1 => new contract-ready fingerprint và resync affected work items; no implicit aliases/shims/consumer private imports.

## 4. Merge và build-readiness gates
- Merge exact delivery SHA theo gate DAG; reject out-of-scope/central mutations trong worker diff.
- Phase04 có actual local Workerd harness; không đợi release mới có runtime tests.
- Sau role08 merged: Lead compose apps/api/src/index.ts và wrangler.api-local.jsonc từ existing routers, smoke Hono→DO rồi seal backend-ready.
- Web/Expo chỉ bắt đầu full screen integration khi backend-ready+ui-libraries-ready. Song song hai worktrees, no native import web primitives.
- Sau web/mobile merged: Lead commit static/env Wrangler/EAS configuration và check combined routing trước QA. File phase11 vẫn mô tả deliverable nhưng central writer là Lead.
- QA trên frozen candidate. New fix/merge sau đó invalidate affected QA evidence; rerun gate phù hợp trước promote.
- Khi native/model/QA cần remote preview, Lead cấp/kiểm explicit preview grant và dùng own central configuration triển khai môi trường cách ly trước final QA. Không buộc release gate đòi evidence mà chính gate đang cấm tạo.

## 5. Evidence và external blockers
- Agent reports actual focused check/smoke output, seed/config/model hashes và negative states. Không full-repo build/format mid-flight khi shared integration còn thay đổi.
- Core/schema/stub tests không là real-model/device/D04 evidence. Keep limitations và chưa mark product/phase complete khi missing acceptance.
- Khi review/source/planning/reward lỗi: issue owner correction work item, không QA/Lead tự giảm luật an toàn.

## 6. Final release
- Gate release-authorized cần exact candidate QA + calibration/model/device/security proof theo PRD và account/action permission.
- ReleaseOps soạn workflows/runbook, final preview/rollback trong preview grant; production/store/main promotion chỉ sau release-authorized. Không push/deploy vì “đã có role”, không dùng production authority để chạy preview tùy ý.
- Merge/promotion lên main do Lead thực hiện khi user authorize; dùng merge history để giữ receipts, no force-push.

## Checklist điều phối
- [ ] Plan published và integration worktree độc lập.
- [ ] Workspace-bootstrap ready, root manifests/lock pinned.
- [ ] ContractsClient merged và C1 contract ref/hash frozen.
- [ ] Các wave owners hoàn tất+reviewed+merged theo dependency.
- [ ] Backend composition và combined config ready trước consumers/QA.
- [ ] Cross-platform full acceptance/release prerequisites có evidence, blockers không bị che.
- [ ] User authorize promotion/push/deploy; source main không bị worker sửa trực tiếp.
