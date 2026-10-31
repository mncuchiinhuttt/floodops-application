# Domain data contract và storage model

## Quy ước chung
- Wire schema chuẩn ở [openapi.json](../contracts/openapi.json); rules ở [policy-rules.md](policy-rules.md).
- **AM-C01:** các entity/trường campaign/mission/completion/benefit và award mở rộng dưới đây là target thiết kế theo [contributor campaigns](contributor-campaigns.md), chưa có trong baseline 64 operations. Refreeze wire/client/access/events/Reset và migration cùng producer/consumer/tests trước implementation; không tự gửi field mới vào strict DTO cũ.
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
| Report | submitter participant, category, text/photo/fixture ref, segment/location, capture time, vehicles, review status/reasons; AM-C01 optional mission link và server-pinned grade/reward version at receipt | client không gửi confidence, points, accepted hoặc tự cấp grade/version |
| Gap | segment+vehicle+epoch, opening occurrence, opened/filled seq | Reopen tạo gap ID mới; ảnh trùng không tạo award mới |
| Campaign | id, region, data goal, activity/review windows, lifecycle, grade/reward/benefit policy versions, capacity/budget | Authorized management; missing config không publish, đóng sau pending resolution |
| Mission | id/occurrence, campaign/region, segment/vehicle/epoch/data need, collect/verify/update, S-F, reason/actor/version, image requirements, capacity/window | Cấp theo data urgency/impact, không hazard; submission pin policy version |
| Completion | id, mission occurrence, report/participant, receipt sequence, eligibility/reasons, pinned policy | Unique eligible participant/mission occurrence; bounded slots theo stable receipt order sau review |
| Award | award_id, report_id, contributor_id, completion/mission/campaign/region, work type, pinned grade/reward version, filled_gap_ids, points/reason/sequence | One award/report; collect gap unique, verify không cần gap fill; atomic completion/budget/rank |
| RegionalLeaderboard | campaign/region/period, alias/committed points/shared rank, own position | Derived only from committed awards, không private reports/locations/identity |
| Benefit / Entitlement | policy/item ID, catalog, rank/milestone eligibility, inventory/budget, participant entitlement/status | Unique benefit entitlement, Simulated trong demo; no payout hoặc automatic cash conversion |
| Plan | session/generation/input revision, route refs, actions, groups, projected objective/diff | Pending proposal không sửa operational assignment |
| Approval | action/plan/input revision, approve/reject, actor, audit time | Không là execution; hard rules luôn kiểm lại |
| Execution | execution_id, plan_id, eligible/excluded groups, old/new revision, attempt IDs | Commit whole candidate hoặc zero operational writes |
| PlanningJob | id, captured session/revision, status, model config hash, input/output trace refs | Superseded response không publish proposal |
| Result | horizon, independent branch completion log, six metrics, unfinished, labels | Không dùng projected ETA thay delivered_at |

## Immutable vs runtime state
- Immutable: scenario graph/config/source snapshot/provenance/hash. Loader validate trước tạo session; lưu reference R2/version, không copy graph cho từng event.
- Shared knowledge input/review/gap/award/campaign-completion stream trong một session: xử lý một lần, phát cùng observation cho baseline và FloodOps; không nhân award/budget/rank theo branch. Reset xóa runtime campaign/completion/ranking/simulated entitlement và giữ fixture config để khởi tạo lại.
- Hai operational branches: baseline và floodops có position/load/routes/lifecycle/ETA/completion/approval riêng; cấm shared mutable references.
- Reroute-only P2 branch thứ ba dùng cùng physics, scope, event timeline; không gọi benchmark Google Maps.

## Snapshot
`SessionSnapshot` gồm session metadata, scenario/config/calibration summary, sim clock, sources, current knowledge/restrictions, orders/drivers/hubs từng branch, report/gap/reward summaries, latest plan/job, timeline cursor, metrics projected/observed phân biệt.
- Graph static endpoint trả version/hash; snapshot chỉ segment knowledge + route IDs. Client không render mỗi event bằng tải lại toàn graph.
- List response cursor opaque và bound session+generation+filter; cursor không là authorization.
- Strict unknown-property rejection cho command schemas; enums rõ, numerical finite checks, entity existence scoped session.

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
| awards | award_id PK, UNIQUE(report_id) | AM-C01 thêm completion/mission/campaign/region/policy version/reason, filled_gap_ids cho collect hoặc rỗng với verify |
| gap_awards | gap_id UNIQUE | first-fill mapping cho collect/update, không phải unique constraint của verification reward |
| campaigns / missions | campaign_id / mission_id+occurrence | Target AM-C01: lifecycle, scope, versions, capacity, windows và budget config |
| mission_completions | completion_id PK, unique eligible(participant_id,mission_id,occurrence) | Receipt sequence và review eligibility; slot chưa chốt khi earlier competing report còn pending |
| campaign_budgets / benefit_entitlements | budget scope / unique(campaign,region,participant,benefit policy) | Atomic budget use và quyền lợi mô phỏng; rank là projection từ award |
| jobs | job_id PK | request snapshot hash, state, generation, output refs |
| outbox | sequence UNIQUE | events awaiting emission; catch-up reads durable log |
| media | media_id PK | R2 key, owner, hash, lifecycle, size/dimensions, expiry |
- Transition viết reports/observations/gaps/completions/awards/budget/entitlements/snapshot/idempotency/outbox trong cùng DO transaction khi cùng nghiệp vụ. Bảng AM-C01 là migration target, không schema runtime đã tồn tại; không await provider/network để cấp quà trong transaction.
- Table JSON có schema version và validation on load; prepared SQL, index session-local query paths. Không event-source toàn bộ app nếu snapshot+bounded event log đủ.
- Retention cleanup không xóa idempotency quá sớm khi command response vẫn có thể retry; replay retention ít nhất lifetime session.

## Reducer API (thiết kế)
`applyCommand(state, validatedCommand, policy, deterministicContext) -> Result<{nextState, events, effects}, DomainError>`.
`effects` gồm start_planning/publish/cleanup nhưng không chạy bên trong reducer. Errors không mutate đầu vào. Freeze / clone-isolation tests theo observable branch outcomes, không test getter forwarding.
