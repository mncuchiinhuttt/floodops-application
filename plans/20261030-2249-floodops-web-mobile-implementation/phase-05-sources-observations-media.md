# Phase 05 — Nguồn, observation, report và upload ảnh an toàn

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [domain-model.md](specs/domain-model.md) · [policy-rules.md](specs/policy-rules.md) · [api-conventions-security.md](specs/api-conventions-security.md) · [cloudflare-deployment.md](specs/cloudflare-deployment.md) · [ai-assisted-image-review.md](specs/ai-assisted-image-review.md)

## Overview
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Phase 03, Phase 04. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [SourcesMedia](worktree-execution/roles/05-sources-media.md). Exclude reports/review và knowledge/conflict-review của ReviewRewards; actual writer theo [ownership](worktree-execution/ownership.md).

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
- Create/modify `packages/domain/src/{sources,knowledge,reporting}/** (excludes reward/review orchestration owned07)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/src/features/{scenario,sources,knowledge,reports,media}/** (review route/controller subtree reserved07)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/test/{sources,observations,media}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Implement fixture adapters weather/tide/river/traffic/camera/driver/community with common envelope, source context/observation/restriction roles and provenance labels.
2. Normalize units/datum/time/geography; no context-derived passability, missing mapping→needs_clarification. Validate epoch/vehicle/current evidence and authority profile reopening.
3. Submit actor-owned quick/text driver/citizen report. Quick path works without model; text normalization asynchronous with snapshot/session guards; citizen pending review always.
4. Implement media reserve/upload/complete lifecycle with actual byte cap, JPEG/PNG sniff+dimension+decode normalization/EXIF strip; private generated R2 keys and authorized derivative reads.
5. Image process/R2→DO completion is saga/outbox, cleanup orphan on failure; no accepted report from unready media or arbitrary URL. Platform Images availability prerequisite explicit.
6. Expose graph/source/knowledge/report owner-projected reads and a server-only authorized normalized-image/digest/readiness port for ReviewRewards; return only verified normalized derivative access, never raw staging/R2 URL. Domain conflict transitions preserve closure and gaps.
7. Record unavailable providers rather than no-op mocks called live adapters. Source catalog data is replay input only.

## Todo list
- [ ] Step 05.01: Implement fixture adapters weather/tide/river/traffic/camera/driver/community with common envelope, source context/observation/restriction roles and provenance labels.
- [ ] Step 05.02: Normalize units/datum/time/geography
- [ ] Step 05.03: Submit actor-owned quick/text driver/citizen report. Quick path works without model
- [ ] Step 05.04: Implement media reserve/upload/complete lifecycle with actual byte cap, JPEG/PNG sniff+dimension+decode normalization/EXIF strip and authorized safe derivative read
- [ ] Step 05.05: Image process/R2→DO completion is saga/outbox, cleanup orphan on failure
- [ ] Step 05.06: Expose graph/source/knowledge/report owner-projected reads plus authorized normalized-image/digest/readiness port for ReviewRewards
- [ ] Step 05.07: Record unavailable providers rather than no-op mocks called live adapters. Source catalog data is replay input only.

## Success criteria
- T03/T08/T09/T11 context/evidence schema tests; raw external text cannot write policy/tier.
- Malformed/cross-session/oversized/metadata photo not served; duplicate normalized hash visible correct reason, not rewarded here.
- Pending/accepted labels and accepted knowledge are separate; requests after reset cannot attach old image.
- The image-review port reports server-derived normalized digest and readiness for pending reports; it never exposes unverified raw media or grants review/reward authority.

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
