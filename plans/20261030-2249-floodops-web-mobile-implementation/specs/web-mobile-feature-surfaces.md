# Ma trận feature surfaces Web + Mobile

AM-M01 integration: catalog dưới đây là roadmap. M1 chỉ functional web core; campaign/student/native parity là M2, independent calibration là M3. AM-AI02 chỉ US-30 photo advice và gated US-39/T21 forecast là runtime AI; deterministic MissionClassification/rules và planner thay legacy model orchestration. Student US-40/US-41/T22..T24 là extension riêng, không đòi forecast/hub/defer/P2 hoặc normal bounty first-fill/slots/budget. Legacy 66 operations/8 tools chưa refreeze; không coi route target là API đã có.

## Quy tắc trải nghiệm dùng chung

- Phạm vi là FloodOps simulation theo PRD v0.5: một session / đội / khu vực; fixture, replay và dữ liệu tham chiếu có provenance. Mọi màn có banner `Simulation`, trạng thái hiệu chuẩn D04, nguồn Reference/Replayed/Simulated, simulation time khi áp dụng. Không suy road passability từ rain/tide context.
- Product contract ở [PRD mục 3.4](../../../FloodOps/prd.md): **hai app**, không chỉ hai kích thước web. Web ưu tiên bàn dispatcher; mobile là một app native iOS/Android cho driver/contributor và dispatcher đầy đủ (impact, plan, approve/reject, execute, sources/review, timeline, results/reset). Vai trò quyết định workspace; nền tảng chỉ đổi cách trình bày. Native dùng Expo Router stack + tabs; web dùng React Router Data Mode.
- Session ID trên URL không cấp quyền. Capability server-issued, session-scoped, giới hạn actor/action; API xác thực quyền trên mọi request. Không tin `role` từ selector/body/query/local state. Persona picker nếu có chỉ chọn cách ghép nối, không cấp dispatcher/driver/contributor capability. Không tạo account consumer, customer app, auth SaaS hay multi-tenant.
- Kế hoạch bao gồm triển khai đầy đủ P0/P1/P2; ưu tiên quyết định mặc định / mức khả dụng chứ không phải lý do bỏ qua P1/P2. P1 defer standard / đổi hub có hành vi hoàn chỉnh nhưng chỉ cho phép khi config + capability hợp lệ; thiếu config thì disabled/không đề xuất với reason. P2 reroute-only comparison được triển khai đầy đủ và cấu hình bật/tắt rõ ràng, không làm benchmark Google Maps. Không có live GPS/background tracking, live provider connectors, notification gửi thật hoặc payout/cash/fulfillment voucher thật; AM-C01 có catalog và entitlement mô phỏng.
- Approve/Reject là quyết định tách khỏi Execute; Approve không commit hoặc bỏ hard gate. Execute luôn gửi snapshot revision mới, gate server-side và atomic batch. Replan không Execute. Preview/ETA chưa commit luôn ghi `Projected`; ETA/notification preview derive từ committed state, không gửi thật.
- Advisory AI image review stays within the existing dispatcher Report-review detail in both apps; exact contract is [ai-assisted-image-review.md](ai-assisted-image-review.md). It never adds a route, capability or report authority.
- AM-C01 thêm US-35..US-38/T16..T20 cho [campaign/mission S-F/ranking/benefit](contributor-campaigns.md). Route mới là target sau cutover; baseline 66 operations/8 tools và dispatcher-only advice ảnh chưa cấp API campaign. Quality score không phải điểm thưởng; không dùng `/awards` dispatcher-only để dựng leaderboard.

## Route / screen matrix

