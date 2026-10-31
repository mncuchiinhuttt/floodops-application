# Chiến lược kiểm thử toàn ứng dụng

## Nguyên tắc
- AM-C01 thêm US-35..US-38/T16..T20 theo [contributor campaigns](contributor-campaigns.md), tổng 38 US. Các tests dưới đây là kế hoạch; phần mới phải chờ same-version contracts/producers/web/native cutover, không dùng mock DTO hoặc report baseline 34 US/64 operations để claim pass.
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
| API integration | `apps/api/test/{capabilities,commands,media,replay,reset}.test.ts`; `bun run test:api` | actual Hono+DO/R2 transactions/permissions/idempotency, storage restart |
| Web components | `apps/web/src/features/**/tests/*.test.tsx`; `bun run test:web` | loading/validation/412/410/disabled commands, projected vs committed |
| Native components | `apps/mobile/src/features/**/tests/*.test.tsx`; `bun run test:mobile` | native roles/labels, offline draft persistence, secure-store rejoin |
| Web E2E | `apps/web/test/e2e/*.spec.ts`; `bun run test:e2e:web` | built SPA + actual local Worker using deterministic provider adapter |
| Native E2E | `apps/mobile/.maestro/*.yaml`; `bun run test:e2e:mobile` | installed iOS/Android dev build against local/preview API; photo permissions/capture/reconnect |
| Cross-client | `tests/cross-platform/session-sync.spec.ts`; `bun run test:cross-client` | web review→native plan status/revision; native report→web gap/reward; two dispatchers CAS |
| Security | `apps/api/test/security/*.test.ts`; `bun run test:security` | role/resource isolation, CSRF, stale/reset, upload bombs, provider budget/injection |
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
| T16 | Campaign lifecycle/capability/config/window; no publish missing policy/budget; closing resolves timely pending before final rank | campaign/domain/API/clients |
| T17 | Seven mission grades S-A-B-C-D-E-F/reason/version; server-only grade/points; pinned policy at report receipt, changed offline draft refresh | contract/domain/API/web/native |
| T18 | collect first-fill vs independent verify vs new update occurrence; no duplicate award/slot/budget/rank under retries/races/reordered review; earlier pending blocks later last slot | rewards/DO/media/cross-client |
| T19 | Region/campaign committed leaderboard, shared ties and own position; alias projection cannot expose other report/photo/identity or dispatcher ledger | projection/security/clients |
| T20 | Simulated catalog/eligibility/entitlement budget/tie/exactly-once; review close/expiry/Reset and offline/cross-client consistency | rewards/campaign/DO/web/native |

AM-C01 thêm focused suites dưới ownership được Lead xác nhận: `packages/domain/src/rewards/tests/{campaigns,missions,leaderboard,benefits}.test.ts`, `apps/api/test/rewards/campaigns.test.ts` và contributor surface tests của phase 09/10. Đây là future paths, không phải file/test đã có; không tự cấp quyền writer từ bảng.

## High-risk expanded tests
- Revision: Accept report invalidates every unexecuted proposal/approval, reject/audit no-op does not. Replan same revision supersedes prior plan by active ID, not just revision equality.
- Execute: read pause then closure arrives, stale CAS rejected. Two distinct keys same revision one wins; same key repeated one execution. Independent groups cannot accumulate overload across batches.
- Restriction: authority reopening must explicitly reference active closure and valid profile; provider-name spoof doesn't grant closure role. Conflict review never supersedes restriction.
- Clock: now=expires exactly not current. Capture future/old/timezone/DST conversion; playback paused/foreground/background does not rewrite physical duration.
- Media: MIME lie/truncated/decompression dimensions/>5MiB/no Content-Length/duplicate normalized pixels/path traversal/cross-session ID/private raw R2 access denied; normalized EXIF absent.
- Source: coarse rain/GloFAS/marine context doesn't create E17 closed or normal. Snapshot malformed references/unknown turn/vehicle class fails loader.
- Rewards: accept-conflict then resolve transition atomic with gap+award; crash after commit before response; retry same key; same hash another contributor; expiry opens new occurrence but old report never gets second award.
- AM-C01 capacity: hai reviewer xử lý cùng submission; hai participant tranh slot cuối; duyệt report tới sau trước report tới trước; reject earlier report; upload chưa complete; review deadline overdue. Slot theo stable receipt sequence của submissions cuối cùng đủ điều kiện, không review click hoặc arrival claim; pending budget/rank không finalized trước policy resolution.
- AM-C01 policy: grade override có reason/actor/version; client sửa grade/points/policy ID bị từ chối; report đã nhận giữ reward snapshot, draft không giữ giá cũ. Missing thresholds/manual classification policy, points/capacity/budget/review timeout policy thì publish bị chặn.
- AM-C01 eligibility: verify evidence độc lập có nhu cầu/slot có thể award dù filled_gap_ids rỗng; ảnh thứ hai/cùng kết luận chưa đủ. Collect-gap unique và participant/mission completion unique kiểm riêng; không tạo gap hoặc region/campaign link giả để farm nhiều award.
- AM-C01 projections/benefits: pending vs committed, rank shared-tie/stable display, region filter, alias-only data; không lộ private report/photo/participant location. Entitlement unique, không vượt published tie/budget/inventory, không gọi provider/payout; expiry giữ award, Reset không lẫn ledger/mission/session cũ.
- Reset saga: crash before/after new DO init and before tombstone, resume same key one replacement. Old in-flight LLM/report/upload cannot affect new generation; revoke stream event only metadata.
- Reset headers-only: browser nhận replacement cookie rồi mất body; retry old route bằng recorded replacement credential+same key/digest/CSRF/Origin phục hồi cùng replacement. Pre-header loss cũng pass; wrong key/participant/Origin denied.
- Same-revision supersession: Approve/Ready A at r→request B at r→new-key Execute/Dry-run A must STALE_PROPOSAL zero writes; exact committed old execution retry still returns original.
- Advance crash: terminate after checkpoint, reactivate past lease expiry marks failed/unlocks without clock change; new explicit advance reaches same H/log as uninterrupted, old lease late writes denied.
- E-HUB-01: route tool với candidate pickup override thực sự qua hub mới; positive tool→gate→Execute→movement→both clients và negative custody/stock/capacity/old-hub route cases.
- Offline: persist drafts only. Restart offline; no approve/execute/advance request emitted. Reconnect requires refreshed current session and explicit send, no stale auto-relink.
- Native permission denied/cancel/photo unavailable handled without dropping draft; external URL linking never leaks capability; SecureStore failed read means rejoin not hardcoded role.

