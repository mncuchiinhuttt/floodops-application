# Phase 10 — Expo native dispatcher, driver và contributor

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [web-mobile-feature-surfaces.md](specs/web-mobile-feature-surfaces.md) · [design-system.md](specs/design-system.md) · [api-conventions-security.md](specs/api-conventions-security.md) · [concurrency-realtime.md](specs/concurrency-realtime.md) · [ai-assisted-image-review.md](specs/ai-assisted-image-review.md)

## Overview
- AM-M01 integration: toàn phase native là extension M2; M1 web core không cần iOS/Android. Student US-40/US-41/T22..T24 là M2 sau deterministic classification và mode-specific contract cutover; forecast US-39/T21 là extension độc lập, không chặn student.
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Phase 02, Phase 03, Phase 04, Phase 05, Phase 06, Phase 07, Phase 08. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [ExpoMobile](worktree-execution/roles/10-expo-mobile.md). Own app native trừ release subtree; EAS/package manifests central và ui-native thuộc DesignSystem theo [ownership](worktree-execution/ownership.md).

## Key insights
- Canonical contract và domain behavior có trước UI; chưa có application code trong repo hiện tại.
- Scope hoàn chỉnh bao gồm error/authorization/stale/offline behavior; không kết thúc ở scaffold hoặc mock data numbers.
- D04/credentials/asset licences là external prerequisites có [register](specs/decisions-prerequisites.md), không dùng giả định để claim complete.

## Requirements
- Functional: thực hiện toàn bộ bước/acceptance bên dưới theo mapping US ở coverage.
- Nonfunctional: feature-based imports, strict types, module <200 lines, portable domain logic, no secret in public bundle.

## Architecture
- [Feature-based layering](specs/architecture.md) là chuẩn. Shared schema/domain/data authority không fork cho web/native.
- Phase này không tự đổi API/role/revision contract; interface change phải sửa OpenAPI + client + tests trước consumers.

## Related code files
- Create/modify `apps/mobile/app/** (Expo Router thin navigation routes)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/mobile/src/{features,shared}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/mobile/{app.config.ts,eas.json,metro.config.js,package.json}` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/mobile/{test,.maestro}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Create Expo SDK-compatible RN app, Expo Router stacks/tabs including [sessionId], shared api-client/native fetch adapter and SecureStore credentials; no BrowserRouter/shadcn imports.
2. Implement full dispatcher mobile overview/map/impact/plans/approval/Execute/review/source/conflict/results/clock/reset, not reporting-only companion; Review detail shares the web advisory card using `quality_score`, `quality_ratings`, `report_match` (`yes/no/unclear`), `visible_summary`, `mismatch_notes`, `reasons` and separate manual Accept/Reject actions.
3. Use react-native-svg for calibrated map and @floodops/icons native entrypoint, accessible list alternative, native safe-area/large text and touch actions.
4. Driver workspace: own committed assignment/orders/stops/route/ETA + quick/text report and own report status, no accept/reject-job or turn-by-turn flow. Contributor AM-C01: campaign list/detail, mission S-F/detail, photo picker/manual location/vehicle/time có task link, own report/completion/reasons/points, regional alias leaderboard và prize/eligibility Simulated. Permission denial/cancel preserves input; no background GPS.
5. Offline app-private drafts/images only; persist with session/generation/capture metadata; explicit review/send after refresh; no offline approval/execution/clock/reset outbox and no image-review job queue.
6. Use expo/fetch SSE foreground with abort/reconnect/cursor; polling fallback same semantics; stale session drafts never auto-submit replacement; dispatcher-only `image_review_changed` refetches current job even at unchanged operational revision.
7. Configure dev/preview/prod API origins without API secret, universal/deep link invite fragment handshake, EAS update runtimeVersion guard and platform permissions copy.
8. Device E2E iOS+Android binary using actual backend; photo/draft restart/reconnect/Reset, unauthorized role and VoiceOver/TalkBack proof; Expo Go alone not binary-release evidence.

