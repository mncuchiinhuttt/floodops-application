# FloodOps plan review — Security Adversary

## Scope and evidence

Plan-document review only. Read `plan.md`, `specs/api-conventions-security.md`, `specs/concurrency-realtime.md`, `specs/cloudflare-deployment.md`, phases 04/05/12, and the relevant OpenAPI operations/schemas and consuming client/security contracts. Also consulted the updated `specs/operational-limits.md`, `contracts/usage-examples.md`, tool/controller limits, and security acceptance matrix. The review incorporates the parent's revised creation locator, sealed credential outcomes, dispatcher invitations, session-scoped identity/logout, role projections, and explicit simulation advance design. No application code, builds, tests, scanners, or live attack requests were executed.

**Verdict: incorrect — three high-priority plan defects remain.** Runtime consequences below are contract-derived [INFERENCE], not claims of observed application behavior.

## 1. [P1] Preserve reset recovery after the browser accepts the replacement cookie

**Primary anchor:** `contracts/openapi.json`, `resetSession` description (line 1765 at review), and `CredentialDelivery` / `ResetResult` schemas. **Related:** `specs/api-conventions-security.md` §No production account system; `specs/concurrency-realtime.md` §Reset handshake; `specs/operational-limits.md` §Sealed idempotent credential outcomes; `getIdentity` at `/sessions/{session_id}/identity`.

The reset replay exception accepts **only the original dispatcher capability digest plus the original reset key/request digest**, but web reset delivers its replacement capability by overwriting the same HttpOnly `__Host-floodops_session` cookie. If the browser receives the successful response headers and applies `Set-Cookie`, then the connection fails before the JSON `ResetResult` body is read, the client still knows only old session A while the browser now holds session B's opaque capability. Retrying `/sessions/A/resets` therefore sends B's capability and cannot satisfy the original-A-digest-only recovery rule. JavaScript cannot restore A's HttpOnly credential; it also cannot call the session-scoped identity endpoint for B because the missing body contained B's session ID. This defeats the explicitly required lost-response reset recovery and strands the initiating web dispatcher despite a completed reset. The existing sealed-outcome storage does not solve this credential-delivery boundary.

**Suggested fix:** Specify an acknowledged web reset handoff that remains recoverable after headers-only delivery. For example, retain a separate HttpOnly, reset-key-scoped recovery credential until the replacement body is acknowledged, or allow the recorded replacement owner capability to authenticate **only the identical cached reset outcome on A**, with explicit CSRF/Origin/expiry rules. Keep all unrelated old-session reads/mutations denied. Update `resetSession`, cookie delivery, and the client flow together.

**Required future acceptance:** Apply the replacement `Set-Cookie`, truncate the 201 body before the client learns the replacement ID, then retry from the old route. The same replacement and credential must be recoverable without another allocation or broadened old-session authority.

**Confidence:** 0.99.

## 2. [P1] Freeze the old session before starting the cross-DO reset handoff

**Primary anchor:** `specs/cloudflare-deployment.md` §5, **Reset boundary** (line 103 at review). **Conflicting contracts:** `specs/concurrency-realtime.md` §Reset handshake; `specs/operational-limits.md` §Sealed idempotent credential outcomes; phase 04 step 5 and reset acceptance.

The deployment recipe validates reset, initializes the replacement DO, and only afterward tombstones/revokes the old DO; it explicitly says that an old-tombstone failure leaves the old session **usable** and lets the new object expire as an orphan. The concurrency contract instead requires a persisted `resetting` lock **before** replacement initialization, rejects old-session mutations, and resumes the **same** persisted replacement target after failure. Following the deployment recipe allows a report/Execute at revision r to commit while a reset already validated against r awaits the new DO, followed by a reset tombstone without the prescribed pre-await lock; both competing commands can pass the original precondition. Its orphan-and-resume behavior also cannot simultaneously satisfy the exact-target retry rule. These are conflicting operational instructions for the same security/session boundary, not an omitted generic race mitigation.

**Suggested fix:** Replace the deployment recipe with the already specified persisted reset-intent/lock protocol: atomically authorize/CAS and persist `resetting` plus reset key and replacement ID in the old DO before any remote initialization, reject old-session mutations while that intent exists, then initialize and tombstone idempotently. A crash resumes that exact target; do not describe the old session as generally usable or the initialized target as disposable during the active saga. Preserve the narrow cached-response recovery rule separately.

**Required future acceptance:** Pause after replacement initialization but before the old tombstone, attempt an old-session report/Execute, then simulate a tombstone failure and retry. The competing mutation must be denied and the retry must complete the same replacement.

**Confidence:** 0.99.

## 3. [P1] Use the session-scoped media routes throughout the deployment contract

**Primary anchor:** `specs/cloudflare-deployment.md` §6, **Media upload contract** (lines 113–117 at review), and §8 media acceptance case 6 (line 170). **Consuming contract:** `contracts/openapi.json` operation IDs `uploadMediaContent`, `completeMediaUpload`, and `getMedia`; phase 05 steps 4–5. `contracts/usage-examples.md` §3 also shows the unqualified paths under a declared `/api/v1` base without establishing a session-scoped base.

OpenAPI requires `/sessions/{session_id}/media-uploads/{upload_id}/content`, `/sessions/{session_id}/media-uploads/{upload_id}/completion`, and `/sessions/{session_id}/media/{media_id}`. The deployment specification instead mandates `/api/v1/media-uploads/{upload_id}/content`, `/api/v1/media-uploads/{upload_id}/completion`, and `/api/v1/media/{media_id}`, including the latter as the acceptance path. The reservation is session-scoped in both documents, and upload/media IDs are opaque; the chosen runtime stores their ownership/metadata only in the session DO and defines no global media-ID locator. Thus the generated web/native clients and the deployment handlers cannot both follow their required routes: the real-image flow fails at byte upload/completion/read, and the unscoped handlers lack the documented session selector needed to perform the private-object authorization.

**Suggested fix:** Change all three deployment paths and their acceptance/example references to the existing OpenAPI session-scoped paths. Explicitly authorize the session and participant ownership before resolving upload/media metadata or reading bytes; retain the existing fail-closed normalization and private derivative-only behavior. Do not add parallel unscoped aliases or a global ID lookup.

**Required future acceptance:** Drive reserve → byte upload → normalization/completion → authorized image read through the generated client paths; use another participant/session capability against those exact routes and require denial without exposing image bytes or metadata.

**Confidence:** 0.99.

## Handoff

Only this review report is owned by this reviewer. No plan/spec/contract edits were made. Main should reconcile the three contracts and add the identified boundary cases to the planned acceptance suites; no verification execution is claimed here.
