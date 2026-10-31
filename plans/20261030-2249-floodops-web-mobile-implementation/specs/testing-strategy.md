# Chiến lược kiểm thử toàn ứng dụng

Supplemental image-review behavior is specified by [ai-assisted-image-review.md](ai-assisted-image-review.md); it does not replace US/T coverage.

## Nguyên tắc
- AM-C01 thêm US-35..US-38/T16..T20 theo [contributor campaigns](contributor-campaigns.md); AM-C02 thêm US-40/US-41/T22..T24 theo [student volunteer demo](student-volunteer-demo.md). Tổng hiện hành 41 US (M1: 31; M2: 10), T01..T24 và IR-01..IR-12. Tests dưới đây là kế hoạch; phần mới phải chờ same-version contracts/fixtures/producers/web/native cutover, không dùng mock DTO hoặc report baseline 34 US/66 operations để claim pass.
- Test consumer-visible behavior, boundaries/invariants/transitions/precedence/errors. Không test copy wiring, prompt wording, không “không throw”/snapshot nguồn code thay hành vi.
- Vitest cho pure TS/domain và Workerd API integration; React Testing Library cho web, Jest + React Native Testing Library cho native, Playwright cho web E2E, Maestro cho iOS/Android build thật.
- Worker tests dùng official `@cloudflare/vitest-pool-workers`, local DO/R2 bindings thật. Model stub chỉ tại provider boundary cho deterministic suite, không mock `execute`/`award` rồi assert echo.
- Property-based tests bằng fast-check sau dependency scan; deterministic seed và minimized counterexample log. Không random flaky hoặc clock thật.
- Mỗi feature tự có tests, final gate chạy toàn bộ đúng một lần sau integration; real-model eval riêng có budget không chạy mỗi PR.

## Test levels và exact target files
| Level | Future files / command | Proof |
|---|---|---|
| Contract | `packages/contracts/test/openapi-contract.test.ts`; `bun run test:contracts` | OpenAPI structural validity, request/response examples, unknown props, schema/client drift |
| Domain | `packages/domain/src/**/tests/*.test.ts`; `bun run test:domain` | POL/I invariants, epochs/conflict, pickup/capacity, exactly-once reward |
| Simulator | `packages/simulation/src/**/tests/*.test.ts`; `bun run test:simulation` | event ordering, route direction/turns, baseline isolation, completion metrics/calibration |
| API integration | `apps/api/test/{capabilities,commands,media,replay,reset}.test.ts` and `apps/api/test/review/`; `bun run test:api` | actual Hono+DO/R2 transactions/permissions/idempotency, persisted review-job restart/deadline recovery |
| Web components | `apps/web/src/features/**/tests/*.test.tsx`; `bun run test:web` | loading/validation/412/410/disabled commands, projected vs committed |
| Native components | `apps/mobile/src/features/**/tests/*.test.tsx`; `bun run test:mobile` | native roles/labels, offline draft persistence, secure-store rejoin |
| Web E2E | `apps/web/test/e2e/*.spec.ts`; `bun run test:e2e:web` | built SPA + actual local Worker using deterministic provider adapter |
| Native E2E | `apps/mobile/.maestro/*.yaml`; `bun run test:e2e:mobile` | installed iOS/Android dev build against local/preview API; photo permissions/capture/reconnect |
| Cross-client | `tests/cross-platform/session-sync.spec.ts`; `bun run test:cross-client` | web review→native plan status/revision; native report→web review/gap/reward; same-revision image-review event refetch; two dispatchers CAS |
| Security | `apps/api/test/security/*.test.ts`; `bun run test:security` | role/resource isolation, CSRF, stale/reset, upload bombs, provider budget/injection and image-review binding/privacy |
| Performance | `tests/performance/scenario-bounds.test.ts`; `bun run test:performance` | bounded event/graph work, cancellation, stream limits, client geometry rendering |
| Deploy smoke | `tests/smoke/deployed-session.spec.ts`; `bun run smoke:preview` | HTTPS API/deep links/create/join/upload/report/review/plan/approve/execute/reset/expiry |

## T01..T24 acceptance matrix

Milestone binding follows PRD 8.5: M1 core web/IR and honest T14 assumption/provenance checks; T16..T20 campaign/native, T21 forecast and T22..T24 student are M2 extension gates; independent T14 calibration claims are M3. Legacy Commander/model-proposal wording in untouched linked specs is superseded by deterministic planner/rules, pending same-version cutover.