## Todo list
- [ ] Step 10.01: Create Expo SDK-compatible RN app, Expo Router stacks/tabs including [sessionId], shared api-client/native fetch adapter and SecureStore credentials
- [ ] Step 10.02: Implement full dispatcher mobile overview/map/impact/plans/approval/Execute/review/source/conflict/results/clock/reset, including advisory image-review card with separate manual actions.
- [ ] Step 10.03: Use react-native-svg for calibrated map and @floodops/icons native entrypoint, accessible list alternative, native safe-area/large text and touch actions.
- [ ] Step 10.04: Implement driver workspace và contributor campaign/mission S-F/report/completion/points/regional ranking/prize surfaces sau AM-C01 cutover
- [ ] Step 10.05: Offline app-private drafts/images only; never queue image-review jobs or operational commands.
- [ ] Step 10.06: Use expo/fetch SSE foreground with abort/reconnect/cursor and same-revision image-review refetch by event_sequence/current job binding
- [ ] Step 10.07: Configure dev/preview/prod API origins without API secret, universal/deep link invite fragment handshake, EAS update runtimeVersion guard and platform permissions copy.
- [ ] Step 10.08: Device E2E iOS+Android binary using actual backend

## AM-C02 - Native student demo parity
- Trong cùng native contributor app, thêm student campaign/activity/detail, own recognition ledger/counters và campus alias ranking sau [AM-C02 cutover](specs/student-volunteer-demo.md). Enrollment/profile/kỳ/allowed campaign server-bound; không tự nhập school/semester/MSSV/SSO, không role hoặc quyền Reset mới.
- Giữ dispatcher DataRequest -> policy S-F -> board -> photo/info -> manual ReviewResult; RewardEngine rẽ DemoRecognitionEngine dựa current result + trusted activity attendance fixture. UI tách review remarks, participation status, +2/+3/+5 flat grant/cap2 campaign/cap3 kỳ và pending_review/pending_participation/recognized_demo/ineligible/capped có reason.
- Nhãn luôn hiện “Điểm rèn luyện mô phỏng - không có giá trị công nhận của trường”, không logo/certificate/official approval hoặc so raw credits cross-school. Student mode không normal bounty/voucher kép, S-F multiplier hoặc chờ general bounty/sponsor/trường duyệt để publish; US-30 vision advice/manual fallback không đổi.
- Offline chỉ report draft; online refresh enrollment/mode/activity/policy/session trước explicit Send, không queue attendance/recognition/review. Attendance120 phút không timer chờ thật hoặc clock/physics change; T22..T24 exercise both clients, unique/caps/race/labels/privacy/Reset/expiry và normal mode unchanged.

## Success criteria
- Dispatcher can complete same plan/review/Execute/results flow as web; both show same revision and committed outcomes.
- No commands queued offline or old token applied after Reset. Image permission denial no data loss or auto location tracking.
- Native dev build installed on both platforms and relevant T01..T15 + offline/security paths observed.
- Native là một app với workspace theo capability, không ba app theo role và không Expo web/PWA/WebView. Thực hiện mobile dispatcher Execute → web/driver cùng committed outcome và mobile contributor report → web review → mobile feedback theo PRD §3.4.
- Image-review card presents `quality_score` as ordinal rubric points `0–100`, not calibrated probability, Observation confidence, authenticity or safe-road percentage; pending/error/stale jobs show no fabricated value, and manual review remains available without an AI result.
- AM-C01/T16..T20: campaign/mission S-F, policy/budget guards, pinned reward at receipt, alias regional rank và simulated benefit. Draft refresh trước Send, pending không tăng rank; Reset không giữ campaign/ledger/quyền cũ. Dùng projection mới sau contract cutover, không đọc `/awards` dispatcher-only. Giữ same-revision dispatcher-only AI card refetch/IR-01..IR-12; AI score không là reward points.
- Native M2 full loop: dispatcher DataRequest -> deterministic classification/status -> board S-F -> ảnh/thông tin -> optional photo advice -> manual ReviewResult -> reward/recognition -> feedback. Missing rules/config giữ draft, không grade mặc định; không optimistic points trước result hoặc queue manage/review commands offline. AI advice lỗi vẫn manual review, không cấp grade/reward.

## Risk assessment
- Scope drift / missing source: đọc PRD v0.5, coverage và prerequisite register trước phần phụ thuộc; không im lặng shrink.
- Race / platform difference: dùng same authoritative API and deterministic fixtures; no client-authorized safety decisions.

## Security considerations
- Enforce role/resource scope; input schema strict; external text/media/model output untrusted; secrets server-only.
- [Security test plan](specs/testing-strategy.md) áp dụng với every exposed feature; authorization failure không mutate state.

## Verification / evidence
- Run focused feature tests và smoke actual changed path sau integration phase; no pretend planned commands ran.
- Record commands, seed/config hash, pass/fail/unavailable and user-visible output; dùng [testing matrix](specs/testing-strategy.md).

## Next steps
- Mark phase complete chỉ khi acceptance có evidence; unlock dependency successors từ [task manifest](implementation-tasks.json).
