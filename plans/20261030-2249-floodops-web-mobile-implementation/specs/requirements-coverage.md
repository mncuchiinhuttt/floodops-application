# Truy vết toàn bộ PRD tới feature, API và kiểm chứng

[PRD v0.5](../../../FloodOps/prd.md): 41 US (38 P0/2 P1/1 P2), gồm M1 31 và M2 10; T01..T24/IR-01..IR-12. AM-AI02 giữ US-39/T21/D11 forecast; AM-M01/D12 giữ web core M1/native-campaign extensions M2/calibration M3; AM-C02 thêm US-40/US-41/T22..T24/D13. POL/I/K giữ nguyên. M1 free-report/review/simple-points không đòi mission; full campaign/native gate là M2.

[AM-C01](contributor-campaigns.md) là target sản phẩm đã chốt, chưa thêm operation vào baseline 66 API/8 tools. New API/DTO/access/projection cần contract refreeze cùng producers05/07, clients09/10 và QA11; không invent operationId hoặc mở dispatcher ledger cho contributor. Advice ảnh không tự cấp reward/grade/route authority.

[AM-C02](student-volunteer-demo.md) thêm student campaign mode cùng workflow, nhưng sau ReviewResult dùng DemoRecognitionEngine/ledger thay normal bounty. Delta mode/enrollment/activity/attendance/credits/counters/campus rank/access/Reset cần cùng freeze/cutover với fixture producer03, producers05/07 và clients09/10/QA11. Policy hư cấu mặc định v1 dùng +2/+3/+5; publish không cần general bounty/voucher/sponsor/trường thật phê duyệt.

