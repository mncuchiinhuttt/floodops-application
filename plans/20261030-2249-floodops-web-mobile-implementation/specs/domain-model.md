# Domain data contract và storage model

## Quy ước chung
- Wire schemas are defined by [openapi.json](../contracts/openapi.json); operational rules by [policy-rules.md](policy-rules.md), and advisory image-review by [ai-assisted-image-review.md](ai-assisted-image-review.md).
- ID opaque string có prefix, không suy thẩm quyền từ ID. Session ID và participant capability là hai thứ khác nhau.
- `revision` integer tăng đơn điệu cho operational state; `event_sequence` tăng cho mọi sự kiện/audit. Không dùng timestamp thay sequence.
- Timestamps provenance là RFC3339 UTC. Simulation là `sim_minute` finite nonnegative number từ T0, fractional hợp lệ. Không tự thay captured_at bằng received_at.
- WGS84 `[longitude, latitude]`, length_m tính polyline geodesic; direction/turn/vehicle restrictions riêng.
- `null` ETA = chưa có dự kiến khả thi, không phải 0; `null` ratio = N/A khi baseline=0.

## Entities
| Entity | Identity và trường bắt buộc | Invariant |
|---|---|---|
| Scenario | id, version, title, T0, timezone, region polygon, horizon_minute, seed_hash, config_hash, calibration_status | Freeze trước so sánh; thay tham số phải version mới |
| Parameter | key, finite value, unit, measured/derived/assumed, provenance IDs, method, applicable_scope, tolerance/uncertainty | Không assumed thành calibrated; thiếu thì explicit missing |
| Source | source_id, provider, source_type, role context/observation/restriction, access_status, policy_profile, provenance label | source_type không tự cấp authority/confidence |
| InputEvent | event_id, source_id, issued/observed/received/valid times, payload union, evidence IDs | Context không ghi edge condition |
| Measurement | type, value, unit, station/location, datum nullable, forecast flag, valid time | rain mm, height m/datum, discharge m3/s khác đại lượng |
| RoadSegment | endpoints, WGS84 polyline, length_m, direction, allowed vehicles, turn restrictions, travel profile/provenance, knowledge_epoch | Geometry không là current passability |
| Restriction | restriction_id, segment/vehicle scope, closure/reopening, authority_profile, effective time, supersedes ID | Chỉ authorized reopening gỡ closure |
| Observation | source, segment, epoch, vehicles, condition, validation, confidence, sim/real times, evidence IDs | current iff accepted, epoch khớp và observed≤now<expiry |
| Driver | vehicle, position node/on_edge, capacity vector, current load, carrying_order_ids, ordered stops | Cùng đơn vị demand, không teleport |
| Hub | graph node, location, status, cap vector/window, available_order_ids | P1 đổi hub phải có actual availability fixture |
| Order | immutable tier/original SLA/demand, pickup/destination, assignment, lifecycle, ETA, service time, defer_total | picked_up giữ carrying driver; delivered immutable |
| Report | submitter participant, category, text/photo/fixture ref, segment/location, capture time, vehicles, review status/reasons | client không gửi confidence, points hoặc accepted |
| Gap | segment+vehicle+epoch, opening occurrence, opened/filled seq | Reopen tạo gap ID mới; ảnh trùng không tạo award mới |
| Award | award_id, report_id, contributor_id, filled_gap_ids, points, sequence | Unique report và first-fill gap atomic |
| Plan | session/generation/input revision, route refs, actions, groups, projected objective/diff | Pending proposal không sửa operational assignment |
| Approval | action/plan/input revision, approve/reject, actor, audit time | Không là execution; hard rules luôn kiểm lại |
| Execution | execution_id, plan_id, eligible/excluded groups, old/new revision, attempt IDs | Commit whole candidate hoặc zero operational writes |
| PlanningJob | id, captured session/revision, status, model config hash, input/output trace refs | Superseded response không publish proposal |
| ImageReviewJob | job_id, session_id, generation, report_id, input_digest, model, model_config_hash, rubric_version, status, result/error_code, created_at, deadline_at, completed_at | Public fields follow canonical strict schema; internal lease/current pointer/budget bind one pending report + normalized-image/text/config/rubric context; stale work never publishes; score is ordinal image quality, not Observation confidence, authenticity or road-safety probability |
| Result | horizon, independent branch completion log, six metrics, unfinished, labels | Không dùng projected ETA thay delivered_at |

