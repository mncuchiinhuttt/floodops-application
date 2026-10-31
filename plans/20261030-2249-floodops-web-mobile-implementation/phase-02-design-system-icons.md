# Phase 02 — Design system, token và isometric vector package

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [design-system.md](specs/design-system.md) · [web-mobile-feature-surfaces.md](specs/web-mobile-feature-surfaces.md) · [feature-implementation-guide.md](specs/feature-implementation-guide.md)

## Overview
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Phase 01. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [DesignSystem](worktree-execution/roles/02-design-system.md). Chỉ own subtree theo [ownership](worktree-execution/ownership.md); package manifests/lockfile và shared configuration do IntegrationLead ghi.

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
- Create/modify `packages/design-tokens/** (tokens.json + CSS/native adapters + tests)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `packages/icons/** (manifest, original vector sources, web/native exports)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `packages/ui-web/** (shadcn primitives/patterns + Storybook)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `packages/ui-native/** (native primitives/patterns + gallery components)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Freeze semantic palette/type/spacing/density/radius/focus/provenance/safety tokens; generate CSS @theme mapping for Tailwind v4 and native StyleSheet inputs from one data source.
2. Install compatible shadcn components into ui-web with accessible baseline; Button/Dialog/Sheet/Table/Tabs/Form/Tooltip/Skeleton/Alert variants. Native counterparts use RN primitives, no DOM/Radix.
3. Build @floodops/icons package original hub/parcel/motorbike/car/water/source isometric SVG and simple control vector adapters. Verify licences; @muxa lookup E404 is not permission to invent imports. Native react-native-svg entrypoint.
4. Document interactive state matrix (ready/pending/blocked/replan/accepted/rejected/zero points/offline), target sizes, focus restore, error summary and map non-color patterns.
5. Storybook web + native component gallery use actual primitives; token contrast automated; manual VoiceOver/TalkBack keyboard/large-type checks planned in phase11.
6. Add usage/contribution/versioning notes; semver token/component breaking changes need both adapters plus migration notes, not aliases forever.

## Todo list
- [ ] Step 02.01: Freeze semantic palette/type/spacing/density/radius/focus/provenance/safety tokens
- [ ] Step 02.02: Install compatible shadcn components into ui-web with accessible baseline
- [ ] Step 02.03: Build @floodops/icons package original hub/parcel/motorbike/car/water/source isometric SVG and simple control vector adapters. Verify licences
- [ ] Step 02.04: Document interactive state matrix (ready/pending/blocked/replan/accepted/rejected/zero points/offline), target sizes, focus restore, error summary and map non-color patterns.
- [ ] Step 02.05: Storybook web + native component gallery use actual primitives
- [ ] Step 02.06: Add usage/contribution/versioning notes

## Success criteria
- One semantic name yields same intended value across platforms; tokens/icon manifest contains no missing assets/licences.
- Required status/error/focus/loading variants render in both surfaces, controls labelled, no emoji UI.
- Contrast>=4.5 text and3 UI pairs; 320px reflow/44dp+ native hit areas; native imports no web packages.

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