| Test | Observable assertions | Suites |
|---|---|---|
| T01 | combined incident affects computed IDs; proposal no operation mutation; approved Execute then advance H; compare raw metrics | runner/API/web/native |
| T02 | confirmed E17 closure + report open stays blocked; no new entry; reason POL-01 | domain/property/API/UI |
| T03 | bike report affects bike coverage only; car unknown soft gate, hard impassable block | knowledge/routing/clients |
| T04 | approve at r, advance through TTL, Execute old r→412/needs_replan; zero partial commit | DO concurrency/E2E |
| T05 | total batch load overflow / picked_up hub change fails; no half swap | gate/property/DO |
| T06 | dependent pending group excluded, independent group executes when full candidate valid; waiting ETA null | gate/API/clients |
| T07 | same fresh photo/review retry/other contributor yields one award; redundant/expired zero; correct gap IDs | rewards/DO/media/E2E |
| T08 | rain/tide context not edge passability; measurements correct units/datum/source/time | ingestion/API/clients |
| T09 | model timeout/refusal/bad ID/injection/stale response after reset; keep accepted observations and prior ops | provider/controller/security/E2E |
| T10 | reset same frozen scenario twice same deterministic results; IDs differ, old caps/ledger don't carry | runner/DO/clients |
| T11 | tide-only independent rain; unknown/different datum cannot produce fake street depth | ingestion/schema/domain |
| T12 | contradictory accepted obs block new route; review supersedes exact evidence, low still needs approval, one award | knowledge/review/DO/clients |
| T13 | evidence expiry/closure before next edge prevents entry; existing on-edge event logged correctly | movement/property/runner |
| T14 | independent calibrated sample satisfies chosen tolerance; speed changes no deterministic outcomes; missing source=>incomplete | calibration/runner/map scale |
| T15 | accepted E27 bike report causes ETA diff traced to report; no effect before Execute; car unchanged | runner/API/cross-client |
| T16 | Dispatcher missing data -> authenticated DataRequest scope/version; no publish without current valid classification/config; gap/expiry only draft request; campaign lifecycle/window guards | campaign/domain/API/clients |
| T17 | Deterministic S-F/rationale/rule IDs/input-policy binding; missing rules/threshold/config, changed request-policy, invalid/stale/Reset cannot default/client/manual bypass or publish; pin/draft refresh preserved; photo/forecast outage does not gate classifier | classification/contract/API/web/native |
| T18 | Current authenticated ReviewResult required before reward; forged/stale/replayed result cannot mint effect; collect/verify/update, review reordering, slots/budget/rank atomic, no technical half-commit/fake zero | review/reward/DO/cross-client |
| T19 | Region/campaign committed leaderboard, shared ties and own position; alias projection cannot expose other report/photo/identity or dispatcher ledger | projection/security/clients |
| T20 | DataRequest -> policy classification -> board -> photo/info -> dispatcher ReviewResult -> RewardEngine -> feedback across web/native, with Simulated benefits/ties/budget/exactly-once/expiry/Reset/offline consistency | full contributor loop/DO/web/native |
| T21 | Gated US-39 forecast: history/data gates and temporal holdout/leakage; target/location/unit/horizon, uncertainty/as-of, model-data versions, stale/reorder/Reset/horizon expiry; compare persistence baseline with declared metrics/thresholds. Missing data/model unavailable, never publish/reward/road authority/Execute | M2 forecast/domain/API/client quality evidence; M3 independent claims |
| T22 | Three fictional campus profiles with fixed +2/+3/+5 and campaign/period caps 4/6,6/9,10/15; server-bound enrollment/allowed campaigns; student publish without general bounty/voucher/school approval; normal mode unchanged | fixture/contract/domain/API/web/native |
| T23 | 119/120/240-minute canonical attendance + accepted quality report in either arrival order; reject/pending/invalid/duplicate/redundant evidence, activity/report reuse, overlap, version retry, campaign/period caps across campaigns and concurrency | recognition/domain/DO/idempotency |
| T24 | M2 student loop/labels/privacy/alias same-profile-period rank/no double award; observation expiry after accepted review retains earned credit within run; Reset or session expiry clears runtime enrollment/ledger/counters/rank and fences old generation; offline cannot replay evidence | web/native/cross-client/security |

