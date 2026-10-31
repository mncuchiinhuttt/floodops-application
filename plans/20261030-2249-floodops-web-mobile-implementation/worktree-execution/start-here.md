# Chạy role nào trước — operator start here

Đọc [AGENTS.md gốc](../../../AGENTS.md) trước. Đây là thứ tự chạy **technical agents**, không phải role tài xế/điều phối của sản phẩm. Không phân thời gian; chưa tạo worktree/branch hoặc bắt đầu implementation trong bước viết hướng dẫn.

## 1. Thứ tự khuyến nghị
| Đợt | Mở agent nào | Việc cụ thể phải bàn giao | Chỉ mở khi |
|---|---|---|---|
| 0 | **IntegrationLead** — giữ session này suốt quá trình | Commit policy/plan khi được user cho phép; tạo integration worktree; chốt toolchain/manifests/lockfile và workspace-bootstrap | User đã yêu cầu execution; policy/plan đã committed, main không là scratchpad |
| 1 | **ContractsClient** | Wire schemas,8 tool interfaces, typed API client, error/CAS/idempotency/SSE; Lead merge và phát contracts-ready | workspace-bootstrap |
| 2A | **DesignSystem** | Tokens, icon manifest/web-native adapters, shadcn/native primitives và public UI contracts | contracts-ready |
| 2B | **SimulationData** | Scenario/fixtures/provenance, graph/routing/clock/movement, branch isolation và metrics | contracts-ready |
| 2C | **SessionPlatform** | Hono factory, actual Workerd harness/DO, capabilities, revisions/idempotency, Reset/expiry/replay | contracts-ready |
| 3 | **SourcesMedia** | Context/evidence/reports/media normalization, source policies, epoch/freshness/vehicle knowledge | simulation-ready + platform-ready; không phải đợi DesignSystem nếu chưa xong |
| 4A | **PlannerSafety** | Commander/tool controller, policy gate, groups/approval/atomic Execute, P1 hub/defer | sources-ready và các predecessor commits đã integrated |
| 4B | **ReviewRewards** | Report review/conflict, useful gap coverage, exactly-once award và participant ledger | sources-ready |
| 5 | **ResultsEvaluation** rồi **IntegrationLead** | Advance jobs/results/evaluation routers; Lead compose API index/local bindings và smoke actual backend | planner-ready + review-ready; Lead phát backend-ready sau composition |
| 6A | **WebConsole** | Toàn bộ web feature routes/map/plans/reports/review/points/clock/results và error states | backend-ready + ui-libraries-ready |
| 6B | **ExpoMobile** | Native dispatcher/driver/contributor, SecureStore/SSE/photo/drafts, actual native screens và errors | backend-ready + ui-libraries-ready |
| 7 | **QualitySecurity** | Cross-client tests/security/accessibility/negative paths, frozen candidate evidence; Lead xử lý owner fixes rồi kiểm lại | web-ready + mobile-ready + combined-config-ready do Lead cung cấp |
| 8 | **ReleaseOps** rồi **IntegrationLead** | Release workflows/runbooks, authorized preview/rollback; promote production/store/main riêng theo quyền | qa-ready; preview-authorized khác production release-authorized |

Chạy song song: **2A+2B+2C**, **4A+4B**, **6A+6B**. Đợt là dependency, không phải lịch; worker xong chưa đủ, Lead phải review/merge và ghi gate SHA. Không mở13 writers cùng HEAD để agent tự đoán dependency.

## 2. Bản đồ từng role / worktree
Mọi path dưới nằm trong `/Users/vominhlong/seahackathon-worktrees/`; exact branch/ports/include/exclude xem [roles.json](roles.json).