## Immutable vs runtime state
- Immutable: scenario graph/config/source snapshot/provenance/hash. Loader validate trước tạo session; lưu reference R2/version, không copy graph cho từng event.
- Shared knowledge input/review/gap/award stream trong một session: xử lý một lần, phát cùng observation cho baseline và FloodOps.
- Hai operational branches: baseline và floodops có position/load/routes/lifecycle/ETA/completion/approval riêng; cấm shared mutable references.
- Reroute-only P2 branch thứ ba dùng cùng physics, scope, event timeline; không gọi benchmark Google Maps.

## Snapshot
`SessionSnapshot` includes session metadata, scenario/config/calibration summary, sim clock, sources, current knowledge/restrictions, orders/drivers/hubs per branch, report/gap/reward summaries, latest plan/job, timeline cursor and projected/observed metrics. Image-review state is a separately authorized dispatcher projection, not a field on public `Report` or a general snapshot.
- Graph static endpoint trả version/hash; snapshot chỉ segment knowledge + route IDs. Client không render mỗi event bằng tải lại toàn graph.
- List response cursor opaque và bound session+generation+filter; cursor không là authorization.
- Strict unknown-property rejection cho command schemas; enums rõ, numerical finite checks, entity existence scoped session.
- Image-review metadata updates increment `event_sequence` only, never operational `revision`; an unchanged revision does not make a bound running→completed job stale.

## SQLite DO tables (schema migration, không D1)
| Bảng | Khóa/constraint | Nội dung |
|---|---|---|
| runtime_meta | singleton | schema_version, session_id, generation, revision, event_sequence, expiry, closing/reset pointer |
| snapshots | branch_id PK | validated current branch JSON + checksum; schema version |
| events | sequence PK, UNIQUE(event_id) | bounded structured event + visibility + sim minute |
| idempotency | participant_id+key PK | method/path+request digest, response status/body/ref, command result revision |
| participants | capability_digest UNIQUE | role, driver/contributor binding, expiry, revoked |
| invitations | invite_digest UNIQUE | allowed role/binding, single-use, expiry, claimed_by |
| reports | report_id PK | raw+review+evidence refs |
| awards | award_id PK, UNIQUE(report_id) | reward record |
| gap_awards | gap_id UNIQUE | first-fill award mapping |
| jobs | job_id PK | typed planning/image-review state, session/generation/report binding, input/config/rubric hashes, lease/deadline/current pointer and output refs; no image bytes |
| outbox | sequence UNIQUE | events awaiting emission; catch-up reads durable log |
| media | media_id PK | R2 key, owner, normalized hash, lifecycle, size/dimensions, expiry |
- Operational report/observation/gap/award/snapshot/idempotency/outbox writes remain atomic for human acceptance. Image-review job/result uses a separate metadata-only transition; do not join provider work to award/knowledge commits.
- Table JSON has schema version and validation on load; prepared SQL, index session-local query paths. Do not event-source the whole app when snapshot+bounded event log suffices.
- Retention cleanup must not delete idempotency before retry is no longer possible; replay retention at least session lifetime. Do not persist image bytes in DO job rows or claim provider-side zero retention without account evidence.

## Reducer API (thiết kế)
`applyCommand(state, validatedCommand, policy, deterministicContext) -> Result<{nextState, events, effects}, DomainError>`.
`effects` gồm start_planning/publish/cleanup nhưng không chạy bên trong reducer. Errors không mutate đầu vào. Freeze / clone-isolation tests theo observable branch outcomes, không test getter forwarding.