AM-C01 thêm focused suites dưới ownership được Lead xác nhận: `packages/domain/src/rewards/tests/{campaigns,missions,leaderboard,benefits}.test.ts`, `apps/api/test/rewards/campaigns.test.ts` và contributor surface tests của phase 09/10. Đây là future paths, không phải file/test đã có; không tự cấp quyền writer từ bảng.

AM-C02 bổ sung focused recognition/fixture suites sau M2 contract cutover: phase03 enrollment/profile/kỳ/nonoverlap attendance; phase07 pure eligibility/caps/reducer + actual DO races; phase09/10 statuses/ranking. Không model gate cho classification/attendance. Model quality evidence riêng cho US-30 photo và gated US-39 forecast theo grant, không thay bằng fixture.

## IR-01–IR-12 advisory image-review acceptance
| ID | Planned observable case | Evidence boundary |
|---|---|---|
| IR-01 | All 81 rubric rating vectors derive `quality_score` by floor-half-up, 0–100; tri-state match/recommendation precedence is exact; model/client derived or authority fields are rejected. Provider schema is self-contained with local refs resolved/no network refs, submits only `ImageReviewModelOutput`, and the server revalidates full bounded output without relaxing app validation. | Pure deterministic oracle; not vision evaluation |
| IR-02 | Valid completed advice appears on web/native with score, four ratings, match, explanation and advisory label; report stays pending and operational revision/knowledge/award/route stay unchanged. | UI/API/DO deterministic integration |
| IR-03 | Score 100 with match `no` or `unclear` yields the specified manual/insufficient recommendation; no auto Reject, safety probability or threshold authority. | Server-derived rules + UI |
| IR-04 | Timeout/refusal/malformed/unsupported/no-credit output gives typed failed/unavailable state and `result=null`; no zero/canned score, manual decision remains usable. | Stub tests for failure behavior; real provider evidence separate |
| IR-05 | Same idempotency replay and new-key same-current-input queued/running/completed reuse one reservation/call; failed retry is explicit with a new key and consumes budget; no background retry. | API/DO idempotency and provider-call counter |
| IR-06 | Contributor/driver/wrong-session, unready media and raw-URL requests are rejected before provider; quotas/concurrency/deadline hold and no image/advice leak. | API security + actual media/DO boundaries |
| IR-07 | Human Accept/Reject racing a running model call commits only the human decision; late advice is superseded and cannot rollback or duplicate an award. | DO race/reward integration |
| IR-08 | Reset/expiry/context/model/rubric changes, crash and lease expiry fence old output and release slots; unrelated operational revision alone does not rerun or stale an unchanged binding. Completed current advice remains readable after provider deadline; only queued/running overdue jobs timeout. | DO recovery + cache/event semantics |
| IR-09 | OCR/caption injection and forbidden output fields (`confidence`, condition, points, accept/execute) produce no unauthorized effect; genuine content remains manually reviewable. | Adversarial provider-boundary tests; not keyword refusal alone |
| IR-10 | Duplicate hash/invalid media/location/time remains deterministic failure/reason; a high score cannot override closure, duplicate checks or vehicle scope. | Media/review/domain invariant tests |
| IR-11 | Native request is explicit-online only; pending/error does not block form/manual review; restart/refetch uses current binding, no offline command outbox, dispatcher-only event projection. | Native/cross-client/security E2E |
| IR-12 | Permitted human-labelled clear/dark/blur/occluded/mismatch/unclear/injection images are evaluated with sample IDs and model/prompt/config hashes; report rating/match agreement and forbidden-claim count. | Real image/model evaluation only; stubs and calibration data cannot claim vision quality |


