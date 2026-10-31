# Domain data contract và storage model

## Quy ước chung
- Wire schemas are defined by [openapi.json](../contracts/openapi.json); operational rules by [policy-rules.md](policy-rules.md), and advisory image-review by [ai-assisted-image-review.md](ai-assisted-image-review.md).
- AM-C01 target entity/trường campaign/mission/completion/benefit và award dưới đây chưa có trong baseline 66 operations/8 tools. Refreeze schemas/client/access/events/Reset và migration cùng producer/consumers/tests; giữ nguyên ImageReviewJob và dispatcher-only advice schema, không gửi field mới vào strict DTO cũ.
- [AM-C02](student-volunteer-demo.md) bổ sung target student campaign mode/enrollment/activity/recognition ledger. Current scope 41 US/T01..T24; baseline wire vẫn 66 operations/8 tools, student schema/access/producers03/05/07/clients/tests phải freeze cùng cutover trước implementation.
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
| DataRequest | id/version, authenticated dispatcher, session/generation/region/segment/vehicle/epoch, reason/deadline/photo requirements và trusted operational context | Gap/expiry chỉ gợi ý request; dispatcher phải gửi, không tự gán final grade hoặc award; context riêng không lộ contributor |
| MissionClassification | request/version/generation, grade enum S-F/rationale/rule IDs, input/policy hash/version, status/error | Code derive từ bound request/rules; validate current classification trước publish, missing config/stale không grade mặc định/client; không model job |
| ReviewResult | id/version, report/request/mission/session generation binding, authenticated manual decision/reasons, deterministic validated facts | DispatcherReviewService tạo server-side; ContributorRewardEngine bắt buộc current result của report trước evaluate, client/vision output không mint result |
| Campaign | id, region, data goal, activity/review windows, lifecycle, grade/reward/benefit policy versions, capacity/budget | Authorized management; missing config không publish, đóng sau pending resolution |
| Mission | id/occurrence, DataRequest/version, MissionClassification ID, campaign/region/segment/vehicle/epoch, work type/S-F/rationale, policy versions/ảnh/capacity/window | Chỉ valid policy classification của request đã gửi mới publish; submission pin bounty version; không manual/default grade hoặc hazard bonus |
| Completion | id, mission occurrence, report/participant, receipt sequence, eligibility/reasons, pinned policy | Unique eligible participant/mission occurrence; bounded slots theo stable receipt order sau review |
| Award | award_id, report_id, contributor_id, completion/mission/campaign/region, work type, pinned grade/reward version, filled_gap_ids, points/reason/sequence | One award/report; collect gap unique, verify không cần gap fill; atomic completion/budget/rank |
| RegionalLeaderboard | campaign/region/period, alias/committed points/shared rank, own position | Derived only from committed awards, không private reports/locations/identity |
| Benefit / Entitlement | policy/item ID, catalog, rank/milestone eligibility, inventory/budget, participant entitlement/status | Unique benefit entitlement, Simulated trong demo; no payout hoặc automatic cash conversion |
| StudentDemoEnrollment | participant synthetic, profile, academic period, generation, allowed campaign association từ server fixture | Một enrollment hiện hành/participant/run; không client chọn trường/kỳ hoặc tạo enrollment mới để né cap, không MSSV/SSO/real PII |
| StudentRecognitionDemoPolicy | version student-recognition-demo-v1; HCMUT-Demo +2 cap4/6, HCMUS-Demo +3 cap6/9, UIT-Demo +5 cap10/15 | Chính sách hư cấu: flat grant/activity, 2 activity/campaign/3 trong kỳ; không S-F multiplier, bounty conversion hoặc công nhận trường |
| VolunteerActivity / ParticipationConfirmation | canonical occurrence, enrollment/campaign/period/generation, interval/minutes, trusted scenario fixture ID/confirmation version/provenance | >=120 volunteer minutes riêng activity; nonoverlap/no duplicate, không student self-claim/app/GPS/wall clock; không sửa operational clock/physics |
| DemoRecognitionLedger | enrollment/activity/generation, pinned policy version, backing report/ReviewResult/attendance refs, status/reason/credited amount, campaign/period counter refs | Unique(enrollment,activity,generation) không phụ thuộc policy version; một backing report không reuse, grant/counters/events atomic; student không nhận normal award kép |
| CampusLeaderboard | campus profile/academic period/generation, alias/committed demo ĐRL/shared rank/own position | Chỉ so cùng profile/kỳ, không so raw +2/+3/+5 giữa trường, không trộn RegionalLeaderboard hoặc private attendance/report |
| Plan | session/generation/input revision, route refs, actions, groups, projected objective/diff | Pending proposal không sửa operational assignment |
| Approval | action/plan/input revision, approve/reject, actor, audit time | Không là execution; hard rules luôn kiểm lại |
| Execution | execution_id, plan_id, eligible/excluded groups, old/new revision, attempt IDs | Commit whole candidate hoặc zero operational writes |
| PlanningJob | id, captured session/revision, status, model config hash, input/output trace refs | Superseded response không publish proposal |
| ImageReviewJob | job_id, session_id, generation, report_id, input_digest, model, model_config_hash, rubric_version, status, result/error_code, created_at, deadline_at, completed_at | Public fields follow canonical strict schema; internal lease/current pointer/budget bind one pending report + normalized-image/text/config/rubric context; stale work never publishes; score is ordinal image quality, not Observation confidence, authenticity or road-safety probability |
| Result | horizon, independent branch completion log, six metrics, unfinished, labels | Không dùng projected ETA thay delivered_at |

