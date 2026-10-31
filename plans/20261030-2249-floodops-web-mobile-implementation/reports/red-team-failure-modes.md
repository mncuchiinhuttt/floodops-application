# FloodOps plan red-team — Failure Mode Analyst

## Scope and verdict

**Verdict: incorrect / not implementation-ready until the three High findings below are resolved.** This is a document review, not a finding of defects in implemented application code. Reviewed the current active plan, policy/domain/simulation/concurrency/deployment specifications, phases 03/04/05/06/07/08, relevant OpenAPI state shapes and operations, client data-loading rules, and PRD §§6–8. Parent integration updates were incorporated into the review: sealed reset replay, creation/claim locators, metadata-only media commands, explicit-advance-only simulation, and the corrected Event transport were not treated as missing features.

All plan-relative references below refer to `plans/20261030-2249-floodops-web-mobile-implementation/`.

## F1 — High / P1: Enforce same-revision supersession at Execute, not only Approve

**Primary location:** `phase-06-planning-safety-execution.md`, Implementation steps 5–6 (lines 37–38). **Confidence:** 0.94.

**Evidence:** `specs/concurrency-realtime.md`, Version identities, explicitly allows a replacement plan at the same operational revision and supersedes the former plan through `latest_job_id` / `latest_plan_id`. Phase 06 step 5 and OpenAPI `decidePlanActions` explicitly check those pointers. The consuming operation `executePlan` (OpenAPI lines 5430–5439), phase 06 step 6, and `specs/policy-rules.md`, Proposal / approval / execution steps 4–8, specify revision, dependency, evidence, approval, feasibility and objective checks, but do not carry the pointer guard into execution. POL-03 describes stale revision, which cannot detect this case.

**Failure trace and impact:** Plan A is Ready, or is approved, at revision r. A second planning job publishes plan B at the same r. A delayed device submits a first Execute for A with a fresh idempotency key and the still-current If-Match r. A's action/plan/revision-bound approval remains an exact match, its routes can remain feasible, and none of the enumerated Execute checks establishes that A is no longer current. The approve-only pointer guard never runs. This leaves a specified path for executing a superseded proposal even though B is the session's current proposal; a whole-candidate safety recheck does not establish latest-plan identity.

**Required correction:** In the same transaction that compiles and commits a new execution, require the requested plan and its planning-job identity to match the authoritative current pointers and to remain executable. Apply the same identity check to dry-run/eligibility results. Define the supersession status transition for the former plan and its approvals, and return `STALE_PROPOSAL` without operational writes for this equal-revision case. Preserve ordinary exact replay of an already committed execution before these new-command eligibility checks.

**Acceptance proof to add:** Approve A at r → publish B at r → Execute A using a new key and If-Match r must fail without assignment/route/ETA/revision changes. Repeat with A requiring no approval, and with the second planning job superseding A before its provider response completes.

## F2 — High / P1: Recover a web Reset after Set-Cookie succeeds but its body is lost

**Primary location:** `specs/concurrency-realtime.md`, Reset handshake, narrow retry exception (line 43). **Confidence:** 0.97.

**Evidence:** The current `resetSession` description explicitly permits tombstone replay only for the **original** dispatcher capability digest plus identical reset key/request digest. `CredentialDelivery` and `cookieAuth` use one HttpOnly `__Host-floodops_session` cookie for web, with `access_token: null` in the JSON response. `ResetResult.replacement` carries the replacement session ID in the response body. The identity route also requires a known `session_id`. `specs/api-conventions-security.md`, No production account system, expressly provides no owner-account recovery flow. The sealed old-owner replay exception handles a wholly lost response, but not the following partial response.

**Failure trace and impact:** The server commits the reset and the browser processes the response headers, replacing its old cookie with the new session's cookie. The connection then fails before the JSON body reaches application code. The UI still knows only the old session ID, reset key and old CSRF token; JavaScript cannot recover the overwritten HttpOnly credential. Retrying the old-session reset sends the replacement cookie, which fails the explicit original-digest-only exception and normal old-session scope checks. The client also does not yet know the replacement session ID needed to call its identity endpoint. Thus a successful Reset can strand the web owner despite the advertised idempotent handoff.

