import { Camera, ClipboardCheck, Gauge, Map, Route, Truck, Users, type LucideIcon } from "lucide-react";
import dispatcherMap from "./assets/app-dispatcher-map.webp";
import locationPicker from "./assets/app-location-picker.webp";
import planProjected from "./assets/app-plan-projected.webp";
import results from "./assets/app-results.webp";

export interface Shot { src: string; alt: string; width: number; height: number }
const shot = (src: string, alt: string): Shot => ({ src, alt, width: 1800, height: 1125 });
export const SHOTS = {
  map: shot(dispatcherMap, "Màn hình điều phối FloodOps: bản đồ OpenStreetMap với các đoạn đường mô phỏng tô màu theo trạng thái."),
  picker: shot(locationPicker, "Biểu mẫu báo cáo FloodOps: chọn đường trên bản đồ, tên đường Hàm Nghi và đoạn mô phỏng seg_edge33 được điền sẵn."),
  plan: shot(planProjected, "Màn hình kế hoạch FloodOps: hành động dự kiến của planner xác định, nút Approve và Reject tách riêng."),
  results: shot(results, "Màn hình kết quả FloodOps: so sánh chỉ số giữa tuyến tĩnh và FloodOps, gắn nhãn Simulation result."),
};
export const PHONE_SHOT = { width: 474, height: 1024 };

export interface FlowStep { id: string; icon: LucideIcon; title: string; body: string; shot: Shot }
export const FLOW_STEPS: readonly FlowStep[] = [
  { id: "report", icon: Camera, title: "Nhận báo cáo hiện trường", shot: SHOTS.picker,
    body: "Tài xế và người dân gửi ảnh kèm vị trí. Chạm vào đường trên bản đồ hoặc dùng vị trí thiết bị." },
  { id: "impact", icon: Map, title: "Xem ảnh hưởng lên đường", shot: SHOTS.map,
    body: "Báo cáo đã duyệt đổi trạng thái từng đoạn đường theo loại xe. Bằng chứng hết hạn thì không còn được dùng." },
  { id: "plan", icon: Route, title: "Lập kế hoạch xác định", shot: SHOTS.plan,
    body: "Planner có giới hạn tìm phương án giao lại. Kết quả là kế hoạch dự kiến, chưa làm thay đổi vận hành." },
  { id: "result", icon: Gauge, title: "Duyệt, chạy và đo", shot: SHOTS.results,
    body: "Phê duyệt và thực thi là hai thao tác riêng. Kết quả so sánh tuyến tĩnh với FloodOps trên cùng dữ liệu." },
];

export interface Role { id: string; icon: LucideIcon; name: string; summary: string; abilities: readonly string[] }
export const ROLES: readonly Role[] = [
  { id: "dispatcher", icon: ClipboardCheck, name: "Điều phối viên", summary: "Giữ quyền quyết định. Mọi thay đổi vận hành đi qua tay điều phối viên.",
    abilities: ["Xem bản đồ theo từng loại xe", "Duyệt báo cáo và xử lý xung đột nguồn", "Lập, phê duyệt rồi thực thi kế hoạch"] },
  { id: "driver", icon: Truck, name: "Tài xế", summary: "Thấy việc của mình và báo nhanh tình trạng đường ngay trên đường đi.",
    abilities: ["Xem đơn được giao", "Báo cáo nhanh đoạn đường ngập", "Chỉ truy cập dữ liệu của riêng mình"] },
  { id: "contributor", icon: Users, name: "Người dân", summary: "Gửi ảnh và vị trí để bổ sung bằng chứng cho khu vực chưa có dữ liệu.",
    abilities: ["Gửi ảnh kèm vị trí trên bản đồ", "Theo dõi trạng thái báo cáo của mình", "Nhận điểm mô phỏng, không có giá trị tiền"] },
];
