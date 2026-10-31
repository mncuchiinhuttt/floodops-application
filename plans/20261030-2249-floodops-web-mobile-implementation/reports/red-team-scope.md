# Red-team review — Scope & Complexity

**Plan:** `plans/20261030-2249-floodops-web-mobile-implementation/`
**Phạm vi đọc:** `plan.md`, toàn bộ 12 phase, task manifest, coverage và các spec/contracts liên quan; đối chiếu PRD v0.3 §§5–8 và D01–D09. Giữ toàn bộ 34 US, P1/P2 và Expo mobile. Đây là review tài liệu, không phải bằng chứng ứng dụng chạy được.

**Kết luận:** Còn **2 finding High/P1** cần sửa trước khi dùng plan làm hợp đồng triển khai. Không có finding Critical được giữ lại.

## 1. [High/P1] Chuyển runnable Worker/config lên trước integration gate

**Evidence**
- [`plan.md`, Execution và ownership](../plan.md): trước fix, root composition/deployment thuộc phase12; phase chỉ complete khi có tests/smoke thực.
- [`phase-12`, Related code files và step1](../phase-12-cloudflare-eas-release.md): trước fix, phase12 mới sở hữu index.ts/wrangler/composition; phase12 phụ thuộc11.
- [`phase-04`, Related code files](../phase-04-session-runtime-security.md): trước fix chỉ tạo factory injected routers, không có local harness/config rõ.
- [`phase-09`](../phase-09-react-web-console.md) và [`phase-11`](../phase-11-verification-acceptance.md): phải kiểm built clients với actual local Worker trước khi12 unlock.
- [`deployment spec`](../specs/cloudflare-deployment.md) và [`task manifest`](../implementation-tasks.json): trước fix Worker config/entrypoint xuất hiện muộn hơn acceptance cần nó.

**Failure scenario / impact:** Khi hoàn tất features ở phase08 và bắt đầu phase09/10/11, entrypoint/config bắt buộc để chạy API/local Worker vẫn thuộc phase12 chưa được phép bắt đầu. Theo đúng task manifest, phase11 phải pass để unlock phase12 nhưng lại cần artifacts của phase12 để chạy. DAG JSON có thể không có vòng lặp, còn readiness dependency thực có vòng `11 → 12 → 11`; API Workerd checks sớm hơn cũng thiếu cấu hình được chỉ định. Giải quyết bằng mock backend hoặc một composition tạm thứ hai sẽ vi phạm acceptance actual Worker hoặc tạo kiến trúc kiểm thử khác production.

**Suggested fix:** Giao phase04 việc tạo runnable Worker entrypoint/SessionDO export, local Wrangler bindings và Workers Vitest configuration. Integration owner đăng ký feature routers khi phase05–08 land, dùng cùng composition cho local tests và release. Cập nhật `plan.md`, phase ownership và manifest đồng bộ; để phase12 chỉ còn remote provisioning/environment-specific config, deployment, EAS và rollback. Không unlock phase12 giả hoặc bỏ integration checks để lách vòng phụ thuộc.

**Acceptance cần bổ sung:** Trước khi unlock phase09/10, cùng entrypoint/config phải khởi động local Worker, xử lý JSON API request qua Hono tới actual DO và chạy được Workers-pool integration harness; không cần production credentials/deploy để đạt gate này.

**Confidence:** 0.99.

## 2. [High/P1] Cho route tool biểu diễn pickup tại hub đề xuất

**Evidence**
- PRD [US-33 và §7.1](../../../FloodOps/prd.md): đổi hub thật cho unpicked order có hàng tại hub đích, route ID do compute_route cấp.
- [`tool-contracts.json`, compute_route](../contracts/tool-contracts.json): trước fix chỉ nhận driver_id/origin_node_id/stop_ids, không có candidate pickup override.
- Cùng file, propose_assignment_change mới nhận pickup_hub_id nhưng yêu cầu route_id đã có.
- [`OpenAPI Stop/Driver/SessionSnapshot`](../contracts/openapi.json): trước fix stop node cố định và không có candidate pickup-stop contract.
- [`phase-06`](../phase-06-planning-safety-execution.md): route ID gắn snapshot/job/revision; full P1 hub change cần biểu diễn trước route.

**Failure scenario / impact:** Order O đang unpicked tại H1; H2 ở graph node khác có sẵn O và còn capacity. Model cần route thực sự pickup O tại H2 trước khi gọi `propose_assignment_change(...pickup_hub_id=H2, route_id=...)`. Nhưng `compute_route` chỉ tham chiếu stop hiện hành của O tại H1, không có input nào đổi pickup node sang H2 và không tool nào cấp candidate stop mới trước khi cần route ID. Vì vậy contract không biểu diễn được một hub change hợp lệ phổ biến: gate hoặc từ chối route còn pickup tại H1, hoặc implementation phải tự sửa route/stop ngoài contract đã dùng cho proposal/preview. Flags và availability checks không giải quyết được lỗ hổng route construction này.

**Suggested fix:** Chốt một candidate-stop contract chung cho tools/compiler: chẳng hạn `compute_route` nhận các pickup overrides `{order_id, pickup_hub_id}` rồi code tất định xây validated stops trước route search; hoặc công bố server-issued candidate stops cho các hub availability hợp lệ. `propose_assignment_change`, dry-run và Execute phải dùng cùng stop/route semantics, giữ route provenance/job/revision và không teleport hàng. Cập nhật tool schema, domain contract, phase06 và coverage cùng lần; không tắt US-33 để né contract.

**Acceptance cần bổ sung:** Positive behavioral test cho unpicked O đổi từ H1 sang H2 ở node khác: route/stop preview thực sự qua H2, Execute atomically cập nhật hub và pickup itinerary, movement pickup ở H2, original SLA giữ nguyên. Kèm negative case route vẫn pickup ở H1 bị từ chối, picked_up không đổi hub, hub thiếu stock/capacity bị block. Các test này cần đi qua tool → candidate compiler/gate → API → web/native plan presentation, không chỉ assert `pickup_hub_id` đổi trong DTO.

**Confidence:** 0.94.

## Giới hạn bằng chứng

Chỉ đọc và đối chiếu plan/PRD/contracts. Không chạy build, lint, formatter, tests hoặc application smoke; không sửa application code hay plan của integration owner. Các acceptance ở trên là đề xuất bổ sung vào plan, chưa được thực thi.
