# Truy vết toàn bộ PRD tới feature, API và kiểm chứng

[PRD v0.3](../../../FloodOps/prd.md) giữ34 requirement IDs/priorities; US-30 nay gồm [AI hỗ trợ review ảnh định lượng](ai-assisted-image-review.md), không tự duyệt hoặc thay safety/reward rules. Full application gồm P0/P1/P2; thiếu parameter hợp lệ thì disabled đúng rule, không claim nghiệm thu. P2 reroute-only triển khai và kiểm qua feature flag.

| ID | Requirement | Priority PRD | Phase owner/integration | API operationId | Behavior acceptance |
|---|---|---|---|---|---|
| US-01 | Trigger incident. | P0 | 06, 09, 10 | triggerIncident, getImpact | T01, T08, T11 |
| US-02 | Xem impact. | P0 | 06, 09, 10 | getImpact | T01 |
| US-03 | Xếp hạng đơn. | P0 | 06, 09, 10 | getImpact | T01 |
| US-04 | Kế hoạch phối hợp. | P0 | 06, 09, 10 | createPlanningJob, getPlan | T01, T15 |
| US-05 | Giải thích truy vết. | P0 | 06 | getPlan | T09 |
| US-06 | Before / after. | P0 | 06, 09, 10 | dryRunPlan, getPlan | T01, T15 |
| US-07 | Execute nhất quán. | P0 | 06 | executePlan, getExecution | T05, T06 |
| US-08 | Approve / Reject. | P0 | 06, 09, 10 | decidePlanActions | T04, T06 |
| US-09 | Chặn đường đóng. | P0 | 06 | executePlan, getRoute | T02, T13 |
| US-10 | Giữ ưu tiên. | P0 | 06 | dryRunPlan, executePlan | T05 |
| US-11 | ETA preview. | P0 | 06, 09, 10 | listNotificationPreviews | T01, T06 |
| US-12 | Defer standard. | P1 | 06, 09, 10 | executePlan | T05 |
| US-13 | Driver report. | P0 | 05, 09, 10 | submitReport, getOwnDriverDashboard | T09, T15 |
| US-14 | Observation schema. | P0 | 05 | submitReport, listObservations | T03, T08 |
| US-15 | Vehicle scope. | P0 | 05, 06 | getKnowledge, getRoute | T03 |
| US-16 | Expiry. | P0 | 05, 08 | advanceSimulation, getKnowledge | T04, T13 |
| US-17 | Conflict. | P0 | 05, 07 | resolveConflict, listRestrictions | T02, T12 |
| US-18 | Thấy thay đổi sau replan. | P0 | 06, 07, 08, 09, 10 | getPlan, getPlanningJob | T15 |
| US-19 | Advance time. | P0 | 08, 09, 10 | advanceSimulation, getAdvanceJob | T04, T13 |
| US-20 | Feasibility. | P0 | 03, 06 | dryRunPlan | T05, T06 |
| US-21 | Baseline. | P0 | 03, 08, 09, 10 | getResults | T01, T10, T14 |
| US-22 | Timeline. | P0 | 04, 08, 09, 10 | getEvents, streamEvents | T01, T13 |
| US-23 | Reset. | P0 | 04, 09, 10 | resetSession | T10 |
| US-24 | Lỗi mô hình. | P0 | 06 | getPlanningJob | T09 |
| US-25 | Policy / labels. | P0 | 02, 09, 10 | getSessionConfiguration | T14 |
| US-26 | Codex prompt log. | P0 | 08, 11, 12 | Repo evidence, not runtime API | K5 |
| US-27 | Reroute-only baseline. | P2 | 03, 08, 09, 10 | getResults | T01, T14 |
| US-28 | Nhiều nguồn. | P0 | 05, 09, 10 | listSources, replaySourceEvent | T08, T11 |
| US-29 | Citizen photo. | P0 | 05, 07, 09, 10 | submitReport, reserveMediaUpload, uploadMediaContent, completeMediaUpload | T07 |
| US-30 | Validate / human review + advisory AI image quality/match. | P0 | 01, 04, 05, 07, 09, 10, 11 | reviewReport, getMedia, createReportImageReview, getReportImageReview | T07, T09, T12; IR-01–IR-12 |
| US-31 | Points. | P0 | 07, 09, 10 | listAwards, getOwnContributorDashboard | T07 |
| US-32 | Data gaps. | P0 | 05, 07, 09, 10 | listGaps, getCoverage | T03, T07 |
| US-33 | Đổi hub. | P1 | 06, 09, 10 | executePlan | T05 |
| US-34 | Mưa và triều. | P0 | 05, 09, 10 | replaySourceEvent, triggerIncident | T08, T11 |

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
| D01,D02,D03 | scope and ordered priorities | all34 US; full native request delta documented |
| D04,D07 | geometry/time/workload/source licence | T14 independent calibration, blocked if external data absent |
| D05,D06 | stack selected by user, model/access/UI proposal | implementation compatibility + secrets/EAS gates |
| D08 | simulated-only reward | T07; no payout API |
| D09 | delivery evidence and provenance | release checklist, no schedule allocation in this plan |

## Client parity gate
Every operational US has web+native screen or background state rendering. US-26 is engineering evidence (not fake runtime UI). Server-only guards must be exercised through both clients' error/blocked states. Neither frontend locally grants route/reward authority.

## US-30 quantitative image review gate
- Contract/client giữ8 Commander tools; thêm2 dispatcher-only operations, typed rubric/advice/job/state và metadata-only event. SourcesMedia đưa normalized bytes/digest port; ReviewRewards sở hữu advisory service/job; SessionPlatform/Lead giữ durable shared runtime và config.
- UI web/native hiển thị score0–100 và yes/no/unclear + reasons; no fake percent of safety/authenticity. IR-01 rubric/derived-field oracle tách khỏi IR-12 real-vision agreement; schema/stub không chứng minh model đúng.
- Hoàn tất advisory metadata không thay operational revision/knowledge/award/route. Human review và deterministic checks luôn quyết định; failed/stale AI không chặn manual flow hoặc rollback accepted report.
