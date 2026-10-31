# Phase 10 — Expo native dispatcher, driver và contributor

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [web-mobile-feature-surfaces.md](specs/web-mobile-feature-surfaces.md) · [design-system.md](specs/design-system.md) · [api-conventions-security.md](specs/api-conventions-security.md) · [concurrency-realtime.md](specs/concurrency-realtime.md)

## Overview
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
2. Implement full dispatcher mobile overview/map/impact/plans/approval/Execute/review/source/conflict/results/clock/reset, not reporting-only companion.
3. Use react-native-svg for calibrated map and @floodops/icons native entrypoint, accessible list alternative, native safe-area/large text and touch actions.
4. Driver report quick/text/own assignment; contributor photo picker/manual location/vehicle/time/report status/points. Permission denial/cancel preserves input; no background GPS.
5. Offline app-private drafts/images only; persist with session/generation/capture metadata; explicit review/send after refresh; no offline approval/execution/clock/reset outbox.
6. Use expo/fetch SSE foreground with abort/reconnect/cursor; polling fallback same semantics; stale session drafts never auto-submit replacement.
7. Configure dev/preview/prod API origins without API secret, universal/deep link invite fragment handshake, EAS update runtimeVersion guard and platform permissions copy.
8. Device E2E iOS+Android binary using actual backend; photo/draft restart/reconnect/Reset, unauthorized role and VoiceOver/TalkBack proof; Expo Go alone not binary-release evidence.

## Todo list
- [ ] Step 10.01: Create Expo SDK-compatible RN app, Expo Router stacks/tabs including [sessionId], shared api-client/native fetch adapter and SecureStore credentials
- [ ] Step 10.02: Implement full dispatcher mobile overview/map/impact/plans/approval/Execute/review/source/conflict/results/clock/reset, not reporting-only companion.
- [ ] Step 10.03: Use react-native-svg for calibrated map and @floodops/icons native entrypoint, accessible list alternative, native safe-area/large text and touch actions.
- [ ] Step 10.04: Driver report quick/text/own assignment
- [ ] Step 10.05: Offline app-private drafts/images only
- [ ] Step 10.06: Use expo/fetch SSE foreground with abort/reconnect/cursor
- [ ] Step 10.07: Configure dev/preview/prod API origins without API secret, universal/deep link invite fragment handshake, EAS update runtimeVersion guard and platform permissions copy.
- [ ] Step 10.08: Device E2E iOS+Android binary using actual backend

## Success criteria
- Dispatcher can complete same plan/review/Execute/results flow as web; both show same revision and committed outcomes.
- No commands queued offline or old token applied after Reset. Image permission denial no data loss or auto location tracking.
- Native dev build installed on both platforms and relevant T01..T15 + offline/security paths observed.

## Risk assessment
- Scope drift / missing source: đọc PRD v0.3, coverage và prerequisite register trước phần phụ thuộc; không im lặng shrink.
- Race / platform difference: dùng same authoritative API and deterministic fixtures; no client-authorized safety decisions.

## Security considerations
- Enforce role/resource scope; input schema strict; external text/media/model output untrusted; secrets server-only.
- [Security test plan](specs/testing-strategy.md) áp dụng với every exposed feature; authorization failure không mutate state.

## Verification / evidence
- Run focused feature tests và smoke actual changed path sau integration phase; no pretend planned commands ran.
- Record commands, seed/config hash, pass/fail/unavailable and user-visible output; dùng [testing matrix](specs/testing-strategy.md).

## Next steps
- Mark phase complete chỉ khi acceptance có evidence; unlock dependency successors từ [task manifest](implementation-tasks.json).
