# Runtime LLM/tool contract

## Khác HTTP API
- [Tool JSON](tool-contracts.json) mô tả đúng 8 tool PRD v0.3; [OpenAPI](openapi.json) là request/response cho app, không public “run arbitrary tool”.
- Internal context do server inject session/generation/revision và scope. Model không tự chọn session/participant/source authority.
- Implementation Zod schema generates HTTP DTO + registered tool JSON Schema; dereference only supported schema subset, all strict object fields required; nullable for optional values. Reject schema unsupported before provider call.
- Strict JSON output không chứng minh ID đúng, physics đúng hoặc authorization hợp lệ. Luôn validate output và gate. Refusal/incomplete/timeout không phải plan thành công.

## Tool effects
| Tool | Output | Cho phép ghi |
|---|---|---|
| get_incident_state | captured SessionSnapshot | Không |
| get_affected_orders | Impact | Không |
| compute_route | Route candidate + no_route | Chỉ cache candidate scoped job, không operational state |
| test_reassignment | DryRunResult toàn batch | Không |
| propose_assignment_change | PlanAction | Proposal only, route_id thuộc job/revision |
| propose_order_deferral | PlanAction | P1 proposal only, config gate |
| draft_customer_notification | Notification preview | Không gửi, projected riêng committed |
| record_road_observation | Validated observation transition candidate | Ingestion/reducer mới commit; raw text không trực tiếp sửa road |

## Candidate pickup/route construction
- compute_route nhận stop_refs(order_id,kind) và assignment_overrides(order_id,driver_id,pickup_hub_id). Code validate stock/custody rồi derive pickup node/service time từ scenario; không yêu cầu route ID trước khi có thể biểu diễn hub mới.
- Route trả candidate_context_hash, validated stops, origin, job/revision và overrides. Proposal/dry-run/Execute phải dùng cùng context; route qua hub cũ trong khi đổi hub mới bị reject, không tự sửa route ngoài contract.
- Positive E-HUB-01 kiểm actual movement pickup tại hub mới, không chỉ assert DTO pickup_hub_id đổi.

## Controller
1. Accept incident/validated report event sau domain commit; capture immutable snapshot/hash.
2. Create planning job; one active job, bounded provider/tool steps/token budget theo deployment config.
3. Responses API tool calls có call_id; preserve provider output items đúng API, return matching function_call_output. Không dùng role/format cũ không tương thích Responses.
4. Chỉ parallel các read-only tools độc lập trên cùng snapshot; proposal dependencies xử lý theo thứ tự, no unbounded fanout.
5. Unknown tool/name/ID/input/schema => structured validation error; một correction turn trong budget được phép cho interactive flow, real-model first-proposal eval vẫn chấm lần đầu.
6. Final candidate gồm actions+groups+routes/evidence refs. Server kiểm dependency DAG, no external data instruction, objective và config availability.
7. Commit proposal khi session/revision/active_job còn match; không mutate assignments. Gate vẫn recheck khi Approve/Execute.
8. Timeout/cancellation/refusal/late response: failed/superseded job, accepted observations và committed operations không rollback.

## Evidence và model evaluation
- Save redacted trace IDs, model identifier/config hash, durations, token counts/budget, tool outputs hash, first proposal gate result. Không log keys/full photo/private raw report trong operational log.
- Ten isolated real-model runs, same frozen dataset/events/config; record all first responses including no-response/refusal. >=8/10 valid is target, pending approval still valid when hard rules pass.
- Stub deterministic suite không là evidence model thật. Rehearsal accepted-report→plan display latency là wall clock, excludes manual review delay reported separately.
- Feature supports Vietnamese report and English/VI UI strings; no prompt-string exact assertions.

## Primary sources verified
- [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling)
- [Structured outputs and refusal handling](https://developers.openai.com/api/docs/guides/structured-outputs)
- [PRD tool/safety/quality](../../../FloodOps/prd.md)