## Security validation plan
- Threat boundaries: public browser/native→Worker, Worker→DO, upload→Images/R2, external text→LLM, model→tools→gate, stage/preview→prod.
- Anonymous session creation quota/IP + session budget. Token entropy/digest/redaction, no query bearer tokens, CSRF cookie mutation, strict Origin, object ownership, driver/contributor projection, expired/revoked caps, iframe/CSP/nosniff.
- Unauthorized commands must leave domain state/revision/awards unchanged. Logs and error bodies contain no credentials, raw image or provider stack.
- Load/security tests authorized preview only; production pentest/account writes need separate approval. Do not claim DDoS protection from app limits.
- [Root agent policy](../../../AGENTS.md) và [injection threat/scenario corpus](../worktree-execution/prompt-injection-policy.md):18 hostile+4 benign cases để controlled agent/model/tool-boundary eval. Verify unauthorized effects, not keyword refusal alone; schema validation corpus không là evidence injection resistance. Dev-agent tool sandbox và runtime app gate cần kiểm riêng.

## Accessibility and visual
- All key web workflows keyboard-only + axe + VoiceOver Safari; iOS VoiceOver and Android TalkBack manual proof, increased font/reduced motion, accessible map list.
- Viewports 320, 768, 1280, 1568 CSS px; UI state per plan/report/gap/award/provenance, focus not hidden, table reflow.
- Semantic token contrast checks normal>=4.5, large/UI>=3; native touch areas>=44dp (48dp Android target). No color-only safety states.
- Visual regression baselines after functional pass, no re-pin failed incidental wording tests. Snapshot only meaningful layout states.

## Model/performance/release gates
- Model evaluation ten first proposals with frozen model/config/scenario. Timeout/refusal retained in denominator; >=8 valid proposals target, not stub evidence. K4 display end-to-end wall latency nearest-rank p95 over10=max; count failures.
- Record graph size/event count per test. Bound route/search/tool steps/session media. Frame/render profiling mobile physical device; map zoom/pan should not rerender all screen forms.
- Suggested coverage gate: domain policy transitions all branches, PRD acceptance all mapped; >=90% branch coverage for gate/reward reducers is secondary, not proof of correctness alone.
- CI PR: frozen install→typecheck/import boundaries→schema diff→lint→unit/API/components→web build/native export→web E2E. Native device lane dedicated runner/EAS build, don't pretend Linux validates iOS.
- Release: calibrated T14 evidence + all P0/P1/P2 enabled acceptance; five invariants; full cross-platform smoke; no secret; model access + quotas; reproducible reset; rollback drill; no optimistic complete when prerequisite missing.
- AM-C01 release gate thêm T16..T20/38 US, grade/reward/slot/budget/tie/review-window config, contract cutover và evidence web+iOS+Android. Sponsor/voucher/fulfillment thật chưa có thì chỉ công bố demo Simulated, không ghi đã phát thưởng thật.
- Future commands are **planned**, not executed checks in this planning session. Current validation only plan/OpenAPI artifacts.