| ID | Requirement | Milestone / priority | Phase owner/integration | API operationId | Behavior acceptance |
|---|---|---|---|---|---|
| US-01 | Trigger incident. | M1/P0 | 06, 09, 10 | triggerIncident, getImpact | T01, T08, T11 |
| US-02 | Xem impact. | M1/P0 | 06, 09, 10 | getImpact | T01 |
| US-03 | Xếp hạng đơn. | M1/P0 | 06, 09, 10 | getImpact | T01 |
| US-04 | Kế hoạch phối hợp. | M1/P0 | 06, 09, 10 | createPlanningJob, getPlan | T01, T15 |
| US-05 | Giải thích truy vết. | M1/P0 | 06 | getPlan | T09 |
| US-06 | Before / after. | M1/P0 | 06, 09, 10 | dryRunPlan, getPlan | T01, T15 |
| US-07 | Execute nhất quán. | M1/P0 | 06 | executePlan, getExecution | T05, T06 |
| US-08 | Approve / Reject. | M1/P0 | 06, 09, 10 | decidePlanActions | T04, T06 |
| US-09 | Chặn đường đóng. | M1/P0 | 06 | executePlan, getRoute | T02, T13 |
| US-10 | Giữ ưu tiên. | M1/P0 | 06 | dryRunPlan, executePlan | T05 |
| US-11 | ETA preview. | M1/P0 | 06, 09, 10 | listNotificationPreviews | T01, T06 |
| US-12 | Defer standard. | M2/P1 | 06, 09, 10 | executePlan | T05 |
| US-13 | Driver report. | M1/P0 | 05, 09, 10 | submitReport, getOwnDriverDashboard | T09, T15 |
| US-14 | Observation schema. | M1/P0 | 05 | submitReport, listObservations | T03, T08 |
| US-15 | Vehicle scope. | M1/P0 | 05, 06 | getKnowledge, getRoute | T03 |
| US-16 | Expiry. | M1/P0 | 05, 08 | advanceSimulation, getKnowledge | T04, T13 |
| US-17 | Conflict. | M1/P0 | 05, 07 | resolveConflict, listRestrictions | T02, T12 |
| US-18 | Thấy thay đổi sau replan. | M1/P0 | 06, 07, 08, 09, 10 | getPlan, getPlanningJob | T15 |
| US-19 | Advance time. | M1/P0 | 08, 09, 10 | advanceSimulation, getAdvanceJob | T04, T13 |
| US-20 | Feasibility. | M1/P0 | 03, 06 | dryRunPlan | T05, T06 |
| US-21 | Baseline. | M1/P0 | 03, 08, 09, 10 | getResults | T01, T10, T14 |
| US-22 | Timeline. | M1/P0 | 04, 08, 09, 10 | getEvents, streamEvents | T01, T13 |
| US-23 | Reset. | M1/P0 | 04, 09, 10 | resetSession | T10 |
| US-24 | Photo/forecast typed failure/unavailable and stale fencing; manual review and deterministic planner continue. | M1/P0 (photo); M2 forecast parity | 01, 04, 07, 09, 10, 11 | US-30 jobs baseline; US-39 forecast delta pending | T09, T21; IR-04/08 |
| US-25 | Policy / labels. | M1/P0 | 02, 09, 10 | getSessionConfiguration | T14 |
| US-26 | Codex prompt log. | M1/P0 | 08, 11, 12 | Repo evidence, not runtime API | K5 |
| US-27 | Reroute-only baseline. | M2/P2 | 03, 08, 09, 10 | getResults | T01, T14 |
| US-28 | Nhiều nguồn. | M1/P0 | 05, 09, 10 | listSources, replaySourceEvent | T08, T11 |
| US-29 | M1 free citizen photo/report with manual review and pinned simple demo policy, no mission required; M2 request/mission binding and pinned campaign policy. | M1/P0; M2 campaign extension | 05, 07, 09, 10 | submitReport/upload baseline; M2 DataRequest/mission links pending AM-C01 cutover | M1 T07; M2 T17/T18/T20 |
| US-30 | Validate / human review + advisory AI image quality/match. | M1/P0 | 01, 04, 05, 07, 09, 10, 11 | reviewReport, getMedia, createReportImageReview, getReportImageReview | T07, T09, T12; IR-01–IR-12 |
| US-31 | M1 simple simulated points from accepted fresh first-fill free report; M2 RewardEngine/current ReviewResult with campaign completion/budget/rank. | M1/P0; M2 campaign extension | 07, 09, 10 | Pinned demo policy/refreeze; campaign result/evaluation delta pending, no contributor listAwards | T07; M2 T18/T20 |
| US-32 | Data gaps and mission data need. | M1/P0 | 05, 07, 09, 10 | listGaps, getCoverage; mission links pending AM-C01 | T03, T07, T18 |
| US-33 | Đổi hub. | M2/P1 | 06, 09, 10 | executePlan | T05 |
| US-34 | Mưa và triều. | M1/P0 | 05, 09, 10 | replaySourceEvent, triggerIncident | T08, T11 |
| US-35 | Dispatcher DataRequest from missing data, campaign lifecycle and validated publication. | M2/P0 | 01 contract, 05, 07, 09, 10, 11 | Pending DataRequest/version/context/Campaign access/window delta | T16, T20 |
| US-36 | Contributor policy classification S-A-B-C-D-E-F, current classification/provenance, no manual/default grade. | M2/P0 | 01 contract, 05, 07, 09, 10, 11 | Pending MissionClassification/Mission/policy snapshot delta | T17, T18, T20 |
| US-37 | Regional/campaign leaderboard and shared ties. | M2/P0 | 01 contract, 07, 09, 10, 11 | Pending AM-C01 alias-only leaderboard projection | T18, T19, T20 |
| US-38 | Benefit/prize catalog and simulated entitlement. | M2/P0 | 01 contract, 07, 09, 10, 11 | Pending AM-C01 catalog/eligibility/entitlement delta; no payout API | T16, T20 |
| US-39 | Gated AI historical flood forecast: bound target/location/unit/horizon, uncertainty/as-of/model-data versions; never road authority/publish/reward/Execute. | M2/P0 | 01 contract, data/forecast producer by Lead assignment, 09, 10, 11 | Pending AM-AI02 forecast schema/jobs/access/client cutover; no guessed operationId | T21 |
| US-40 | Student-exclusive campaign mode, fixture enrollment/profile/academic period, allowed-campus scope and Demo labels. | M2/P0 | 01 contract, 03 fixtures, 05, 07, 09, 10, 11 | Pending AM-C02 mode/association/access/projection; no institution auth/API | T22, T24 |
| US-41 | DemoRecognitionEngine from ReviewResult + trusted >=120-minute activity; fixed profile grant, cross-campaign caps, unique atomic ledger/counters. | M2/P0 | 01 contract, 03 fixtures, 05, 07, 09, 10, 11 | Pending AM-C02 confirmation/result/ledger/campus rank/events/Reset; no normal bounty double grant | T22, T23, T24 |

