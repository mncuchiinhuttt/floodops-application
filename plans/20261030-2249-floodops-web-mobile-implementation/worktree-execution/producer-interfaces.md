# Producer interfaces — giao giữa role, không deep import

Đây là public seam cần chốt trong implementation receipts, không phải lời khẳng định code đã tồn tại. Tên/signature dưới là đề xuất naming; C1 và provider gate publish exact exports/types trước consumer. Đổi sau gate dùng amendment protocol, không hai implementation song song. Image-review additions follow [the canonical advisory contract](../specs/ai-assisted-image-review.md).

| Producer | Public output / seam | Consumer / gate |
|---|---|---|
| ContractsClient | Strict wire schemas/errors/DTOs, `ApiClient` command/read/events interfaces, cancellation/credential adapters, plus a self-contained provider-compatible strict `ImageReviewModelOutput` schema (resolve local refs, no network refs; model gets neither Job nor Advice schema). Server revalidates full bounded output; provider compatibility never loosens app validation. | Mọi role sau C1. Không server-side authority trong UI. |
| SimulationData | `loadScenario(manifest)`, `createRun(bundle)`, `advanceRun(run,target,policy)`, `projectCandidate(snapshot,candidate,H)`, `calculateObservedMetrics(log,H)` và frozen fixture catalog. | SourcesMedia/PlannerSafety/ResultsEvaluation; simulation-ready. |
| SessionPlatform | `createApp(featureRouters,ports)`, session actor/permission middleware, typed session-command/runtime transition port, event projection/replay, persistent image-review metadata/current-job/lease/deadline/quota hooks. | Backend feature factories; platform-ready. |
| SourcesMedia | `normalizeInput`, `deriveCurrentKnowledge`, `proposeObservationAcceptance`, `proposeConflictResolution`, source/report/media router factories, authorized normalized-image/digest/readiness port for pending reports. Pure results include validation/reason/evidence/transition, không implicit reward. | PlannerSafety/ReviewRewards; sources-ready. |
| PlannerSafety | `createPlanningService`, incident/planning/operations router factories, candidate/group compiler và deterministic gate/executor reducers. | ResultsEvaluation và Lead composition; planner-ready. |
| ReviewRewards | `reviewReportTransition`, `resolveConflictTransition`, review/conflict-review/rewards router factories, gap/ledger projection, isolated dispatcher-only image-review service/job using `ImageReviewPort`. | ResultsEvaluation và Lead composition; review-ready. |
| ResultsEvaluation | Simulation/results/evaluation router factories, advance-job service và metrics/query projections. | Lead full backend composition; results-ready. |
| DesignSystem | Token names/adapters/icon IDs, ui-web và ui-native primitive/pattern props; entrypoints native-safe. | WebConsole/ExpoMobile; ui-libraries-ready. |
| IntegrationLead | Actual `apps/api/src/index.ts` router registrations + bindings, workspace manifests/public aggregate exports, API-local/static configs, OpenAPI/client/event/DO-schema/config composition. | Web/Mobile/QA; backend-ready/combined-config-ready. |

## Atomic review seam
- SourcesMedia cung cấp **pure proposed knowledge transition** và validation helpers; không accept citizen rồi trả về cho reward service commit phần còn lại sau.
- ReviewRewards compose accepted observation + resolution + gap fill + award trong một candidate transition; SessionPlatform commit toàn transition trong một DO transaction.
- Driver quick-report acceptance không giả citizen reward; camera/system không nhận award. Points xét đúng transition và source scope đã chốt.
- Không truyền JavaScript closure qua Worker/DO RPC. Pure transition registry/reducer chạy **bên trong DO**; HTTP/remote ports mang serialized validated commands/DTOs. Lead wiring đúng boundary, không share mutable state.

## Advisory image-review seam
- ContractsClient owns the additive strict wire contract: exactly eight image-review schemas and two operations; planned totals are 66 operations/61 paths and 194 schemas only when those eight are present. Existing Report/review payloads and all eight tool schemas remain unchanged.
- SourcesMedia publishes a server-authorized read of the verified normalized derivative (or bounded internal handle), server-computed `input_digest` media component and readiness/duplicate status. It never exposes raw staging/public R2 URLs or reviews/rewards reports.
- ReviewRewards owns image-review router/service/job/provider adapter only under `apps/api/src/features/reports/review/`; `ImageReviewPort` receives one normalized image plus minimal approved text context and returns strict model-only fields. Provider schema is self-contained, local refs resolved/no network refs, and contains only `ImageReviewModelOutput` (not Job/Advice); server revalidates full bounded output. No deep import/copy of PlannerSafety OpenAI internals; no model call inside the DO transaction.
- SessionPlatform owns durable metadata/current-job/lease/deadline/quota hooks and dispatcher-only `image_review_changed` projection. Job transitions increment `event_sequence`, never operational `revision`; event data is safe IDs only. UI refresh binds session/generation/report/job/input digest, including valid progress at unchanged revision.
- IntegrationLead alone wires the router, central schemas/events, DO migration/bindings and non-secret `OPENAI_IMAGE_REVIEW_MODEL` using the existing provider key. Before affected owners resume, Lead publishes the approved baseline amendment/hash and reissues required launch refs; no receipt, role, gate, dependency, permission or wave is silently edited. No deployment or live model evidence is implied.

## Candidate routing seam
- `compute_route` nhận stop refs + candidate assignment/pickup override; code derive actual stop nodes/units, route binds candidate hash/job/revision.
- Planner dùng route do simulator/tool cấp, không sửa pickup node/ETA thủ công trong proposal để lách interface.
- P1 hub/defer và P2 baseline có contract/test thật, flags không được dùng để bỏ triển khai.

## Router integration request (handoff)
Every API owner sends export path/symbol, route prefix, required ports/bindings, auth/role guard expectations, error/revision behavior and focused test entrypoint. Lead registers in the central index by a separate commit after owner merge. Image-review contract changes require Lead's explicit baseline amendment before affected owners resume. No owner edits `apps/api/src/index.ts` in its worktree.

## Consumer constraints
- UI chỉ gọi shared API client, không direct DO/provider/domain mutation.
- QA test deployed composition và real runtime; không mock gate/Execute rồi assert echoes.
- Producer không đổi signatures chỉ vì consumer đã tự viết incompatible code; consumer phải request hoặc adopt published interface.
