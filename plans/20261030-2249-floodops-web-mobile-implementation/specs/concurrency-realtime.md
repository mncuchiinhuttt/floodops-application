# Atomic commands, versioning và realtime

## Version identities
- Session metadata có `session_id`, `generation`, `revision`, `event_sequence`, `schema_version`; ID mới khi Reset.
- ETag strong `"s:<session_id>:g:<generation>:r:<revision>"`; `If-Match` cho operational mutations/review/approval/execution/reset/report như OpenAPI. Upload reserve/bytes/completion là metadata-only, không cần CAS và không đổi operational revision.
- `event_sequence` tăng cả audit/job/proposal/approval; revision chỉ tăng domain state inputs/knowledge/clock/operations. Snapshot response và mutations trả exact revision/seq.
- New proposal không tự tăng revision. Replan job mới cùng revision supersede old plan **ngay khi job accepted**, giữ latest_requested_job_id/latest_plan_id; Approve, dry-run và Execute đều kiểm pointer trong transaction. New-key old-plan request =>409 STALE_PROPOSAL; exact committed idempotent replay vẫn trả execution cũ.

## Transaction protocol
1. Authenticate capability và resource scope trước mọi data return; validate payload strict + body limit.
2. Check `(participant,key)` idempotency trước If-Match: same digest/path => exact original response; different digest => 409 IDEMPOTENCY_KEY_REUSED.
3. Key entropy>=128 bits, max 128 chars; store digest request; payload JSON normalized stable including semantic inputs, path, participant, session/generation. Headers auth không vào digest.
4. Nếu key chưa có, check revision và mutation eligibility; missing If-Match=>428, stale=>412 actual revision safe.
5. Build transition trên snapshot local, no await network; storage transactionSync commit snapshot+events+awards+idempotency. Unique constraints bắt duplicate report/gap/award.
6. Trả result+ETag; stream publish sau commit. Crash sau commit trước response vẫn retry key trả cùng execution, không award lần hai.
7. Failed validation/precondition không reserve key trừ lỗi nghiệp vụ đã commit attempt/audit; phân biệt và test retry.
8. Public Create idempotency: X-Client-Request-Scope là CSPRNG client nonce, HMAC(server secret, nonce+key) xác định object locator ổn định; không là capability. Session owner token sinh độc lập CSPRNG. Replay response có token/cookie phải seal bằng authenticated encryption server key trước khi lưu idempotency; không lưu plaintext capability. ClaimInput có session_id để route đúng DO và token mới là authority.
- Upload media bytes/LLM fetch không trong transaction. DO concurrent turns phải re-read + CAS sau await.

## Planning jobs
- POST plan-job=>202 job_id, captured revision, status queued/running; không giữ request người dùng tới khi LLM xong.
- One active planning job/session; event mới supersede prior job, coalesce một job cho latest revision; không vô hạn retry/thêm queue infrastructure.
- Persist lease/deadline/model hash trước effect. DO `waitUntil` không là durable job queue: active attempt timeout hữu hạn; activation/read/alarm housekeeping đánh dấu abandoned job failed. Không tự retry provider tạo plan rồi gọi đã thành công; user Replan hoặc newest input tạo job mới.
- Return refusal/incomplete/schema/unknown ID/tool limit/provider timeout thành failed typed result. Unavailable model giữ domain accepted observations.
- Response commit chỉ khi session generation+revision+active_job_id còn khớp. Không gate pass => publish proposed blocked reasons, không execute.

## Chosen stream: SSE fetch
- Contract GET `/sessions/{session_id}/events/stream?after=<sequence>`; `Accept: text/event-stream`; bearer header native, HttpOnly cookie web. Không token trong query URL.
- Web fetch streaming và native `expo/fetch` theo tài liệu Expo đã đối chiếu; fallback GET `/events?after=` cùng cursor. Reader/Abort/header/reconnect phải smoke trên iOS/Android thực.
- Event schema chuẩn trong OpenAPI: event_id/sequence/session/generation/revision/sim_minute/type/actor/resource refs. Visibility là filter server, không gửi private payload. SSE `id` cho Event frames; `event:cursor` data `{next_sequence}` advance qua hidden-only scanned page; heartbeat comment không có seq.
- Typed SSE control cursor không mutate domain state. Cookie/bearer được kiểm lại; no full photo/token/model prompt. JSON catch-up và SSE có cùng next-sequence/filter semantics.
- Snapshot hoặc **own driver/contributor dashboard** theo role rồi subscribe after meta.event_sequence. Duplicates drop; cursor gap catch-up; session/generation mismatch clear query cache và rejoin.
- Cursor too old=>410 EVENT_CURSOR_EXPIRED; refresh authorized full view của role rồi subscribe. Heartbeat không tăng seq; slot connection cleanup và quota bounded.
- Native foreground reconnect + jitter; abort stream on unmount/background; polling while foreground nếu stream unavailable. Offline không phán state mới.
- Expiry/revoke checks tại handshake và heartbeat; hết capability đóng stream, không subscription sống vô hạn.

## Reset handshake
- POST reset old session under same idempotent command allocates replacement session/generation and new dispatcher capability; body/cookie delivery theo client type, same reset retry trả same replacement.
- Before replacement commit old session enters resetting, prohibits mutation. Replacement ready -> old tombstone SESSION_RESET; không old/new state split cho other clients.
- Old capability không tự chuyển quyền. Dispatcher retains ownership via replacement credential; driver/contributor/viewer cần invite mới. Stream chỉ báo replacement_session_id, không broadcast tokens.
- Offline drafts giữ như local unsent với old-session marker; không tự submit sang replacement. Old in-flight LLM/upload completion ignored/410; staged media cleanup.
- Durable reset saga persisted stages allocated→initialized→tombstoned; failure resume theo reset key, không tạo nhiều sessions/charge duplicate.
- Reset retry hỗ trợ cả old owner digest **hoặc đúng replacement owner digest của chính reset record đó** với identical reset key/request digest tới credential expiry. Cookie có thể đã rotate dù body mất. Origin phải hợp lệ; old hoặc replacement CSRF token phải match digest lưu trong reset record. Không key-only recovery, không unrelated credential; không cấp quyền endpoint old-session khác.

## Playback/CAS
- Playback là renderer view-only trên trace committed; play/pause/speed không drive DO clock, không có API pause/auto-tick. Chỉ dispatcher explicit `/simulation/advances` đổi simulation time; alarm chỉ housekeeping. Trong advance job, plan/approval có thể stale và UI yêu cầu Replan sau khi target reached.
- SSE chỉ notifications/refetch, không thay auth hay revision guard. Domain revision invalidates all unexecuted approvals/proposals, event-only audit không.
- Concurrency tests: approve-vs-advance, two executes, two report accepts, duplicate image different participant, reset-vs-response/upload, two reset retries, disconnect/eviction/restart.

## Advance lease recovery
- Persist advance_id, lease_nonce, lease_expires_at, target và checkpoint event schedule sau mỗi committed boundary. Continuation so session/generation+lease_nonce+expected revision trước từng chunk.
- Authorized access/activation/housekeeping thấy lease expired => atomically mark job failed, release advancing lock, emit advance_changed; **không advance clock**. Keep last committed boundary/schedule và error/progress.
- Dispatcher refresh revision rồi gửi advance mới tới target còn lại, key mới. Old lease fenced dù worker sống lại; same-key POST cũ chỉ replay failed/original job ID, không giấu crash như đã chạy xong.
- Test terminate giữa chunks, recover sau lease expiry, explicit continue tới cùng H yields same deterministic completion log; late old continuation/reset/expiry không được ghi.