## High-risk expanded tests
- AM-C02 eligibility: 119 phút + valid report chưa cộng; 120 đủ thì +2/+3/+5; một activity240 phút/nhiều ảnh vẫn một grant. Test ReviewResult trước attendance và ngược lại; pending/reject/invalid/duplicate không qualify, accepted quality nhưng redundant về normal first-gap/slots có thể qualify. AI score100 không thay human result, score thấp không tự reject hoặc loại recognition.
- AM-C02 ledger/caps: unique enrollment/activity/generation không gồm policy version, report không reuse khác activity/campaign, fixture interval không overlap/doublecount. Concurrent grants trong hai campaign cùng trần kỳ phải atomic; A1/A2 chạm campaign cap, A3+0, B1 chạm period cap, B2+0. API failure giữa grant/counter/event không half-commit/fake0, replay không nhân điểm; capped vẫn accepted với reason.
- AM-C02 trust/mode: tamper profile/kỳ/enrollment/mode/minutes/body, tạo enrollment lại hoặc dùng fixture/report cũ bị từ chối. Chỉ trusted scenario fixture xác nhận 120 phút, không app/GPS/wallclock, simulation clock/physics/D04 không đổi; student publish không phụ thuộc bounty table/sponsor/school approval. No student normal bounty/rank/voucher double grant.
- AM-C02 surface/lifecycle: pending_review/pending_participation/recognized_demo/ineligible/capped; same-profile/kỳ alias ranking and persistent no-school-recognition label. No real PII/SSO/logo/certificate/cross-school raw score comparison. Observation expiry after valid review preserves credit within run; Reset or session expiry clears runtime enrollment/ledger/counters/rank, fences generation; cross-device/offline cannot reuse old evidence.
- AM-C01 capacity: hai reviewer xử lý cùng submission; hai participant tranh slot cuối; duyệt report tới sau trước report tới trước; reject earlier report; upload chưa complete; review deadline overdue. Slot theo stable receipt sequence của submissions cuối cùng đủ điều kiện, không review click hoặc arrival claim; pending budget/rank không finalized trước policy resolution.
- AM-C01 classification: code dùng bound DataRequest/trusted context/versioned rules, enum S-F/rationale/rule IDs/input-policy hashes được validate. Missing rules/threshold/config/changed request-policy/Reset giữ draft/recompute; không AI/default/client/manual bypass. Photo/forecast unavailable không chặn classifier; private context không ra board.
- AM-C01 reward handoff: raw upload/policy grade/vision quality không evaluate hoặc mint award. DispatcherReviewService tạo result từ authenticated manual decision/checks; RewardEngine nhận latest result của report và đúng pinned versions, evaluate rồi commit nguyên tử. Superseded/forged/replayed result, failure giữa result và award, pending/ineligible/no-slot không được biến thành duplicate/partial commit/fake zero. Request mới không tự hủy report đã nhận đúng version cũ.
- AM-C01 eligibility: verify evidence độc lập có nhu cầu/slot có thể award dù filled_gap_ids rỗng; ảnh thứ hai/cùng kết luận chưa đủ. Collect-gap unique và participant/mission completion unique kiểm riêng; không tạo gap hoặc region/campaign link giả để farm nhiều award.
- AM-C01 projections/benefits: pending vs committed, rank shared-tie/stable display, region filter, alias-only data; không lộ private report/photo/participant location. Entitlement unique, không vượt published tie/budget/inventory, không gọi provider/payout; expiry giữ award, Reset không lẫn ledger/mission/session cũ.
- Revision: Accept report invalidates every unexecuted proposal/approval, reject/audit no-op does not. Replan same revision supersedes prior plan by active ID, not just revision equality.
- Execute: read pause then closure arrives, stale CAS rejected. Two distinct keys same revision one wins; same key repeated one execution. Independent groups cannot accumulate overload across batches.
- Restriction: authority reopening must explicitly reference active closure and valid profile; provider-name spoof doesn't grant closure role. Conflict review never supersedes restriction.
- Clock: now=expires exactly not current. Capture future/old/timezone/DST conversion; playback paused/foreground/background does not rewrite physical duration.
- Media: MIME lie/truncated/decompression dimensions/>5MiB/no Content-Length/duplicate normalized pixels/path traversal/cross-session ID/private raw R2 access denied; normalized EXIF absent.
- Source: coarse rain/GloFAS/marine context doesn't create E17 closed or normal. Snapshot malformed references/unknown turn/vehicle class fails loader.
- Rewards: accept-conflict then resolve transition atomic with gap+award; crash after commit before response; retry same key; same hash another contributor; expiry opens new occurrence but old report never gets second award.
- Reset saga: crash before/after new DO init and before tombstone, resume same key one replacement. Old in-flight planning/image-review/report/upload completion cannot affect new generation; review job late response is superseded, stream event only metadata.
- Reset headers-only: browser nhận replacement cookie rồi mất body; retry old route bằng recorded replacement credential+same key/digest/CSRF/Origin phục hồi cùng replacement. Pre-header loss cũng pass; wrong key/participant/Origin denied.
- Same-revision supersession: Approve/Ready A at r→request B at r→new-key Execute/Dry-run A must STALE_PROPOSAL zero writes; exact committed old execution retry still returns original.
- Advance crash: terminate after checkpoint, reactivate past lease expiry marks failed/unlocks without clock change; new explicit advance reaches same H/log as uninterrupted, old lease late writes denied.
- E-HUB-01: route tool với candidate pickup override thực sự qua hub mới; positive tool→gate→Execute→movement→both clients và negative custody/stock/capacity/old-hub route cases.
- Offline: persist drafts only. Restart offline; no approve/execute/advance request emitted. Reconnect requires refreshed current session and explicit send, no stale auto-relink.
- Native permission denied/cancel/photo unavailable handled without dropping draft; external URL linking never leaks capability; SecureStore failed read means rejoin not hardcoded role.

