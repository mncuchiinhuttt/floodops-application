# Operational limits và session lifecycle configuration

Những con số ở đây là **đề xuất security/resource limits**, không phải thông số vật lý/calibration D04 hoặc thời gian phân bổ công việc. Implementation đặt cùng một config có validation cho API, DO và clients.

| Setting | Giá trị khởi điểm đề xuất | Behavior khi chạm giới hạn |
|---|---|---|
| SESSION_IDLE_SECONDS | 3600 | Authenticated successful access/command refresh idle tới absolute cap; public probe không refresh |
| SESSION_MAX_AGE_SECONDS | 86400 | 410 SESSION_EXPIRED, không revive; cap expiry không vượt session |
| INVITE_MAX_SECONDS | 900 | One-use, expired generic401; owner can issue new |
| IDEMPOTENCY_RETENTION | Lifetime session + reset replay tới original capability expiry | Không dọn cached outcome trước request có thể retry |
| MAX_UPLOAD_BYTES | 5242880 | Stream count then413, không tin Content-Length |
| MAX_IMAGE_DIMENSION | 4096 per side | Decode/normalize reject422 before serve |
| MAX_SESSION_MEDIA_BYTES | 104857600 | Reserve/complete quota atomic; release orphan reservations |
| MAX_SESSION_REPORTS | 500 | 429/session budget, no partial award |
| MAX_STREAMS_PER_SESSION | 5 | 429 with Retry-After; release slot on disconnect/timeout |
| SSE_CONNECTION_SECONDS | 60 | Close cleanly then cursor reconnect |
| SSE_HEARTBEAT_SECONDS | 15 | Comment heartbeat; recheck auth/expiry |
| MAX_EVENT_PAGE | 500 | Cursor scan bounded; hidden events still advance next_sequence |
| CREATE_PER_IP_PER_HOUR | 10 | Edge quota, native not bypass via fabricated Origin |
| COMMANDS_PER_PARTICIPANT_PER_MINUTE | 120 | 429 truthful Retry-After, same-key replay not duplicate domain effects |
| PLANNING_CONCURRENCY_PER_SESSION | 1 | Supersede/coalesce by newest revision, no unbounded fanout |
| MODEL_DEADLINE_SECONDS | 20 | Job failed MODEL_TIMEOUT, no new operational state |
| MODEL_TOOL_CALL_LIMIT | 12 | Typed budget error, real-eval failure retained |
| MODEL_TURN_LIMIT | 6 | Stop controller, manual replan possible |
| ADVANCE_EVENTS_PER_TURN | 100 | Persist reached target/progress, resume bounded job, no skipped events |
- Per-account model spend cap và provider token limits phải cấu hình theo credit thực trước bật model; không invent giá tiền/model throughput. Disabled model trả MODEL_UNAVAILABLE, deterministic suite vẫn chạy có nhãn.
- Deployment rate-limit storage must be edge/binding-backed for create/IP and session-local DO for participant/session counters; no in-memory cross-isolate promise. Nếu global spend service chưa có: reserve budget do account provider hard cap, operator killswitch, serialized per-session limit và test explicit limitation; không claim strict global distributed dollar ledger.

## Capability routing và ownership
- Create request có X-Client-Request-Scope random128bit+, Idempotency-Key. SESSION_LOCATOR_KEY HMAC(app_env, nonce,key) xác định session object ổn định qua retry. Locator không cấp quyền; capability random độc lập.
- Owner participant có manage_dispatchers; tạo invite dispatcher để web↔mobile cùng phiên. Claimed dispatcher không tự có owner-delegation; server permissions quyết định exact operations.
- Web fragment chỉ mang invitation token và session locator; consume+clear fragment, issue cookie. Native link consume+SecureStore.
- Driver/contributor token không thể submit reporter khác binding; dispatcher simulation chọn reporter_entity_id từ frozen entities với audit submitted_by riêng.
- Session expiry measured wall clock; evidence expiry measured simulation clock. Read/command entrypoints cùng enforce policy, không chờ alarm.

## Sealed idempotent credential outcomes
- Secrets: SESSION_LOCATOR_KEY; CAPABILITY_SEAL_KEY_ACTIVE + key ID; previous seal keys giữ tới max original session expiry trong rollback window. Không client/public vars.
- Encrypt credential-bearing create/claim/reset response using authenticated encryption AES-GCM with fresh nonce, key ID and AAD(session_id,participant_id,key,request_digest). Auth token table chỉ digest.
- No plaintext capability trong SQLite/outbox/log. Narrow reset recovery giữ original và replacement owner digest + old/new CSRF digest tới expiry; chỉ cùng key/request digest và valid Origin được replay sealed outcome, kể cả headers-only delivery.
- Crash reset stages: old DO lock/reset intent persisted with replacement ID before remote init; replacement records reset origin+key; init ack then tombstone; retry resumes exact target, not new ID.
- After old tombstone all devices need new invitation except initiating dispatcher receives replacement credential. If reply lost, narrow authenticated cached-reset recovery above; SSE never contains it.

## Cleanup and rollback
- Media staging intent reservation has wall expiry bounded by session, housekeeping removes orphan raw/derivative objects with persistent cleanup outbox.
- Shared immutable SCENARIO_ASSETS is deployment data, **not** deleted by expiring one session. REPORT_MEDIA cleanup only keys owned by that session.
- DO schema additive compatible migration and key ID rotation rollback drill required. Workers rollback is not state rollback.
