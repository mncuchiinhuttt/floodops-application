# API usage flows — thiết kế, chưa chạy trên server

Base `/api/v1`; mọi ID bên dưới là synthetic example, không là API/key thật. Token/If-Match lấy từ response runtime. [OpenAPI](openapi.json) quyết định field đầy đủ, [security](../specs/api-conventions-security.md) quyết định scope.

## 1. Native tạo phiên, web/mobile ghép cùng session
```http
POST /api/v1/sessions
Content-Type: application/json
X-Client-Request-Scope: <random-installation-nonce>
Idempotency-Key: <stable-create-key>

{"scenario_id":"scenario_functional01","scenario_version":"functional-v1","client_type":"native"}
```
- 201 trả SessionCreated.session/participant/credential; native lưu access_token vào SecureStore. Web client_type=web nhận cookie HttpOnly, access_token=null.
- Owner tạo invitation role=dispatcher để điện thoại/web thứ hai cùng điều phối; chỉ owner manage_dispatchers cấp quyền này. Không chuyển role qua selector.
```http
POST /api/v1/sessions/session_example001/invitations
Authorization: Bearer <owner-capability>
Idempotency-Key: <invitation-key>
Content-Type: application/json

{"role":"dispatcher","bound_entity_id":null,"expires_in_seconds":900}
```
- Share fragment link trong app-owned domain; claim POST chứa session_id+claim_token+client_type, server consume một lần; đừng gửi token trong query/log.
- GET `/sessions/{id}/identity` lấy permissions/CSRF/ETag; dispatcher snapshot endpoint, contributor/driver chỉ `me` dashboard.

## 2. Snapshot và SSE không mất event giữa hai request
1. GET authorized snapshot hoặc role-specific dashboard, đọc meta.event_sequence=42, ETag revision7.
2. GET `/sessions/{id}/events/stream?after=42` với cookie/bearer. Last sequence được giữ trong memory và session-generation query cache.
3. `data` Event JSON chỉ sanitized resource IDs; fetch typed detail mới theo role. Ignore older/duplicate sequence; cursor-too-old410 => authorized full view refresh.
4. Disconnect/background abort; foreground reconnect/catch-up. Poll GET `/api/v1/sessions/{session_id}/events?after=42&limit=100` cùng semantics; SSE `event:cursor` cập nhật last scanned sequence ngay cả khi page chỉ có hidden events.

## 3. Citizen ảnh và review/reward
Từ mục3 tới7, path ngắn như `/reports`, `/plans/...`, `/simulation/...` dùng **session_base = `/api/v1/sessions/{session_id}`**, không phải root `/api/v1`. Path đầy đủ dưới đây không thêm prefix lần nữa.
1. POST `/api/v1/sessions/{session_id}/media-uploads` metadata content_type/byte_length/original_filename, key A →201 upload_id.
2. PUT `/api/v1/sessions/{session_id}/media-uploads/{upload_id}/content` actual JPEG/PNG bytes, key B →200 uploaded, chưa là observation.
3. POST `/api/v1/sessions/{session_id}/media-uploads/{upload_id}/completion` `{confirm_uploaded:true}`, key C →201 normalized media.
4. POST `/api/v1/sessions/{session_id}/reports`, current If-Match và key D:
```json
{
  "kind": "citizen",
  "media_id": "media_normalized01",
  "fixture_photo_id": null,
  "segment_id": "segment_e27functional",
  "coordinate": [106.7009, 10.7769],
  "captured_at": "2026-10-30T10:00:00Z",
  "captured_sim_minute": 10,
  "vehicle_types": ["motorbike"],
  "description": "Quan sát từ vị trí đang an toàn"
}
```
5. 201 report.pending_review, chưa route permission/chưa điểm. Capture time không dùng received time thay thế.
6. Dispatcher đọc report.observation_candidates; POST review có decision/reason/mapped_segment_id/vehicle_types/condition và current If-Match.
7. 200 ReportReviewResult tách report accepted, observations, filled gaps và optional award. Conflict hoặc redundant vẫn có thể accepted nhưng không award.
8. Retry lost response giữ **cùng key và payload**, trả same award/transition. Không gửi key mới để “thử lại” một khoản thưởng.

## 4. Plan → Approve → Execute
1. Incident/review commit trigger planning job; GET job until completed or fail. Manual POST `/planning-jobs` cũng có captured revision.
2. GET `/plans/{id}`: projected route/assignment/ETA, dependency groups và POL reasons.
3. Với soft risk, POST `/plans/{id}/decisions` action_ids/approve/reason + If-Match. Approval không đổi revision và không đổi xe/ETA.
4. POST `/plans/{id}/executions` `{group_ids:[...]}` + **same current revision** và new execution key. Server rechecks latest plan/evidence/groups/full candidate.
5. 201 Execution.before_revision/after_revision + committed/excluded groups; refetch snapshot/previews. Chỉ metrics từ observed branch ở H được gọi kết quả.
6. Hard block/conflict/capacity không được bỏ qua dù approval tồn tại. Hub/defer đòi configured flag+physical provenance.

## 5. Stale precondition và retry
```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "REVISION_MISMATCH",
    "message": "Trạng thái đã thay đổi; tải lại và lập kế hoạch mới.",
    "details": [],
    "retryable": false,
    "current_revision": 8,
    "replacement_session_id": null
  },
  "meta": {"request_id":"request_example001","session_id":"session_example001","generation":0,"revision":8,"event_sequence":43}
}
```
HTTP412 không auto-apply lại proposal ở revision8. Refresh/replan là ý định mới. HTTP428 thiếu If-Match;409 reused-key/domain conflict không đồng nghĩa412.

## 6. Advance và results
- POST `/simulation/advances` target_sim_minute>now và<=H, key+If-Match →202 AdvanceJob.
- Poll job hoặc SSE advance_changed, read sameH results. Trong advancing, Execute bị409; paused render playback không mutate clock.
- `late_reduction_ratio:null` nghĩa N/A baseline0, không 0% improvement. `unfinished_count` luôn hiển thị. Calibration incomplete không được ẩn.

## 7. Reset
- POST `/resets` `{client_type:"native",confirm:true}` key+If-Match →201 replacement session+private dispatcher credential.
- Old clients nhận410 SESSION_RESET, chỉ replacement_session_id, cần invitation mới. Xóa old-generation queries/approvals; unsent report draft chỉ giữ để user review/relink.
- Mất body sau Set-Cookie: original owner hoặc **đúng recorded replacement owner credential của reset đó** với same key/request digest, valid Origin và old/new recorded CSRF được narrow replay sealed result tới expiry; không general old-session access. Browser partial-delivery test bắt buộc.

## Error UX completeness
400/422 giữ form và field reasons;401 rejoin;403/404 không lộ object owner;410 reset/expiry/cursor có đúng recovery;412 replan;413/415 sửa ảnh;429 hiển thị Retry-After;503 giữ committed state và accepted reports, không báo plan đã thực thi.