| Surface | Web route | Expo Router screen | PRD mapping / hành vi |
|---|---|---|---|
| Join / rejoin session | `/` → `/sessions/:sessionId/...` | `app/(join)/index.tsx` → `app/sessions/[sessionId]/_layout.tsx` | Chọn session bằng capability pairing/rejoin từ API. Dynamic `[sessionId]` layout tạo session context; capability scope do server cấp, hết hạn / scope sai thì 401/403. Không chọn role để tăng quyền. Reset chuyển session generation/ID mới, client rejoin rõ ràng. |
| Dispatcher overview + incident + map | `/sessions/:sessionId/dispatch/map` | `app/sessions/[sessionId]/(tabs)/map.tsx` và `overview.tsx` | US-01/02/03/10/25/28/34; I1–I5, K3. rain/high_tide/combined riêng với road event; map theo geometry/scale từ snapshot, `react-native-svg` native renderer, legend closed/congestion/unknown, impact entities tính từ state, priority critical > food > standard. Có text/list alternative và vehicle scope. |
| Plan, diff, gate, approvals, execution | `/sessions/:sessionId/dispatch/plans/:planId` | `app/sessions/[sessionId]/(tabs)/plan.tsx`, `app/sessions/[sessionId]/planning/[planId].tsx` | US-04/05/06/07/08/09/10/11/20/24; POL-01..08. Hiện target/reason/evidence/rule ID/dependency group/risk; before/after assignment + ETA delta; feasibility/reason; Approve, Reject, Execute tách biệt. Pending/blocked/dependent groups không chạy. Chỉ `Ready` khi hard rules pass, soft-risk approval khớp action+revision; Execute kiểm lại revision/evidence/capacity/vehicle/pickup. `412` stale precondition hoặc expiry → Needs replan, không retry command cũ. |
| P1 plan actions | Trong Plan, chỉ khi capability + config bật | Chi tiết trong tab Plan + `app/sessions/[sessionId]/planning/[planId].tsx` | US-12/33. Đầy đủ behavior, không bị bỏ do priority: Defer chỉ standard, cumulative limit có căn cứ, giữ original SLA; thiếu limit thì disabled. Hub change chỉ unpicked order, hub availability/capacity fixture hợp lệ; picked-up giữ driver/hub và không dịch chuyển. Approval không override. |
| Sources / context / coverage | `/sessions/:sessionId/dispatch/sources` | `app/sessions/[sessionId]/(tabs)/sources.tsx`, `app/sessions/[sessionId]/sources/[sourceId].tsx` | US-14/15/16/17/28/32/34. Registry provider/type/simulated/time, freshness/expiry, units/datum/location, vehicle scope, confidence/trust, validation; rain/tide/camera/driver/community phân biệt context và edge evidence. Coverage/gap theo `(segment, vehicle)`. Expiry → no current evidence + Needs replan; unresolved conflict → Blocked/review; closure authoritative. |
| Driver workspace / own assignment | `/sessions/:sessionId/driver` | `app/sessions/[sessionId]/driver/index.tsx` | Driver-capable participant dùng `getOwnDriverDashboard`, graph/relevant knowledge và own reports; xem đơn/điểm dừng/tuyến/ETA đã commit của mình. Không đọc dispatcher snapshot hoặc toàn đội xe. Đây là nhận cập nhật phân công, không accept/reject cuốc, tự đổi đơn, GPS tracking hoặc turn-by-turn navigation. US-07/11/13/14/15/16; shared committed state sau Execute. |
| Driver report | `/sessions/:sessionId/driver/report` | `app/sessions/[sessionId]/reports/driver.tsx` | US-13/14/15/16; text + quick options (motorbike passable / deep water / dry), segment/vehicle/time/evidence. Chọn segment thủ công; không tự động GPS hay tracking. Nút nhanh/draft vẫn dùng khi LLM lỗi; server quyết định validation/acceptance. |
| Community report submit | `/sessions/:sessionId/community/new` | `app/sessions/[sessionId]/community/new.tsx` | US-29/30/32/36. Contributor capability; permitted photo/fixture ID, segment/location, capture time, vehicle scope, description và optional mission link. Sau cutover server kiểm task/campaign/window và pin grade/reward version tại receipt; upload/report là Pending review, không tự cộng điểm/rank. Report tự do vẫn có. Không claim chống giả GPS/ảnh. |
| My community reports / review status | `/sessions/:sessionId/community/reports` | `app/sessions/[sessionId]/community/reports.tsx` | Contributor dùng own dashboard + own `listReports`/`getReport`; pending/accepted/rejected/reason và award status riêng. Không truy cập ảnh/report người khác hoặc thao tác review. US-29/30/31/32; status chỉ đổi theo server. |
| Report review + decision | `/sessions/:sessionId/dispatch/reports` and `/dispatch/reports/:reportId` | `app/sessions/[sessionId]/reports/review.tsx` | US-17/29/30/31/32. Dispatcher sees image/timestamp/mapping/duplicate/conflict and a separate AI-advisory card: display `quality_score` as `Chất lượng ảnh: n/100`; show `quality_ratings` (sharpness, lighting, scene_visibility, detail), `report_match` (`yes/no/unclear`), `visible_summary`, `mismatch_notes`, `reasons` and advisory label. Advice never verifies authenticity/location/time/passability, accepts/rejects, changes closure/vehicle scope or reward. Human Accept/Reject + reason stays separate and usable while AI pending/failed; acceptance, gap fill and award remain distinct. |
| Community points | `/sessions/:sessionId/community/points` | `app/sessions/[sessionId]/community/points.tsx` | US-31; own ledger/reason/pinned policy và nhãn Simulated; không payout/cashout/fulfillment thật. Tách pending estimate khỏi committed points/rank; benefit catalog minh họa riêng. Reset clear ledger, stale/offline không giả điểm đã ghi. |
| Campaign list/detail + progress | `/sessions/:sessionId/community/campaigns` và `/community/campaigns/:campaignId` | `app/sessions/[sessionId]/community/campaigns/index.tsx`, `community/campaigns/[campaignId].tsx` | US-35; region chọn thủ công, data goal/activity/review window, lifecycle, mission/progress và điều kiện thưởng. Missing config giữ draft/disabled. Gap không là chỉ dẫn tới nơi nguy hiểm. |
| Mission list/detail S-F | Trong campaign và `/community/missions/:missionId` | `app/sessions/[sessionId]/community/missions/[missionId].tsx` | US-36; board chỉ có nhiệm vụ từ DataRequest đã gửi và current valid policy classification S-F. Hiện safe mission summary/reason/version/work type/scope/ảnh/time/capacity/reward; không private order/driver context hoặc nhập tay grade. CTA mở form đúng request/mission binding, không giữ slot; bỏ qua không phạt. |
| Regional leaderboard | `/sessions/:sessionId/community/leaderboard` | `app/sessions/[sessionId]/community/leaderboard.tsx` | US-37; campaign/region filter, alias/committed points/shared rank/own position. Pending/closing là provisional, closed sau pending resolution; không ảnh/report/vị trí/identity người khác. |
| Benefits / prize eligibility | `/sessions/:sessionId/community/benefits` | `app/sessions/[sessionId]/community/benefits.tsx` | US-38; catalog, rank/milestone/tie conditions, inventory và own entitlement/status Simulated. Không hứa voucher đã có thật, không đổi điểm ra tiền, không có fulfillment/redemption thật. |
| Authorized campaign management / DataRequest | `/sessions/:sessionId/dispatch/campaigns` | `app/sessions/[sessionId]/campaigns/manage.tsx` | US-35/36/38; dispatcher xác định missing data rồi gửi DataRequest/scope/reason/deadline/ảnh, xem classification pending/failed/needs clarification và publish guard. Không nhập final S-F/points; sửa request thì classification lại. Capability quản lý campaign/policy/budget/window kiểm server-side; contributor không review/quản lý. |
| Timeline / simulation clock / Reset | `/sessions/:sessionId/dispatch/timeline` | `app/sessions/[sessionId]/(tabs)/timeline.tsx` | US-19/22/23/25. Timeline sim time + event sequence/actor, report→plan→gate→execute; Advance +N chỉ online và dispatcher-capable, N>0; expiry xét trước Execute/edge entry. Reset confirm tạo ID/generation mới, clear run state/metrics/reports/points, invalidates old capabilities/responses; rejoin explicit. Playback speed không đổi physics/TTL/SLA/results. |
| Results / baseline | `/sessions/:sessionId/dispatch/results` | `app/sessions/[sessionId]/(tabs)/results.tsx` | US-21/25; K1/K2/K3/K4/K6; T01/T10/T14. Cùng seed/events/physics/H; static baseline vs FloodOps, raw metrics, unfinished, `Simulation result`, calibration status, projected vs measured distinction. Baseline=0 makes rate N/A, raw counts remain. D04 incomplete is visible; never claim calibrated/KPI achieved without evidence. |
| P2 reroute-only comparison | Results surface, explicit P2 configuration | Results section in `app/sessions/[sessionId]/(tabs)/results.tsx` | US-27 được triển khai đầy đủ; cùng input/policy/horizon, route-only per vehicle, không đổi driver/hub/priority; configuration chỉ bật/tắt surface, không bỏ scope khỏi plan. Không gọi là Google Maps benchmark. |
| Prompt / build evidence | Not a runtime route | Not a runtime screen | US-26/K5 là repository submission evidence (prompt→change→human decision→check result), không phải operational feature; theo dõi trong `evidence-log` / delivery documentation của parent plan. |

