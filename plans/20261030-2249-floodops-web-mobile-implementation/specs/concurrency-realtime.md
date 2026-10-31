# Atomic commands, versioning và realtime

Image-review job lifecycle follows [the canonical advisory contract](ai-assisted-image-review.md); it is independent of operational planning/revision.

## Version identities
- Session metadata có `session_id`, `generation`, `revision`, `event_sequence`, `schema_version`; ID mới khi Reset.
- ETag strong `"s:<session_id>:g:<generation>:r:<revision>"`; `If-Match` for operational mutations/review/approval/execution/reset/report as OpenAPI. Upload reserve/bytes/completion and image-review job metadata are metadata-only, need no operational CAS, and do not change operational revision.
- `event_sequence` increases for audit/job/proposal/approval; revision increases only for domain-state inputs/knowledge/clock/operations. Image-review state changes increment `event_sequence` only. Snapshot response and mutations return exact revision/seq.
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

## Advisory image-review jobs
- POST creation uses `Idempotency-Key`, not operational `If-Match`; same key + same request digest replays the original outcome. With a new key, a queued/running job or valid completed job with the same server-derived current `input_digest` reuses that job/result without another provider call. A failed job is retried only by an explicit user action with a new key; no automatic retry.
- Persist the current per-report job pointer, immutable context binding, lease/deadline, and per-session concurrency/call-budget reservation in short DO transactions. Never await model/R2 work inside `transactionSync()`. Before the paid call and before publishing, recheck session/generation, pending report, normalized image digest, report description/segment/capture/vehicle context, model/config/rubric version, current job pointer, and deadline.
- Human Accept/Reject, report/input changes, model/rubric changes, Reset, expiry, or a newer current job supersede old work; late output is discarded and cannot replace the decision/result. A change in unrelated operational revision alone does not supersede an unchanged image-review binding or trigger a rerun.
- On activation/authorized GET/housekeeping, reconcile expired leases/deadlines **only for queued/running jobs** to failed `MODEL_TIMEOUT` or superseded, persist completion metadata, release the concurrency slot, and never invoke the provider again automatically after a crash. GET reconciles current binding before returning advice; a valid completed result remains readable after its provider-request deadline.
- Metadata/job changes advance `event_sequence`, not `revision`. `image_review_changed` is dispatcher-only and is a safe invalidation/refetch signal. Client caches bind the state to session + generation + report + job/input digest; accept a running→completed update even when operational revision is unchanged, but still reject a stale generation/job/report binding.


## Chosen stream: SSE fetch
- Contract GET `/sessions/{session_id}/events/stream?after=<sequence>`; `Accept: text/event-stream`; bearer header native, HttpOnly cookie web. Không token trong query URL.
- Web fetch streaming và native `expo/fetch` theo tài liệu Expo đã đối chiếu; fallback GET `/events?after=` cùng cursor. Reader/Abort/header/reconnect phải smoke trên iOS/Android thực.
- Event schema `type` enum includes `image_review_changed`; server filters visibility to dispatchers. Event payloads contain safe resource/job references only, never full photo/advice/capability/model prompt. SSE `id` is sequence; `event:cursor` advances across hidden-only pages.
- Typed SSE control cursor does not mutate domain state. Cookie/bearer is rechecked; no full photo/token/model prompt. JSON catch-up and SSE have the same next-sequence/filter semantics.
- Snapshot hoặc **own driver/contributor dashboard** theo role rồi subscribe after meta.event_sequence. Duplicates drop; cursor gap catch-up; session/generation mismatch clear query cache và rejoin.
- Cursor too old=>410 EVENT_CURSOR_EXPIRED; refresh authorized full view của role rồi subscribe. Heartbeat không tăng seq; slot connection cleanup và quota bounded.
- On `image_review_changed`, invalidate/refetch the dispatcher’s report-review query using current session/generation/report/job binding and `event_sequence`; do not drop a job-progress update just because `revision` is equal. A superseded binding remains stale even if its event arrives late.
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
