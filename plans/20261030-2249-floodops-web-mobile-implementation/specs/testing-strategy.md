# Chiến lược kiểm thử toàn ứng dụng

Supplemental image-review behavior is specified by [ai-assisted-image-review.md](ai-assisted-image-review.md); it does not replace US/T coverage.

## Nguyên tắc
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

## T01–T15 acceptance matrix
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
- Model evaluation ten first proposals with frozen model/config/scenario. Timeout/refusal retained in denominator; >=8 valid proposals target, not stub evidence. K4 display end-to-end wall latency nearest-rank p95 over10=max; count failures.
- Image-review real-image/model evaluation is separate from the ten-run planning/K4 trial and D04 calibration: retain failed/refused/timeout cases, use permitted human-labelled samples and report sample/model/prompt/config hashes, valid/failure counts, rubric/match agreement, and forbidden-claim count. Stubs prove only deterministic validation/plumbing.
- Record graph size/event count per test. Bound route/search/tool steps/session media. Frame/render profiling mobile physical device; map zoom/pan should not rerender all screen forms.
- Suggested coverage gate: domain policy transitions all branches, PRD acceptance all mapped; >=90% branch coverage for gate/reward reducers is secondary, not proof of correctness alone.
- CI PR: frozen install→typecheck/import boundaries→schema diff→lint→unit/API/components→web build/native export→web E2E. Native device lane dedicated runner/EAS build, don't pretend Linux validates iOS.
- Release: calibrated T14 evidence + all P0/P1/P2 enabled acceptance; five invariants; full cross-platform smoke; no secret; model access + quotas; reproducible reset; rollback drill; no optimistic complete when prerequisite missing.
- Future commands are **planned**, not executed checks in this planning session. Current validation only plan/OpenAPI artifacts.
