# Agent roles và Git worktree execution

Đây là **vai trò agent kỹ thuật**, không phải actor sản phẩm dispatcher/driver/contributor. Bộ này bổ sung cách chạy [12 phases](../plan.md) bằng các session/agent độc lập; không tạo worktree hoặc triển khai code ở bước viết tài liệu.

## Bắt đầu
0. [Root AGENTS.md](../../../AGENTS.md) và [start-here: exact role order](start-here.md); [startup injection](agent-bootstrap.md) và [prompt-injection rules](prompt-injection-policy.md) áp dụng cho mọi role.
1. [Orchestrator](orchestrator.md): việc của IntegrationLead trước khi mở agent.
2. [Ownership](ownership.md): ai được ghi file nào; central files không ghi đồng thời.
3. [Execution waves](execution-waves.md): dependency/gate và thứ tự mở agent.
4. [Worktree runbook](worktree-runbook.md): tạo/sync/merge bằng Git thường, không cần helper `.claude`.
5. [Shared contracts](shared-contracts.md) · [Producer interfaces](producer-interfaces.md): API/types/ports/tokens freeze và protocol xin đổi.
6. [Work items và handoff](work-items-and-handoff.md): base SHA, evidence, request và delivery receipt.
7. [Machine manifest](roles.json) · [Receipt schemas](handoff-schemas.json).
8. [Strict policy validation](reports/strict-policy-validation.md): kiểm chứng tài liệu/schema/fixture và hai scoped review; không là runtime security pass.

## Role catalog
| Agent | Vai trò chính | Branch | Prompt |
|---|---|---|---|
| IntegrationLead | Integration Lead / workspace và merge owner | `integration/floodops-application` | [00-integration-lead](roles/00-integration-lead.md) |
| ContractsClient | Contracts, schema và typed API client | `feat/floodops-contracts-client` | [01-contracts-client](roles/01-contracts-client.md) |
| DesignSystem | Design tokens, UI web/native và isometric icons | `feat/floodops-design-system` | [02-design-system](roles/02-design-system.md) |
| SimulationData | Scenario, dữ liệu, graph và simulator | `feat/floodops-simulation-data` | [03-simulation-data](roles/03-simulation-data.md) |
| SessionPlatform | Hono runtime, Durable Object và session security | `feat/floodops-session-platform` | [04-session-platform](roles/04-session-platform.md) |
| SourcesMedia | Sources, evidence, reports và media pipeline | `feat/floodops-sources-media` | [05-sources-media](roles/05-sources-media.md) |
| PlannerSafety | Commander, policy gate và atomic execution | `feat/floodops-planner-safety` | [06-planner-safety](roles/06-planner-safety.md) |
| ReviewRewards | Review, conflict, coverage và exactly-once points | `feat/floodops-review-rewards` | [07-review-rewards](roles/07-review-rewards.md) |
| ResultsEvaluation | Clock jobs, results, model evaluation và evidence | `feat/floodops-results-evaluation` | [08-results-evaluation](roles/08-results-evaluation.md) |
| WebConsole | React web console đầy đủ | `feat/floodops-web-console` | [09-web-console](roles/09-web-console.md) |
| ExpoMobile | Expo native đầy đủ dispatcher/driver/contributor | `feat/floodops-expo-mobile` | [10-expo-mobile](roles/10-expo-mobile.md) |
| QualitySecurity | QA cross-platform, security và acceptance | `test/floodops-quality-security` | [11-quality-security](roles/11-quality-security.md) |
| ReleaseOps | Cloudflare/EAS release và rollback | `chore/floodops-release-ops` | [12-release-ops](roles/12-release-ops.md) |

## Điều không được làm
- Không mở13 implementation agents trên cùng HEAD rồi để mỗi agent tự chạy cả plan. Đây là13 **vai trò**, tối đa3 implementation owners đồng thời ở wave sẵn sàng; IntegrationLead luôn là một writer/merge owner riêng.
- Không tạo mọi worktree từ seed cũ trước contracts-ready; code và plan **chưa commit** ở main worktree không tự hiện trong worktree khác.
- Không copy `.env`, credential, node_modules, `.wrangler/state` hoặc Expo cache giữa worktrees.
- Không dùng `/ck:cook --parallel ../plan.md` trong từng worker: lệnh đó có thể mở cả plan thay vì giới hạn role. Worker nhận đúng role prompt + work item.
- Không edit file ngoài ownership để “unblock nhanh”; gửi request tới owner/Lead. Git worktree tách working directory, không tự giải quyết semantic/API conflicts.

## Trạng thái
Mọi role/phase ở trạng thái planned. Chưa tạo branch/worktree, chưa chạy application suites/deploy. Root plan và contracts hiện tại giữ scope34US,64 API operations và8 tools; role pack không đổi nghiệp vụ.