## State and error contract surfaced by UI

### AM-C02 - Student demo trong cùng contributor app

Sau contract cutover, web/native thêm filter/tab student campaign và own demo-recognition ledger/campus leaderboard trong contributor feature hiện có, không app/role mới. [AM-C02](student-volunteer-demo.md) bind một campus profile/kỳ/allowed campaign từ server fixture enrollment. Không form MSSV/email/SSO, selector tự sửa trường/học kỳ hoặc quyền review/Reset mới.

1. Dispatcher quản lý student campaign/DataRequest trong capability hiện có; cùng policy classification S-F/publish status. Publish kiểm student-recognition-demo-v1/activity/review config, không đợi bounty/voucher/sponsor hoặc trường thật.
2. Board/detail hiển thị profile hư cấu, activity, S-F urgency, hai điều kiện >=120 fixture minutes + quality report, flat grant +2/+3/+5 và cap campaign/kỳ còn lại; không GPS nền/timer chờ hai giờ/S-F multiplier.
3. Own result hiển thị dispatcher decision/remarks và recognition status/reason; attendance từ Demo fixture khác US-30 image advice. pending_review/pending_participation chưa cộng; recognized_demo chỉ số commit, ineligible/capped lý do rõ; API error không fake +0.
4. Own ledger/counters aggregate qua campaign trong cùng enrollment/profile/kỳ/generation. Campus rank dùng alias/own position, đồng hạng cùng profile/kỳ; không so raw ĐRL khác trường, không trộn bounty/rank/quà thường hoặc lộ attendance/report người khác.

