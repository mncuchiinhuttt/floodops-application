# Quy tắc nghiệp vụ và chuyển trạng thái

## Nguồn
[PRD §6–8](../../../FloodOps/prd.md) và [OpenAPI](../contracts/openapi.json) là chuẩn scope/wire. Tất cả tính năng bật, kể cả P1/P2, giữ I1–I5; không “cắt safety” vì thiếu dữ liệu.

## POL-01…POL-08
| Rule | Input/guard | Result/side effect |
|---|---|---|
| POL-01 | Active authoritative closure hoặc effective impassable đúng vehicle tại edge entry | BLOCKED, không override; attempt_id distinct, movement vẫn waiting |
| POL-02 | Ordinary unknown/low-confidence, không conflict/hard fail | Pending approval đúng action+plan+input revision; approved vẫn giữ uncertainty UI |
| POL-03 | Expired evidence hoặc revision stale | Needs replan; unresolved conflict => blocked tới review, không chữa bằng replan |
| POL-04 | Vehicle/turn restriction, total load, picked-up custody, hub availability/cap fail | Block group và dependent groups; combined candidate reject nếu inconsistent |
| POL-05 | Đổi tier/defer critical hoặc objective xấu hơn | Reject toàn execution candidate; immutable original SLA/tier |
| POL-06 | Defer nonstandard, cumulative overflow hoặc missing configured limit | Disabled/blocked; original SLA không thay đổi |
| POL-07 | Notification/ETA dùng proposal chưa commit | Không ghi committed preview; chỉ projected label cho preview proposal |
| POL-08 | Fresh evidence + valid group + no soft risk | Ready; đợi dispatcher Execute, không tự background execution |

## Objective và route feasibility
- Lexicographic tuple đúng thứ tự: critical unreachable, critical late count, critical delay tới H, food late count, total late count, total delay tới H, total unreachable.
- Compare current vs candidate projected từ **cùng snapshot/clock/physics/H**. Không weight-sum hoặc ưu tiên standard vì gain tổng nhiều hơn critical.
- Waiting/no-route: ETA null, unreachable; projected delay=max(0,H-SLA), late iff H>SLA. Có predicted completion: cap delay tới H theo PRD §7.3; chưa phải metric thực.
- Deterministic route: directed graph, vehicle/turn access; trạng thái mở rộng (node, incoming edge) để không bỏ turn restrictions. Dijkstra/earliest-arrival cho profile FIFO đã validate; profile non-FIFO từ chối chứ không tự áp công thức sai.
- Stop order greedy insertion theo tier rồi lateness/ID deterministic, không hứa global optimum VRP. Chọn candidate qua cùng gate; no viable candidate vẫn kết quả hợp lệ “waiting/no_route”, không fabricate route.
- Capacity kiểm vector đầy đủ tại mọi pickup/drop stop, không chỉ total cuối route; kg/volume/equivalent units có provenance.
- unpicked mới đổi driver/hub. picked_up giữ driver đang chở, reroute thôi. delivered không sửa để đẹp KPI.

## Proposal / approval / execution
1. Replan capture immutable session+generation+revision, compute tools read-only; tạo Plan/Route IDs server-side.
2. Action có dependency_group_id và depends_on; reject vòng lặp/missing dependency/cross-plan refs.
3. Approve/Reject chỉ lưu decision, không tăng operational revision. Role dispatcher; không tự approve bằng LLM/tool/client role.
4. Execute/Dry-run kiểm trong cùng transaction `requested_plan_id == latest_plan_id` và `plan.planning_job_id == latest_requested_job_id`; không chỉ so revision. Job mới ở cùng revision đánh dấu plan cũ needs_replan ngay khi request accepted, approvals cũ không còn dùng. New-key request tới plan cũ =>409 STALE_PROPOSAL; exact replay của execution đã commit vẫn ưu tiên trả cached outcome.
5. Execute client gửi group IDs, If-Match; server tính dependency closure và eligible groups, không tin client “ready”. Guard latest identity áp dụng lại ngay trước commit, kể cả Ready plan không cần Approve.
6. Group pending/rejected/blocked không chạy. Các group độc lập đủ điều kiện vẫn có thể chạy nếu toàn resulting state valid, còn lại waiting/ETA null.
7. Recompute combined candidate: route, evidence at now, approval exact, load, hub stock, objective; fail => zero operational mutation.
8. Commit assignment+route+ETA+previews+timeline+idempotency/outbox atomic. Cập nhật revision một lần cho command.
9. Mọi revision change invalidate mọi unexecuted proposal/approval. Committed route không tự bị xóa bởi revision unrelated, nhưng edge entry recheck.
10. Duplicate Execute retry cùng key trả execution cũ, không tăng counter/revision; different key cùng stale If-Match trả 412.

