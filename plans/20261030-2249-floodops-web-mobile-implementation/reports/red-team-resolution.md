# Red-team adjudication và validation decisions

## Phạm vi
Review4 lens độc lập trên **plan**, không source ứng dụng: Security, Failure Modes, Compatibility, Scope. Bản review ban đầu là lịch sử phát hiện; bảng dưới là disposition cuối sau integration và narrow recheck.

## Findings deduplicated
| ID | Finding | Severity | Disposition | Applied / planned proof |
|---|---|---|---|---|
| R01 | Execute planA đã bị jobB thay thế dù revision bằng nhau | High | Accept, resolved | policy-rules transaction latest IDs; OpenAPI approve/dry-run/execute; same-revision tests |
| R02 | Reset body lost sau replacement Set-Cookie khiến owner stranded | High | Accept, resolved | exact old-or-replacement credential+same-key/digest+Origin/CSRF; headers-only browser acceptance |
| R03 | Advance crash giữ advancing lock vô hạn | High | Accept, resolved | persisted lease/checkpoint, watchdog fail/unlock no time change, new explicit CAS continuation, old nonce fencing |
| R04 | Reset deployment recipe không khóa old DO trước await | High | Accept, resolved | persisted resetting intent/fixed target first, idempotent remote init/tombstone/replay; concurrent old mutation denied |
| R05 | Media endpoint paths unscoped lệch OpenAPI | High | Accept, resolved | deployment/research/usage reserve→PUT→complete→read session-scoped, cross-session denial tests |
| R06 | Local Worker/config chỉ tồn tại phase12 nhưng acceptance phase11 đòi trước | High | Accept, resolved | harness04, full API composition08, combined config11, deploy12; manifest/ownership updated |
| R07 | compute_route không biểu diễn pickup hub mới trước route ID | High | Accept, resolved | candidate stop refs+assignment overrides, route context hash; E-HUB-01 actual pickup at new hub across tool/gate/movement/clients |

7 unique High accepted,0 Critical,0 rejected. Reset delivery finding xuất hiện ở2 lens nhưng tính1. Compatibility0 remaining high: pairing dispatcher và fixture discovery/read API được bổ sung trong integration trước verdict cuối.

## Source reports
- [Security](red-team-security.md):3 original findings; final narrow reply xác nhận cả3 closed.
- [Failure modes](red-team-failure-modes.md):3 original findings; final narrow reply cả3 resolved.
- [Scope](red-team-scope.md):2 original findings; final narrow reply cả2 resolved.
- [Compatibility](red-team-compatibility.md):0 remaining critical/high.

## Plan-validation choices
- Không hỏi lại stack user đã chốt hoặc biến lack-of-data thành architecture preference. Kế hoạch ghi decisions/proposals và external data/licence/account gates tách biệt.
- Không silently bỏ P1/P2/mobile: full scope có test/error/UI/API path. Web và native shared contracts/design semantics, không shared DOM.
- Native image/vector/SSE được kiểm với docs chính thức; actual device/binary behavior vẫn cần phase10–11 evidence.
- User yêu cầu không chia thời gian; không có effort estimates/duration work allocation trong plan/manifest. Protocol timeout/TTL là behavior configuration, không work schedule.
- Build/runtime/storage/account changes chưa thực hiện. D04, model, Images entitlement, Cloudflare/EAS credentials và calibration holdout không được ghi thành đã đạt.
