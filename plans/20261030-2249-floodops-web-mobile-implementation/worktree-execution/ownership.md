# Write ownership — một writer cho mỗi file

## Nguồn chuẩn
[roles.json](roles.json) quyết định **write authority trong worktree mode**. Phase files mô tả deliverables và dependencies; chúng không cho phép worker vượt central-file rules. Mọi file khác vẫn đọc được nếu không chứa secret/PII không thuộc task.

## Matcher (để người/CI dùng cùng cách hiểu)
1. Chuẩn hóa repo-relative POSIX path; reject absolute path, empty path, `..`, backslash escape và symlink ra ngoài worktree.
2. Nếu path trong `ownership_policy.protected_files`: writer duy nhất là IntegrationLead.
3. Nếu không: xét `include_files` đúng exact path hoặc `include_prefixes` với trailing `/`, rồi loại `exclude_prefixes` của role đó.
4. File report khớp `report_prefix + work_item_id + .md` là namespace riêng role.
5. Phải có đúng1 owner.0 => unassigned/deny; nhiều owner => plan defect, chưa agent nào được sửa.
6. Check **committed source diff từ observed_launch_sha tới delivery_sha**, không chỉ dirty status. BASE_SHA→launch là approved Lead metadata kiểm riêng; renamed source/destination đều phải authorized. Không tính launch receipt Lead vào mutation của worker.
7. Plan status, launch/gate ledger và phase completion chỉ IntegrationLead ghi; contracts-client chỉ sửa plan contract artifacts ở bootstrap hoặc approved contract amendment.
- Ownership là coordination/merge policy, **không phải OS security sandbox**: Git worktree chia working directory nhưng Git objects/refs cùng repo. Tool/filesystem restrictions của agent phải cấu hình riêng nếu cần chống malicious writes.
- Matcher kiểm source changes và delivered commits. Generated ignored node_modules/build/.wrangler/.expo artifacts được tooling tạo trong chính worktree, không là quyền commit chúng; local secret files chỉ operator cấp qua approved channel, không auto-copy.

## Central files
- Root package.json/workspace/lockfile/toolchain/ESLint/tsconfig/gitignore/README.
- Tất cả app/package package.json và package-root tsconfig.json liệt kê cụ thể trong manifest.
- `apps/api/src/index.ts`, `wrangler.api-local.jsonc`, `wrangler.jsonc`, `.dev.vars.example`; `apps/mobile/eas.json`.
- Shared domain public entrypoint/ports aggregate.
- Root plan, phase status, specs/metadata và worktree execution receipts.
- Root `AGENTS.md` và toàn bootstrap/injection policy là protected. Worker không tự sửa scope/policy/gate schema; Lead chỉ revise policy khi có explicit user-authorized policy task rồi publish/re-authorize.

Lý do: generator/install/router registration và deploy config dễ gây semantic conflict dù Git auto-merge được. Owner feature gửi export/route/dependency/config request; Lead chỉ sửa glue/config, **không sửa business rule để test xanh**.

## Subtree partition dễ nhầm
| Owner | Được ghi | Không được ghi |
|---|---|---|
| SourcesMedia | knowledge/reporting core và knowledge/reports feature parent | reports/review và knowledge/conflict-review subtrees |
| ReviewRewards | chính2 subtree review bên trên + reward domain/API | knowledge/reporting core của SourcesMedia |
| ExpoMobile | apps/mobile và own native tests | apps/mobile/release, package manifests, EAS central config |
| ReleaseOps | apps/mobile/release,2 deploy workflows,3 release runbooks | apps/mobile source/EAS config; API index/Wrangler central files |
| WebConsole/ExpoMobile | own app screens/feature UI/test | shared UI/token/icons packages và contracts/client |
| QualitySecurity | cross-platform/security/performance/smoke tests và own CI files | application/domain/gate/fixture implementation |

## Shared edits cần request
- Dependency request: package/import/version range/peer constraints/licence/reason/affected worktree. Lead scan, pin/update manifests+lock once, commit; worker chỉ frozen install sau khi receipt cập nhật baseline.
- Export request: public symbol+types/behavior/error cases+consumer+owner. Không deep-import private file để né entrypoint.
- Contract amendment: old/new wire shape/rule, consumers/tests affected. ContractsClient chuẩn bị change trong scope đã authorize, Lead merge và phát contract-ready version mới, invalidate outstanding launch receipts cần cập nhật.
- Fixture request: SimulationData cung cấp shared fixture; feature tests có thể dùng local builders hợp lệ, không copy/fork physical constants.
- UI request: DesignSystem cập nhật shared primitive/token/icons; web/native không tự thêm conflicting token/component copies.

## Kiểm quyền trước merge
- Lead đối chiếu delivery SHA/base SHA và changed_paths qua matcher. Unrelated user files, agent settings, private env và generated build caches không vào commit.
- Có central diff trong worker delivery => reject/request correction, không “sửa conflict bằng ours/theirs” rồi merge.
- File ngoài danh sách cần assignment amendment có commit+new receipt trước khi sửa; không coi default là quyền toàn repo.