## Mandatory rule coverage
| Constraint | Owner | Test proof |
|---|---|---|
| POL-01 / I2 | routing/gate/edge-entry | T02,T13; arbitrary blocked-edge proposal, no new entry |
| POL-02 / I5 | approval/execute | T03,T04,T06; no role/approval bypass |
| POL-03 / I3 | epochs/conflicts/revision | T04,T09,T12,T13 |
| POL-04 | combined candidate custody/capacity | T05,T06; whole-batch and every stop |
| POL-05 / I1 | immutable tier/SLA + lexicographic objective | T01,T05; never trade critical for standard gain |
| POL-06 | cumulative defer config | T05 + repeated defers and missing limit |
| POL-07 | projected vs committed ETA | T06,T15 |
| POL-08 | ready is not executed | T01,T15 |
| I4 | observation/route vehicle scope | T03,T15 |
| K1,K2 | observed completion/H same branches | T01,T10,T14, N/A baseline0 |
| K3 | all5 always on | gate/property/edge-entry suites |
| K4 | real model+UI wall latency and10 runs | model eval + web/native rehearsal, failure denominator |
| K5 | Codex feedback trail | repo human-reviewed entries + actual checks |
| K6 | report-driven explained ETA diff | T15 functional fixture only |
| D01,D02,D03 | scope and priorities by milestone | M1 web core; native/campaign and hub/defer/P2 extensions M2, no safety reduction |
| D04,D07 | geometry/units/provenance/assumptions and source licence | M1 truthful Calibration incomplete labels; M3 T14 independent calibration before real-scale claims |
| D05,D06 | stack selected by user, model/access/UI proposal | implementation compatibility + secrets/EAS gates |
| D08 | prize/benefit design, simulated-only delivery | T07,T20; sponsor/budget/real fulfillment TBD, no payout API |
| D09 | delivery evidence and provenance | release checklist, no schedule allocation in this plan |
| D10 / AM-C01 | campaign, S-F, collect/verify/update, ranking/prize and contract cutover | T16..T20; baseline receipts/docs validation không là proof phần mới |
| D11 / AM-AI02 | Only US-30 photo advice and gated US-39 forecast are runtime AI; planning/S-F deterministic | T09/IR and M2 T21; no model operational authority |
| D12 / AM-M01 | M1 functional web core (31 US), M2 extensions (10 US), M3 independent validation | Native/campaign DoD M2; calibration claims M3; no all-roadmap gate for M1 |
| D13 / AM-C02 | Fictional student-recognition-demo-v1, profiles +2/+3/+5, activity eligibility/caps/ledger/campus rank | US-40/41, T22..T24; no real-school recognition, PII/SSO or school-approval prerequisite |

Workflow coverage: dispatcher DataRequest -> contributor policy classification -> mission board -> report -> dispatcher ReviewResult -> ContributorRewardEngine -> feedback. T16 kiểm nguồn request, T17 kiểm rules/config/binding/staleness, T18 bắt buộc current ReviewResult trước reward và atomic/replay, T20 kiểm full loop hai client. Giữ US-30/IR riêng; score ảnh không là cấp nhiệm vụ hoặc điểm.

Student branch coverage: cùng DataRequest/classification/review, mode server-bound -> DemoRecognitionEngine + canonical attendance -> eligibility/ledger/counters -> feedback/campus rank. T22 kiểm ba profile/publish/mode isolation; T23 kiểm hai điều kiện/119-120-240 phút/reuse/overlap/cap/concurrency; T24 kiểm labels/privacy/offline/Reset/expiry/cross-client. Bounty/benefit/ranking thường giữ nguyên và không cấp kép từ student submission.

## Client parity gate
M1 operational US require scoped web behavior/error/blocked-state proof. M2 native parity and campaign/student extensions require corresponding web/native evidence after cutover; US-26 is engineering evidence. Student completion does not wait for independent forecast/hub/defer/P2 extensions. Neither frontend locally grants route/reward/recognition authority.

## US-30 quantitative image review gate
- Contract/client giữ8 Commander tools; thêm2 dispatcher-only operations, typed rubric/advice/job/state và metadata-only event. SourcesMedia đưa normalized bytes/digest port; ReviewRewards sở hữu advisory service/job; SessionPlatform/Lead giữ durable shared runtime và config.
- UI web/native hiển thị score0–100 và yes/no/unclear + reasons; no fake percent of safety/authenticity. IR-01 rubric/derived-field oracle tách khỏi IR-12 real-vision agreement; schema/stub không chứng minh model đúng.
- Hoàn tất advisory metadata không thay operational revision/knowledge/award/route. Human review và deterministic checks luôn quyết định; failed/stale AI không chặn manual flow hoặc rollback accepted report.