**Required correction:** Specify a recovery path for both sides of cookie rotation. For example, permit the exact sealed reset-outcome replay using either the original dispatcher credential or that reset's still-valid replacement dispatcher credential, with server-side binding to the original reset record, its key/request digest, and appropriate Origin/CSRF proof. Do not grant the replacement credential general access to the old session or let a reset key alone authorize recovery. Alternatively, retain the original cookie through a staged handoff and switch it only after the client has durably received the replacement ID. Reconcile this behavior with the general session-ownership middleware and document it on `resetSession`.

**Security acceptance proof to add:** Process reset response headers/cookie but drop the body, then retry from a real cookie-using browser. Recover the same replacement session and credential, with no second session allocation; test both pre-header and post-header loss. Wrong key, wrong participant, unrelated replacement capability, expired credential and cross-origin replay must remain denied, with no credential in events/logs.

## F3 — High / P1: Define an advance lease-expiry transition that releases the session lock

**Primary location:** `phase-08-simulation-results-evaluations.md`, Implementation steps 1–2 (lines 32–33). **Confidence:** 0.91.

**Evidence:** `specs/simulation-calibration.md`, Clock and deterministic scheduling, makes a long advance a resumable 202 job whose event boundaries commit in chunks. Phase 08 persists its progress/lease and blocks Execute while advancing. OpenAPI `advanceSimulation` persists a lease and blocks conflicting commands; `getAdvanceJob` only queries progress, while `SimulationClock` exposes the advancing mode. The generic transaction protocol returns the original response on same-key retry. Conversely, `specs/concurrency-realtime.md`, Planning jobs, explicitly defines abandoned-job detection and a failed transition for **planning** jobs only. Current clock/deployment rules forbid alarms from advancing simulation, and the projection/SSE paths are read-only. No advance-specific lease-expiry transition or request-triggered continuation is assigned to any consumer.

**Failure trace and impact:** An advance to H commits some chunks and leaves a persisted running job/session advancing, then its executing turn dies before the next chunk. Persisted progress prevents loss of the completed prefix but does not execute the remaining suffix or release the lock. The documented polling/stream requests only observe the running state; an identical POST replays the original 202, and a new advance or Execute conflicts with the in-flight advance. Without a defined lease-expiry consumer, the session can remain locked at an intermediate simulation minute until Reset or expiry, preventing completion of T01/T13/T14 and making the declared resumability incomplete.

**Required correction:** Specify an advance watchdog transition on activation/authorized access or housekeeping: once the lease expires, atomically mark that attempt failed, preserve its last fully committed boundary and pending deterministic schedule, and clear the advancing lock without changing simulation time. Permit the dispatcher to continue explicitly to the frozen target through a new CAS/idempotent advance command, using the current revision. State how the old attempt is fenced so its late continuation cannot commit. This fits the current advance-only clock contract and does not require autonomous alarm-driven time or a new queue service.

**Acceptance proof to add:** Terminate execution after a committed intermediate boundary; reactivate the object after lease expiry. Assert failed job status, released session lock, unchanged committed simulation time, and successful explicit continuation to the same target. Compare the final completion log/metrics to an uninterrupted run and assert that a late old-lease continuation makes no writes. Cover reset/expiry during the abandoned interval as well.

## Other attacked boundaries

No additional Critical/High finding was retained for reward review retries/cleanup, basic R2 saga atomicity, or storage migration rollback. Those failure modes already have explicit unique report/first-fill constraints, one-DO award transactions, retained cleanup outbox rows until R2 deletion acknowledgement, versioned per-object startup migrations, and an additive rollback compatibility window; reporting those mechanisms as absent would duplicate specified mitigations. The reset saga itself already freezes the old session and persists allocated/initialized/tombstoned stages; F2 concerns the separate browser credential-delivery boundary.

## Verification status

Document and contract inspection only. No application edits, build, lint, test, formatter, deployment, provider request, or runtime reproduction was performed. The acceptance proofs above are requested plan additions, not claimed execution evidence. Only this owned review report is intended for repository modification.