Nhãn luôn hiện trong campaign/mission/result/ledger/ranking: **Điểm rèn luyện mô phỏng - không có giá trị công nhận của trường**. Không logo/con dấu/giấy chứng nhận hoặc trạng thái “Đã được trường duyệt”. Offline chỉ report draft; reconnect refresh enrollment/mode/policy/session trước explicit Send; không queue attendance/recognition/review. Reset/session expiry clear runtime enrollment/ledger/counters/rank, fence generation cũ; profile comparison là run mới, không chuyển evidence/credit.

T22..T24 phải exercise cùng web/native, gồm 119/120/240 phút, hai điều kiện khác thứ tự, cap xuyên campaign/race, unique activity/report, labels/privacy và no normal award double grant. Không coi route target hoặc UI fixture là API đã có trong baseline 66 operations/8 tools.

AM-C01 cần hiện campaign/mission draft/paused/closing/closed và missing-config reason, pending reward estimate khác committed rank, review_overdue/needs_resolution trước khi chốt slot/quà. Policy mới chỉ áp report server nhận sau thay đổi; offline draft refresh trước explicit send, không giữ slot hoặc đổi campaign/region ID im lặng.

Contributor workflow UI: DataRequest -> valid policy classification -> board -> gửi ảnh/thông tin -> dispatcher manual review -> server ReviewResult -> reward evaluation -> feedback. Hiện review decision/remarks và reward status/reason/committed points riêng; chưa có current result thì reward pending, policy classification lỗi không fake grade và technical reward error không fake 0. Human ReviewResult/reward handoff là nội bộ cùng backend; US-30 image advice/card/refetch/IR vẫn riêng và không cấp điểm.