## Security validation plan
- Threat boundaries: public browser/native→Worker, Worker→DO, upload→Images/R2, external text→LLM, model→tools→gate, stage/preview→prod.
- Anonymous session creation quota/IP + session budget. Token entropy/digest/redaction, no query bearer tokens, CSRF cookie mutation, strict Origin, object ownership, driver/contributor projection, expired/revoked caps, iframe/CSP/nosniff.
- Unauthorized commands leave domain state/revision/awards unchanged. Logs and error bodies contain no credentials, raw image/advice or provider stack; verify explicit image consent/account retention evidence before live model use and do not claim zero retention absent proof.
- Load/security tests authorized preview only; production pentest/account writes need separate approval. Do not claim DDoS protection from app limits.
- [Root agent policy](../../../AGENTS.md) và [injection threat/scenario corpus](../worktree-execution/prompt-injection-policy.md):18 hostile+4 benign cases để controlled agent/model/tool-boundary eval. Verify unauthorized effects, not keyword refusal alone; schema validation corpus không là evidence injection resistance. Dev-agent tool sandbox và runtime app gate cần kiểm riêng.

## Accessibility and visual
- All key web workflows keyboard-only + axe + VoiceOver Safari; iOS VoiceOver and Android TalkBack manual proof, increased font/reduced motion, accessible map list.
- Viewports 320, 768, 1280, 1568 CSS px; UI state per plan/report/gap/award/provenance, focus not hidden, table reflow.
- Semantic token contrast checks normal>=4.5, large/UI>=3; native touch areas>=44dp (48dp Android target). No color-only safety states.
- Visual regression baselines after functional pass, no re-pin failed incidental wording tests. Snapshot only meaningful layout states.

## Model/performance/release gates
- AI evaluation: permitted real photo/model outputs with human-labelled rubric/match agreement and failures (US-30/IR); gated forecast uses temporal holdout/persistence baseline/metrics by horizon (US-39/T21). Planning and S-F classification are deterministic; no model-proposal evaluation. K4 reports actual end-to-end wall latency and all failures/unavailable results, not cherry-picked retries.
- Deterministic workflow/K4 rehearsal records ten runs with frozen inputs/config, end-to-end wall latency and all failures/unavailable results; it does not evaluate model planning. Photo quality uses permitted human-labelled samples with sample/model/prompt/config hashes, valid/failure counts, rubric/match agreement and forbidden-claim count, retaining refused/timeout cases. Gated forecast quality uses separate US-39/T21 temporal-holdout evidence; D04 calibration remains separate. Stubs prove only deterministic validation/plumbing.
- Record graph size/event count per test. Bound route/search/tool steps/session media. Frame/render profiling mobile physical device; map zoom/pan should not rerender all screen forms.
- Suggested coverage gate: domain policy transitions all branches, PRD acceptance all mapped; >=90% branch coverage for gate/reward reducers is secondary, not proof of correctness alone.
- CI PR: frozen install→typecheck/import boundaries→schema diff→lint→unit/API/components→web build/native export→web E2E. Native device lane dedicated runner/EAS build, don't pretend Linux validates iOS.
- Milestone release evidence: M1 enabled core/web/IR + five invariants/privacy/stale/error/Reset and disclosed assumptions; M2 each enabled extension/config/contract/client gate including actual native evidence; M3 independent T14 calibration. No secret or optimistic completion; missing prerequisite reported per affected feature.
- Gates theo milestone: roadmap 41 US/T01..T24/IR; M1 31-US web core/IR applicable không đòi campaign/native/forecast. M2 10 extension US sau mode/config/contract cutover, gồm web+iOS+Android parity, T16..T20 campaign/T21 forecast/T22..T24 student. M3 independent calibration/pilot. Student dùng fixed profiles/attendance/ledger/caps, không school/sponsor prerequisite hoặc công nhận/quà thật.
- Future commands are **planned**, not executed checks in this planning session. Current validation only plan/OpenAPI artifacts.
