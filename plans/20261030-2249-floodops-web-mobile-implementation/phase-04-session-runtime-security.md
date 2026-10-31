# Phase 04 — Hono session runtime, capabilities và consistency

## Context links
- [Plan](plan.md) · [PRD](../../FloodOps/prd.md) · [Coverage](specs/requirements-coverage.md) · [API](contracts/api-index.md)
- [architecture.md](specs/architecture.md) · [api-conventions-security.md](specs/api-conventions-security.md) · [concurrency-realtime.md](specs/concurrency-realtime.md) · [cloudflare-deployment.md](specs/cloudflare-deployment.md) · [ai-assisted-image-review.md](specs/ai-assisted-image-review.md)

## Overview
- Status: pending. Priority: P1 implementation phase (khác US product priorities).
- Dependencies: Phase 01. Không có ước lượng hoặc phân bổ thời gian.
- Primary agent: [SessionPlatform](worktree-execution/roles/04-session-platform.md). Own runtime/factory/test harness; API package manifest và central binding/config do IntegrationLead theo [ownership](worktree-execution/ownership.md).

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
- Create/modify `apps/api/src/app/** (Hono factory/middleware/error guards, excludes production index composition)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/src/session-runtime/** (DO schema/state/transaction/expiry/reset/outbox)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/src/features/session/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/src/shared/** (platform ports, no domain logic dump)` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create/modify `apps/api/test/{capabilities,commands,replay,reset,expiry}/**` trong `/Users/vominhlong/seahackathon/floodops-application/`.
- Create `apps/api/{package.json,vitest.config.ts,wrangler.test.jsonc}` và `apps/api/test/runtime-worker.ts`: local Workerd/DO test harness dùng cùng Hono factory, không đợi deployment phase12 và không cần credentials production.
- Delete: không có file ứng dụng cũ cần xóa trong repo tài liệu; không xóa PRD/history/user files.

## Implementation steps
1. Create Hono app factory with injected feature routers and typed bindings; exact JSON404 for /api, auth before private data, CSRF/Origin and request limits.
2. Implement per-session SQLite DO, schema-version migrations, snapshot/idempotency/event/outbox transactionSync with no external await; unique constraints and CAS errors as spec.
3. Create isolated session + scoped participant capabilities/invites; web HttpOnly cookie/native bearer response, secure digest, owner/driver/contributor bindings server-derived.
4. Implement metadata-only vs operational revision handling, latest plan/job and image-review current-job pointers, durable lease/deadline/quota hooks, role-projected views/events and pagination filters; image-review metadata increments event_sequence only, never operational revision.
5. Implement explicit reset saga old/new DO with persisted stages/replacement credentials, tombstone/expiry/revoke, idempotent resume and stream closure; fence and supersede image-review jobs on Reset/expiry without publishing stale output.
6. Bound SSE60s/15s heartbeat, same visibility/cursor JSON fallback, concurrency connection quotas; project `image_review_changed` only to dispatchers as metadata-only invalidation/refetch, no image/advice payload.
7. Expiry check every access; scheduled cleanup only wall housekeeping, R2 orphan outbox retained until delete succeeds; reconcile overdue/crashed image-review leases, release slots, and never auto-retry provider calls.

## Todo list
- [ ] Step 04.01: Create Hono app factory with injected feature routers and typed bindings
- [ ] Step 04.02: Implement per-session SQLite DO, schema-version migrations, snapshot/idempotency/event/outbox transactionSync with no external await
- [ ] Step 04.03: Create isolated session + scoped participant capabilities/invites
- [ ] Step 04.04: Implement metadata-only vs operational revision handling, latest plan/job and image-review current-job pointers, durable lease/deadline/quota hooks, role-projected views/events and pagination filters
- [ ] Step 04.05: Implement explicit reset saga old/new DO with persisted stages/replacement credentials, tombstone/expiry/revoke, idempotent resume and stream closure; fence image-review jobs on Reset/expiry.
- [ ] Step 04.06: Bound SSE60s/15s heartbeat, same visibility/cursor JSON fallback, concurrency connection quotas; dispatcher-only metadata `image_review_changed` invalidation/refetch.
- [ ] Step 04.07: Expiry check every access; recover overdue/crashed image-review jobs without automatic provider retry.

## Success criteria
- Missing/wrong role/cross-session capabilities cannot read or mutate; CSRF attack web cookie rejected, native bearer valid.
- Crash after commit before response replay returns same result; duplicate key different body409; stale412/missing428.
- Two resets same key produce one replacement; old caps/jobs/streams cannot operate new session.
- Image-review persistence is metadata-only: result/job updates advance `event_sequence` but preserve operational `revision`; authorize the current dispatcher/report binding and latest job before publication, reconcile deadline/lease failures, and never perform provider/R2 I/O in `transactionSync()`.

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