| State / error | Required presentation and behavior |
|---|---|
| Loading / unavailable / offline | Keep layout; label cached read as `Stale/offline` with last server revision/time if known. Disable operational commands. Only report drafts and unsent images can be persisted in mobile outbox; AI image-review requests are explicit-online only and never queued. |
| 401 / 403 capability missing, expired or wrong scope | No privileged control rendered/enabled. Show rejoin/pairing guidance; never fall back to user-selected role. Server remains authoritative even if UI is stale. |
| 412 stale precondition / proposal revision mismatch | Mark proposal+approval stale, refetch current state, show `Needs replan`; do not resubmit old command. Refetch/replan is a new explicit action. |
| 409 domain conflict / in-flight / Reset conflict | Present the API's structured domain result and current session state; never interpret this as a stale revision (412) or silently retry a command. |
| Expired evidence / unresolved conflict / hard gate | Show rule ID, affected edge/vehicle/action, evidence/time and reason; route blocked or requires review/replan. Approval cannot override hard rules; rain/tide context cannot set edge status. |
| 4xx validation (schema, photo, mapping, timestamp, duplicate) | Preserve report input; show field-level text and server reason code; distinguish rejected, accepted, pending review, redundant, zero-point. |
| AI/API or deterministic planning error | Planning failure leaves committed state unchanged; show typed error and explicit Replan. Image-review timeout/refusal/invalid/stale/unavailable shows no score, never a fabricated 0 or canned result; manual Accept/Reject stays available, and retry is a separate user action with a new key only for a failed job. |
| Execute batch failure / capacity or dependency failure | No partial commit for failed combined candidate; show each excluded/dependent group and `waiting`/ETA null where applicable. Do not show projected ETA as committed. |
| Reset / generation changed while app is offline | Keep local report draft for user choice, mark `Stale session—review before re-link`; never auto-send it into new session. All prior command/proposal/capability data is unusable. |
| Live session updates | Consume the authorized stream through the shared API client; native uses documented `expo/fetch` response streaming for `text/event-stream`. If unavailable/interrupted, poll the same state contract. `image_review_changed` is dispatcher-only metadata; refetch the current job by event sequence and session/generation/report/job/input digest, and accept a valid same-revision progress update. Stream events never approve or execute. |

## Mobile offline draft-only semantics

**Allowed local outbox schema:** `DriverReportDraft` or `CommunityReportDraft` with draft fields + local image file references for the corresponding report only. This is an unsent draft, not an accepted observation, approval, command, reward, or server-side queue. Image-review requests/jobs are not persisted or retried offline. Do not enqueue Approve, Reject, Execute, Reset, AdvanceSimulationTime, plan/revision-dependent commands, or any previously captured command.

