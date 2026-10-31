# Producer interfaces — giao giữa role, không deep import

Đây là public seam cần chốt trong implementation receipts, không phải lời khẳng định code đã tồn tại. Tên/signature dưới là đề xuất naming; C1 và provider gate publish exact exports/types trước consumer. Đổi sau gate dùng amendment protocol, không hai implementation song song.

| Producer | Public output / seam | Consumer / gate |
|---|---|---|
| ContractsClient | Strict wire schemas/errors/DTOs, `ApiClient` command/read/events interfaces, cancellation/credential adapters. | Mọi role sau C1. Không server-side authority trong UI. |
| SimulationData | `loadScenario(manifest)`, `createRun(bundle)`, `advanceRun(run,target,policy)`, `projectCandidate(snapshot,candidate,H)`, `calculateObservedMetrics(log,H)` và frozen fixture catalog. | SourcesMedia/PlannerSafety/ResultsEvaluation; simulation-ready. |
| SessionPlatform | `createApp(featureRouters,ports)`, session actor/permission middleware, typed session-command/runtime transition port, event projection/replay. | Backend feature factories; platform-ready. |
| SourcesMedia | `normalizeInput`, `deriveCurrentKnowledge`, `proposeObservationAcceptance`, `proposeConflictResolution`, source/report/media router factories. Pure results include validation/reason/evidence/transition, không implicit reward. | PlannerSafety/ReviewRewards; sources-ready. |
| PlannerSafety | `createPlanningService`, incident/planning/operations router factories, candidate/group compiler và deterministic gate/executor reducers. | ResultsEvaluation và Lead composition; planner-ready. |
| ReviewRewards | `reviewReportTransition`, `resolveConflictTransition`, review/conflict-review/rewards router factories, gap/ledger projection. | ResultsEvaluation và Lead composition; review-ready. |
| ResultsEvaluation | Simulation/results/evaluation router factories, advance-job service và metrics/query projections. | Lead full backend composition; results-ready. |
| DesignSystem | Token names/adapters/icon IDs, ui-web và ui-native primitive/pattern props; entrypoints native-safe. | WebConsole/ExpoMobile; ui-libraries-ready. |
| IntegrationLead | Actual `apps/api/src/index.ts` router registrations + bindings, workspace manifests/public aggregate exports, API-local/static configs. | Web/Mobile/QA; backend-ready/combined-config-ready. |

## Atomic review seam
- SourcesMedia cung cấp **pure proposed knowledge transition** và validation helpers; không accept citizen rồi trả về cho reward service commit phần còn lại sau.
- ReviewRewards compose accepted observation + resolution + gap fill + award trong một candidate transition; SessionPlatform commit toàn transition trong một DO transaction.
- Driver quick-report acceptance không giả citizen reward; camera/system không nhận award. Points xét đúng transition và source scope đã chốt.
- Không truyền JavaScript closure qua Worker/DO RPC. Pure transition registry/reducer chạy **bên trong DO**; HTTP/remote ports mang serialized validated commands/DTOs. Lead wiring đúng boundary, không share mutable state.

## Candidate routing seam
- `compute_route` nhận stop refs + candidate assignment/pickup override; code derive actual stop nodes/units, route binds candidate hash/job/revision.
- Planner dùng route do simulator/tool cấp, không sửa pickup node/ETA thủ công trong proposal để lách interface.
- P1 hub/defer và P2 baseline có contract/test thật, flags không được dùng để bỏ triển khai.

## Router integration request (handoff)
Mỗi API owner gửi export path/symbol, route prefix, required ports/bindings, auth/role guard expectations, error/revision behavior và focused test entrypoint. Lead register trong central index bằng commit riêng sau owner merge. Không owner nào sửa `apps/api/src/index.ts` trong worktree của mình.

## Consumer constraints
- UI chỉ gọi shared API client, không direct DO/provider/domain mutation.
- QA test deployed composition và real runtime; không mock gate/Execute rồi assert echoes.
- Producer không đổi signatures chỉ vì consumer đã tự viết incompatible code; consumer phải request hoặc adopt published interface.