## Immutable vs runtime state
- Immutable: scenario graph/config/source snapshot/provenance/hash. Loader validate trước tạo session; lưu reference R2/version, không copy graph cho từng event.
- Shared knowledge input/review/gap/award/campaign-completion stream trong một session: xử lý một lần, phát cùng observation cho baseline và FloodOps; không nhân award/budget/rank theo branch. Reset xóa runtime campaign/completion/ranking/simulated entitlement và giữ fixture config để khởi tạo lại.
- AM-C02 fixture enrollment/profile/kỳ/activity/attendance do phase03 bàn giao; runtime participation/ledger/campaign+period counters/campus rank được xử lý một lần trong session, không nhân theo branch. Reset/session expiry fence generation, xóa runtime và reload fixtures; không chuyển ledger/evidence sang profile/run khác.
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
| awards | award_id PK, UNIQUE(report_id) | AM-C01 thêm completion/mission/campaign/region/policy version/reason, filled_gap_ids cho collect hoặc rỗng với verify |
| gap_awards | gap_id UNIQUE | first-fill mapping cho collect/update, không phải unique constraint của verification reward |
| campaigns / missions | campaign_id / mission_id+occurrence | Target AM-C01: lifecycle, scope, versions, capacity, windows và budget config |
| data_requests / mission_classifications | request_id+version / classification_id bound request+generation+policy | Target M2 AM-C01: deterministic S-F/rule IDs/current request-policy context; không model job, US-30 vision job hoặc direct award |
| review_results | review_id+version, bound report/request/mission/generation | Target AM-C01: authenticated human result/facts, current decision cho report, reward outcome/replay provenance |
| mission_completions | completion_id PK, unique eligible(participant_id,mission_id,occurrence) | Receipt sequence và review eligibility; slot chưa chốt khi earlier competing report còn pending |
| campaign_budgets / benefit_entitlements | budget scope / unique(campaign,region,participant,benefit policy) | Atomic budget use và quyền lợi mô phỏng; rank là projection từ award |
| student_demo_enrollments / activity_confirmations | server-bound participant/profile/period/generation / canonical activity occurrence+enrollment+generation | Target AM-C02: synthetic fixture association và trusted nonoverlap attendance; không real university account |
| demo_recognition_ledger | unique(enrollment,activity occurrence,generation); unique backing report/generation cho activity credit | Target AM-C02: policy version là pinned field, không loophole unique key; current bound ReviewResult + confirmation, status/reason/credit |
| demo_recognition_counters | campaign+enrollment+generation / enrollment+profile+academic period+generation | Target AM-C02: cap trước grant, trần kỳ aggregate xuyên campaign; atomic ledger/counter/event, campus rank projection riêng |
| jobs | job_id PK | typed planning/image-review state, session/generation/report binding, input/config/rubric hashes, lease/deadline/current pointer and output refs; no image bytes |
| outbox | sequence UNIQUE | events awaiting emission; catch-up reads durable log |
| media | media_id PK | R2 key, owner, normalized hash, lifecycle, size/dimensions, expiry |
- Operational report/observation/gap/award/snapshot/idempotency/outbox writes remain atomic for human acceptance. Image-review job/result uses a separate metadata-only transition; do not join provider work to award/knowledge commits.
- AM-C01 human transition: DispatcherReviewService -> ContributorRewardEngine evaluate -> atomic review/knowledge/result/completion/reward outcome/award/budget/rank. Technical failure không half-commit/fake zero; pending/ineligible/no-slot có reason. Schema mới là pending migration target. Classification là code; US-30 photo/US-39 forecast jobs ngoài DB transaction và không cấp points/confidence.
- Request/mission version mới không tự hủy report đã nhận: result currentness là latest authenticated decision của report và khớp binding/pinned bounty versions. Result giả/sai binding/replay không mint effect; report tự do giữ nullable request/mission link theo refrozen contract.
- Mode campaign server-bound chọn đúng engine: thường dùng bounty/slots; student dùng DemoRecognitionEngine với current ReviewResult + trusted attendance, không normal award/benefit kép. Hai điều kiện tới bất kỳ thứ tự nào vẫn evaluate một lần khi đủ; freshness tại review hợp lệ, observation expiry sau không clawback trong run hiện hành. Valid redundant theo first-fill/slot vẫn có thể là quality activity evidence; duplicate/invalid/pending/reject không qualify.
- Student grant flat +2/+3/+5; một activity 240 phút/nhiều ảnh chỉ một lần, một report không cấp cho activity khác. Capped valid activity vẫn accepted/+0 có reason; technical failure không fake zero hoặc partial counters. AI vision jobs vẫn metadata-only riêng, không student-recognition authority. Student publish không phụ thuộc general bounty/voucher budget/sponsor hoặc school approval.
- Table JSON has schema version and validation on load; prepared SQL, index session-local query paths. Do not event-source the whole app when snapshot+bounded event log suffices.
- Retention cleanup must not delete idempotency before retry is no longer possible; replay retention at least session lifetime. Do not persist image bytes in DO job rows or claim provider-side zero retention without account evidence.

## Reducer API (thiết kế)
`applyCommand(state, validatedCommand, policy, deterministicContext) -> Result<{nextState, events, effects}, DomainError>`.
`effects` gồm start_planning/publish/cleanup nhưng không chạy bên trong reducer. Errors không mutate đầu vào. Freeze / clone-isolation tests theo observable branch outcomes, không test getter forwarding.