| Agent | Worktree folder | Prompt phải giao |
|---|---|---|
| IntegrationLead | `00-integration` | [00-integration-lead](roles/00-integration-lead.md) |
| ContractsClient | `01-contracts-client` | [01-contracts-client](roles/01-contracts-client.md) |
| DesignSystem | `02-design-system` | [02-design-system](roles/02-design-system.md) |
| SimulationData | `03-simulation-data` | [03-simulation-data](roles/03-simulation-data.md) |
| SessionPlatform | `04-session-platform` | [04-session-platform](roles/04-session-platform.md) |
| SourcesMedia | `05-sources-media` | [05-sources-media](roles/05-sources-media.md) |
| PlannerSafety | `06-planner-safety` | [06-planner-safety](roles/06-planner-safety.md) |
| ReviewRewards | `07-review-rewards` | [07-review-rewards](roles/07-review-rewards.md) |
| ResultsEvaluation | `08-results-evaluation` | [08-results-evaluation](roles/08-results-evaluation.md) |
| WebConsole | `09-web-console` | [09-web-console](roles/09-web-console.md) |
| ExpoMobile | `10-expo-mobile` | [10-expo-mobile](roles/10-expo-mobile.md) |
| QualitySecurity | `11-quality-security` | [11-quality-security](roles/11-quality-security.md) |
| ReleaseOps | `12-release-ops` | [12-release-ops](roles/12-release-ops.md) |

## 3. Giao việc cho IntegrationLead
Chạy session đầu tại repo chính **chỉ để đọc/chuẩn bị**, sau khi user authorize thì tạo integration worktree bằng [runbook](worktree-runbook.md). Khi đã tạo, operator mở lại/resume Lead ở `00-integration`; không cùng2 Lead writer.

Prompt giao trong trusted operator message:
```text
Bạn là IntegrationLead cho FloodOps, chỉ orchestration/central files và merge.
Đọc AGENTS.md ở git root, rồi worktree-execution/orchestrator.md và roles/00-integration-lead.md trong plan.
Lập/kiểm plan-published và workspace-bootstrap trước; không triển khai business features thay owners.
Dispatch các role theo start-here.md. Chỉ user/đúng grant mới cho phép commit/push/deploy/account actions tương ứng.
Mỗi launch phải có base/gate SHA và contract fingerprint thực. Không tự ghi gate pass khi chưa có evidence.
```
Các path prompt rút gọn bên trên đều relative tới `plans/20261030-2249-floodops-web-mobile-implementation/`, không phải cwd tùy ý.

## 4. Giao việc cho worker — copy template, điền giá trị thật
Operator mở agent trong đúng worktree rồi giao:
```text
ROLE_ID: <id đúng roles.json>
WORK_ITEM: <work_item_id được Lead authorize>
LAUNCH_RECEIPT: <repo-relative path của receipt đã committed>
Đọc AGENTS.md ở git root; đọc role prompt tương ứng trong worktree-execution/roles/.
Áp dụng agent-bootstrap.md, verify CWD/branch/base/gates/contract-index trước edit.
Chỉ làm đúng scope role+receipt; không chạy global cook root plan, không spawn role khác.
Bàn giao source C rồi report R tham chiếu C; gửi delivery_sha R sau commit cho Lead.
```
- Template không tự là receipt/grant. Placeholder chưa điền hoặc chưa có committed receipt => implementation blocked.
- [Startup injection/recovery](agent-bootstrap.md) chỉ truyền context; không nâng quyền lên system/developer hay vượt policy runtime.
- Worker không tự đổi root `AGENTS.md`, central package/lock/Wrangler/EAS, role/receipt schemas hoặc safety tests để mở quyền.

## 5. Điều kiện trước khi mở đợt kế tiếp
1. Producer source và SourceEvidence đã commit, Lead nhận exact SHA qua message và review đúng ownership.
2. Merge vào integration, xử lý central config/exports, scoped smoke thực rồi ghi gate receipt.
3. Lead tạo launch metadata commit trên baseline mới; worktree mới checkout commit đó, không copy untracked files.
4. Contract/dependency update giữa chừng dùng approved amendment/resync, không rebase/reset shared history.
5. Missing D04/model/device/account evidence vẫn ghi blocked phần liên quan; code-ready không là product/release complete.

## 6. Remote preview không được deadlock với QA
- Preview/development/model/dev-build grant có thể cấp trước QA để lấy evidence, chỉ đúng account/environment/actions/budget.
- Production/store/main promotion cần release-authorized sau required evidence. Có role ReleaseOps không tự cấp quyền remote.
- Nếu ít terminal, chạy tuần tự từng role vẫn đúng DAG; không gộp quyền của nhiều owner vào worker “fullstack” tự do.