## Knowledge và evidence
- Input context (mưa/triều/discharge/weather) không là passability, không cấp quyền đóng/mở đường; unit/datum/forecast độc lập.
- Report pending_review; authoritative restriction riêng, source được cấu hình authority mới tạo closure/reopen.
- Accepted observation current iff source valid, segment/vehicle đúng, epoch đúng, observed_at≤now<expires_at.
- New road incident tăng epoch; observation epoch cũ không revive khi report mới expired. Không reset road về normal từ initial geometry.
- Hai observations current khác condition => unresolved conflict **bất kể camera/sensor/driver**. Review chỉ định superseded evidence và reason; mới hơn không tự thắng.
- Không conflict: high trước low, observed_at mới hơn, observation_id tie-break. Accepted driver/community vẫn low trừ policy có căn cứ, không LLM tự nâng.
- Ordinary unknown có thể approve soft risk. Unresolved conflict không được approve-route bypass; cần evidence review trước.
- Review acceptance/resolution thay knowledge tăng revision, còn reject/audit thuần không tăng; nếu reject làm observation accepted mất hiệu lực thì là knowledge mutation tăng revision.

## Report, gap, reward
- Accepted ≠ rewarded ≠ route approved. Useful coverage accepted/fresh/epoch+vehicle đúng/nonunknown/no-conflict, **low vẫn covered** nhưng route cần approval.
- Gap relevant segment+vehicle missing coverage; relevance scope frozen; reopen sinh occurrence ID mới.
- Collect/update hoặc report tự do: review acceptance/resolution xem gap open ngay trước transition, validate freshness/hash/vehicle, tạo observations, fill gaps, tối đa một first-fill award/gap occurrence. AM-C01 verify là explicit mission/slot/evidence hữu ích, có thể award mà không tạo gap fill giả.
- [AM-C01](contributor-campaigns.md) là target policy sau contract cutover, không endpoint đã có: report thuộc tối đa một mission/campaign/region, tối đa một award/report và một eligible completion/participant/mission occurrence. Completion/award/budget/ranking contribution/snapshot/event atomic; discovery-gap uniqueness tách verification-completion uniqueness.
- Cùng hash ảnh normalized qua participant khác trong session => DUPLICATE_IMAGE, không duplicate points; hash scope server-side, không tin supplied client hash.
- Camera/system source không được thưởng; redundant ngoài verify task đủ điều kiện lưu history với 0 point. Same conclusion hoặc account ID khác không tự chứng minh verification độc lập; conflict vẫn qua review.
- Campaign có authorized lifecycle/config guard; S-F do server/người có quyền gán với reason/version theo data urgency/impact. Reward policy pin khi nhận report hoàn chỉnh; đổi cấp sau đó không tự hạ thưởng report đã nhận. Điểm/ngưỡng/capacity/budget phải cấu hình hợp lệ, không mặc định một lịch điểm.
- Verification slots theo stable receipt sequence trong các submission cuối cùng đủ điều kiện; không theo review click, incomplete upload không giữ slot. Chờ earlier pending trước chốt last slot; review timeout/escalation policy phải có trước publish, overdue không tự thành fail hoặc free slot.
- Regional rank từ committed awards đúng campaign/region; bằng điểm đồng hạng, projection alias-only. Catalog/tie/inventory/budget phải rõ trước publish; pending review không final rank/benefit.
- Expiry sau award hợp lệ không clawback points; Reset xóa campaign runtime/completions/ledger/ranking/simulated benefits phiên mới. Demo voucher/gift entitlement là Simulated, không tiền thật hoặc route permissions đổi từ điểm.
- Không khuyến khích đi vào nước/nguy hiểm; chỉ báo cáo từ vị trí đang an toàn.

## Error semantics
- malformed/unknown property 400; invalid state/schema semantic 422; forbidden role/resource 403/404; hard policy vi phạm 422 POLICY_BLOCKED; revision stale 412; group conflict/in-flight/reset 409; missing precondition 428; unavailable config 422 CONFIG_INCOMPLETE; expiry capability 401/410 session.
- Mọi refusal có reason code+rule_id+safe details, không lộ raw model prompt/key.
- I1–I5 map test trong [testing-strategy.md](testing-strategy.md); functional fixtures không là calibration evidence.
