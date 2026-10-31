# Simulator, calibration, baseline và số đo

## Hai loại dataset không nhập nhằng
- **functional_fixture:** deterministic nhỏ để chứng minh T01–T15; incident aliases E17/E21/E27, ảnh synthetic/có quyền, time units tường minh, calibration incomplete nếu không có dữ liệu.
- **calibrated_evaluation:** geometry thực TP.HCM, travel/service/workload/capacity/TTL có nguồn, licence và independent holdout. Thiếu một essential parameter => incomplete, không claim D04 pass.
- 2 hub/5 drivers/30 orders là đề xuất cỡ mẫu cũ, không hard requirement. Không ép graph=25 nếu mất route/access.

## Scenario manifest bất biến
- scenario_id/version, T0/timezone Asia/Ho_Chi_Minh, region WGS84, network version/hash, data licence, parameter file hashes, source policy, event stream, horizon H, relevant_scope_pairs.
- Parameter bắt buộc value+unit+source_date+reference+geography/vehicle/time scope+measured/derived/assumed+method+uncertainty+tolerance.
- D04 registry: region, road geometry, one-way/turns, travel profiles, service distribution, demand/capacity vector, vehicle mix, hub cap/window/availability, SLA, defer limit, TTL, location tolerance, incidents and H.
- Missing essential values không lấy config tùy ý; functional demo hiện incomplete, calibrated run creation từ chối CALIBRATION_INCOMPLETE.
- Freeze bundle hash trước run. Edit dataset => version mới, chạy lại cả baseline/FloodOps; không sửa để đạt K1/K2.

## Clock và deterministic scheduling
- sim_minute tính phút hữu hạn từ T0; internal integer micro-minutes hoặc integer milliseconds deterministic, serialize number minute; không `Date.now()` trong reducer.
- Advance target>now, bounded≤H; process earliest event boundary, không nhảy bỏ closure/expiry/service event.
- Tại timestamp t: apply declared context/restrictions/accepted evidence theo sequence → expire now≥expiry → invalidate plans → Execute/edge-entry checks → movement/service completion có causal seq.
- Closure không bị bỏ qua vì order cùng timestamp. Có explicit priority và monotonically assigned event_sequence, causal constraints kiểm bundle loader.
- Playback speed chỉ đổi thời lượng trình bày, không travel/service/TTL/SLA/H hoặc metrics. Default paused, dispatcher manual advance luôn có.
- Playback view-only trên committed trace: play/pause/speed không gọi clock mutation. DO alarms không advance simulation. Dispatcher gọi explicit advance target bằng API; render có thể interpolate giữa committed event positions nhưng không tự quyết driver entry/delivery.
- API advance/reset có CAS+idempotency; cùng command từ hai device không nhân thời gian. App background không là clock authority. Không có continuous server playback mode phải “giữ sống” bằng app.
- Long advance chunk: process bounded events CPU budget; command tạo resumable advance job, progress SSE; all boundary events committed theo chunks, one time target frozen; không hứa giant step atomic qua nhiều DO turns. Public contract 202 job; clients không Execute khi advancing.

## Movement
- Driver ở node hoặc on_edge với entered_at/exit_at fixed từ travel profile. Trước edge entry kiểm restriction/knowledge+vehicle+authorization lại.
- Closure tới khi đã on_edge: hoàn tất edge đã vào hợp lệ theo locked duration, log in_progress_at_change. Không reverse/teleport hoặc thêm entry trái phép.
- At pickup cập nhật carrying_order_ids+load+lifecycle atomic; at destination cập nhật delivered_at theo sim minute, release load. Service time là event, không lập tức giao.
- Route invalid tại edge tiếp theo => waiting, ETA null, replan. Chỉ carrying driver deliver picked_up order.

## Branch comparison
- Baseline và FloodOps có state độc lập, cùng shared event/knowledge/review outcome, physics, time và H. Award xử lý một lần trên shared reporting stream.
- Static baseline giữ driver/hub/visit order/route; waits nếu route closed/impassable hoặc unknown cần approval chưa có. Không cho baseline xuyên nước để làm FloodOps có lợi.
- P2 reroute_only tự reroute từng xe với cùng gate/approval/physics, không phối hợp assignment/hub/priority. Label đúng, không benchmark app thương mại.
- Planning/report review wall latency được log riêng. Nếu sim time advance khi request pending thì stale request bị bỏ; không cho nhánh này hưởng “thời gian miễn phí”.

## Six observed metrics tại H
| Key | Cách tính |
|---|---|
| critical_late | distinct critical delivered_at>SLA hoặc unfinished và H>SLA |
| total_late | mọi order cùng rule |
| total_delay_minutes | sum max(0, (delivered_at hoặc H)-original_SLA) |
| blocked_route_attempts | distinct attempt_id rejected blocked-road, breakdown proposal/movement; executed_violation riêng phải 0 |
| orders_reassigned | distinct order ID đã committed driver change sau incident |
| updated_eta_previews | distinct order ID có preview từ committed ETA mới; không đếm notification gửi thật |
- Kèm unfinished_count, unreachable_count, sim horizon, scenario/config hash, calibration status, branch label.
- Projected objectives/ETAs trước execute khác metrics observed tới H. Ratio reduction baseline=0 => null/N/A, raw count vẫn hiện.
- K1=critical late target 0; K2 target half baseline chỉ đánh giá, không ràng buộc fit data. Báo không đạt.
- K3 luôn I1–I5; K4 nearest rank p95 với 10 mẫu = max, accepted-report tới displayed plan≤10s; demo≤150s, 9/10 không can thiệp ngoài UI. Review delay riêng.
- K5 prompt log>=10 entries đề xuất. K6 functional report đổi ít nhất một ETA với evidence trace, không buộc mọi report cải thiện.

## D04 nghiệm thu
1. Chọn vùng/kỳ dữ liệu và người xác nhận nguồn; ghi licence snapshot map/routing/operational samples.
2. Tính length polyline, map matching/turn restriction; independent measurement holdout kiểm scale và distance.
3. Fit travel/service/load bằng training subset, chốt tolerance trước holdout.
4. Kiểm kg/volume/capacity mọi pickup/drop; ghi unknown dimensions, không đổi đơn tất cả=1.
5. Kiểm clock/playback, TTL/position tolerance có căn cứ, không default multiplier ×3/×1.5 tùy ý.
6. Báo per-parameter residual/sample size/geography và pass/fail; thiếu dataset là prerequisite có owner, không model-generated data thay thế.
- UI/plan implement được trước, **không release “D04 đạt”** tới khi test T14 có nguồn thực. Không đòi token nguồn riêng để viết simulator.