1. Offline form can save text/quick-report fields, manually chosen segment and vehicle scope, capture time, and an unsent photo in app-private storage. Never auto-capture/background-send GPS. Photo stays local until an online explicit send.
2. Draft states: `Saved offline` → (user opens and reviews) `Ready to send` → `Uploading` → `Pending review`/`Sent` or `Needs attention`. `Saved offline` is not `accepted`. Server response is required before a report becomes pending/accepted; server review is required before it affects road knowledge or points.
3. On reconnection, first refresh session ID/generation and capability. Only show Send when current session matches draft binding and current capability allows report submission. User explicitly reviews and taps Send; no automatic sync/send just because connectivity returned. For stale session/capability, mark `Needs relink`; never send to new session by rewriting IDs silently.
4. Retry failed image/report upload only as a report submission using server-defined idempotency contract. Preserve draft on timeout/validation error; show reason. A report response cannot authorize Execute. Duplicate-image detection and points are server-side.
5. Reset online clears server session and invalidates prior tokens. Local draft deletion is an explicit discard choice; if retained, mark stale and require user review/relink. No old proposal/approval/command outbox survives Reset.
6. AM-C01 draft có mission/campaign reference và policy đã xem nhưng không là completion hoặc quyền nhận thưởng. Online refresh mission trước gửi; mission/region/session mới không được thay ID im lặng. Không queue quản lý campaign hoặc claim benefit offline.

## Future implementation file map

```text
apps/web/src/router.tsx
apps/web/src/features/session/{routes,components,api}/
apps/web/src/features/scenario/{routes,components,api}/
apps/web/src/features/operations-map/{routes,components,api}/
apps/web/src/features/incidents/{routes,components,api}/
apps/web/src/features/planning/{routes,components,api}/
apps/web/src/features/reports/{routes,components,api}/
apps/web/src/features/knowledge/{routes,components,api}/
apps/web/src/features/sources/{routes,components,api}/
apps/web/src/features/rewards/{routes,components,api}/
apps/web/src/features/simulation/{routes,components,api}/
apps/web/src/features/results/{routes,components,api}/
apps/web/src/features/evidence-log/{routes,components,api}/
apps/web/src/features/session/routes/SessionJoinRoute.tsx
apps/web/src/features/scenario/routes/ScenarioReplayRoute.tsx
apps/web/src/features/operations-map/routes/OperationsMapRoute.tsx
apps/web/src/features/incidents/components/IncidentTriggerPanel.tsx
apps/web/src/features/planning/routes/PlanReviewRoute.tsx
apps/web/src/features/reports/routes/DriverReportRoute.tsx
apps/web/src/features/reports/routes/driver-dashboard-route.tsx
apps/web/src/features/reports/routes/community-reports-route.tsx
apps/web/src/features/reports/routes/CommunityReportRoute.tsx
apps/web/src/features/reports/routes/ReportsReviewRoute.tsx
apps/web/src/features/knowledge/routes/KnowledgeReviewRoute.tsx
apps/web/src/features/sources/routes/SourceRegistryRoute.tsx
apps/web/src/features/rewards/routes/PointsLedgerRoute.tsx
apps/web/src/features/simulation/routes/TimelineRoute.tsx
apps/web/src/features/results/routes/SimulationResultsRoute.tsx
apps/web/src/features/evidence-log/routes/EvidenceLogRoute.tsx
apps/mobile/app/_layout.tsx
apps/mobile/app/(join)/index.tsx
apps/mobile/app/sessions/[sessionId]/_layout.tsx
apps/mobile/app/sessions/[sessionId]/(tabs)/_layout.tsx
apps/mobile/app/sessions/[sessionId]/(tabs)/overview.tsx
apps/mobile/app/sessions/[sessionId]/(tabs)/map.tsx
apps/mobile/app/sessions/[sessionId]/(tabs)/plan.tsx
apps/mobile/app/sessions/[sessionId]/(tabs)/sources.tsx
apps/mobile/app/sessions/[sessionId]/(tabs)/results.tsx
apps/mobile/app/sessions/[sessionId]/(tabs)/timeline.tsx
apps/mobile/app/sessions/[sessionId]/planning/[planId].tsx
apps/mobile/app/sessions/[sessionId]/sources/[sourceId].tsx
apps/mobile/app/sessions/[sessionId]/reports/driver.tsx
apps/mobile/app/sessions/[sessionId]/driver/index.tsx
apps/mobile/app/sessions/[sessionId]/reports/review.tsx
apps/mobile/app/sessions/[sessionId]/community/new.tsx
apps/mobile/app/sessions/[sessionId]/community/reports.tsx
apps/mobile/app/sessions/[sessionId]/community/points.tsx
apps/mobile/app/sessions/[sessionId]/community/campaigns/{index.tsx,[campaignId].tsx}
apps/mobile/app/sessions/[sessionId]/community/missions/[missionId].tsx
apps/mobile/app/sessions/[sessionId]/community/{leaderboard,benefits}.tsx
apps/mobile/app/sessions/[sessionId]/campaigns/manage.tsx
apps/mobile/src/features/{session,scenario,operations-map,incidents,planning,reports,knowledge,sources,rewards,simulation,results,evidence-log}/
apps/mobile/src/features/reports/data/{offline-draft-store.ts,offline-draft-sync.ts}
packages/icons/package.json
packages/icons/src/assets/isometric/{*.svg,asset-manifest.json}
packages/icons/src/web/index.ts
packages/icons/src/native/index.tsx
packages/api-client/src/client.ts
packages/api-client/src/streams/{web,native}.ts
packages/ui-web/src/{components,features}/
packages/ui-native/src/{components,features}/
```

Feature route components call only `packages/api-client` and server-authorized `/api/v1` contracts; feature code cannot perform local safety decisions that replace gate responses. Web/native component packages remain separate. Keep session/capability/token material out of public URL, logs, screenshots and error messages.

## Acceptance scenarios / automated and manual tests

Create `apps/web/test/e2e/feature-surfaces.spec.ts`, `apps/mobile/test/e2e/feature-surfaces.e2e.ts`, `apps/mobile/test/offline/report-drafts.test.ts`, `packages/domain/test/` (parent-owned domain tests), and `packages/contracts/test/api-error-contract.test.ts` (parent-owned contract tests). Use the same fixture/event sequence where possible; assert server revision and state in addition to visible copy.

| Scenario | Web + mobile acceptance |
|---|---|
| T01: reset → combined incident → plan → required approval → Execute → H | Both show derived impact/priority, projected before Execute, approved status distinct from executed, then same raw baseline/FloodOps metrics and simulation time. |
| T02: proposal and community report say E17 open while authoritative closure | Both show `BLOCKED` + POL-01/rule ID; no Approve path bypasses closure; no committed route enters E17. |
| T03: E27 accepted motorbike observation, car route | Both show motorbike coverage only; car remains unknown/approval-gated or blocked if hard rule says impassable. |
| T04: approve then advance through evidence expiry then Execute | Old approval/proposal becomes stale; Execute rejected, no partial commit, replan required. |
| T05: capacity overflow / P1 hub change on picked-up order | Candidate batch fails atomically; picked-up assignment stays with carrying driver; action disabled/blocked with reason. |
| T06: pending/rejected dependency plus independent eligible group | Only eligible independent group can commit if whole candidate passes; dependent group remains pending/waiting, ETA null; no projected ETA presented as committed. |
| T07: fresh report fills active gap, same photo retry/another contributor, redundant/expired report | One valid award at most, exact gap/scope shown; duplicates/redundant get reason and zero; expiry never revokes earned ledger. |
| T08/T11: rain-only, tide-only, combined; tide datum missing/different | Context with units/datum/observed-vs-forecast labels; no road auto-open/close or inferred street depth. |
| T09: model timeout/invalid IDs/injection text/stale response after Reset | Committed state and accepted observation remain; invalid proposal is rejected; no action from injection or old response. |
| T10/US-23: Reset twice with same seed/events/H | New session generation each time, same deterministic initial/baseline values; no old report/points/capability leaks into new run. |
| T12: conflicting accepted observations, review supersedes one, remaining low confidence | Conflict blocks route until review; after resolution a low-confidence route still needs approval; point award only once if it fills gap. |
| T13: closure/expiry before next edge entry | No new entry through blocked edge; timeline distinguishes vehicle already on edge from a new attempt. |
| T14: calibration evidence and playback speed | Same graph distance, travel/service time, capacity and results across playback speeds; absent source/error bounds show `Calibration incomplete`, never claim pass. |
| T15: execute initial plan → accept fresh motorbike report on E27 → replan → approve if needed → execute | Diff explains report evidence and changed ETA; no pre-Execute operation mutation; car does not inherit bike evidence; proposal/approval bound to revision. |
| T16: DataRequest origin and campaign lifecycle | Dispatcher gửi request đúng quyền/scope/version từ data thiếu; cả hai client không publish mission thiếu valid/current classification/config, không auto-open từ gap/expiry hoặc chốt campaign sớm. |
| T17: Deterministic mission S-F and policy version | Code grade/rationale/rule IDs/input-policy binding trước board; missing config/changed request-policy/invalid/stale/Reset không default/client grade. Pin policy/draft refresh, no hazard bonus; AI outage không gate classifier. |
| T18: ReviewResult before reward, duplicate/race/reordered review | Raw upload/AI không cấp award; result authenticated/current/bind đúng và replay-safe trước RewardEngine. Slot/budget/completion/award/rank atomic, earlier pending/incomplete upload đúng rule, technical failure không half-commit/fake zero. |
| T19: region/campaign ranking and privacy | Committed awards đúng scope, shared ties/own rank, alias-only projection; không xem ảnh/report người khác hoặc dispatcher ledger. |
| T20: full contributor loop and offline/cross-device | DataRequest -> policy classification -> board -> photo/info -> dispatcher ReviewResult -> RewardEngine -> feedback cùng outcome; Simulated benefit/budget/tie/exactly-once/expiry/Reset đúng và không auto-send/award offline. |
| Cross-device report → review → feedback | Pair native contributor and web dispatcher to the same session with distinct scoped capabilities. Native submits E27 photo/fixture; web sees pending (no knowledge/award yet). Web reviews; native own reports/points show the server decision and at most one eligible award. Repeat transport delivery without a second business effect; driver sees only own dashboard. |
| Cross-device native dispatcher → web/driver | Pair a native dispatcher with legitimately issued dispatcher capability. Create/review/approve as needed and Execute on native; authorized web dispatcher and native driver observe the same committed revision/outcome via stream or refetch. Proposals never appear as new driver assignments before Execute; no fabricated instant-delivery SLA. |
| Cross-device stale command / Reset | Keep an old proposal or draft on another client, mutate/Reset the session from web/native, then attempt the old action. Server rejects stale/revoked authority without duplicate commit; client requires refresh/rejoin, retains only explicitly reviewed report drafts and never replays an operational command. |
| Mobile offline draft | Turn off network; create driver text report and community photo draft; app restart retains only draft + image. Reconnect does not auto-send; explicit Send posts once and shows `Pending review`. No offline Approve/Reject/Execute/Reset/Advance request is queued or emitted. |
| Mobile stale draft | Save draft under session A, Reset/rejoin session B while offline; reconnect marks draft stale and does not send. Explicit review/relink is required; old plan/approval/session commands are absent from storage/outbox. |
| Authorization parity | Alter role selector/body/route/local storage or deep-link a dispatcher route with driver-only capability; server rejects unauthorized command and both UIs render no privileged action. |
| Accessibility | Keyboard-only web plan flow and report form, 320 px reflow, map list alternative, screen reader labels/status/error announcements; VoiceOver and TalkBack traverse native dispatcher and report screens. |

## Non-goals

No continuous/live driver location, real external source adapters, customer messaging app, real payouts, consumer accounts, general account SaaS, production anti-fraud claims, or native use of web shadcn/Radix. These are outside the PRD demo and shared planning contract.

AM-C01 thêm thiết kế catalog voucher/gift và entitlement mô phỏng; tài trợ/giá trị/fulfillment thật vẫn TBD. Không xem source/grade/reward proposal hoặc sự hiện diện của route target là contract/API đã được triển khai.
