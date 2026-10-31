import type { Permission, Role } from "@floodops/contracts";
import { accessReason, type AccessContext } from "../../shared/access";

export interface FeatureDestination { id: string; label: string; path: string; permission: Permission; role: Role }
const destinations: readonly FeatureDestination[] = [
  { id: "driver", label: "Việc của tôi", path: "driver", permission: "driver:self:read", role: "driver" },
  { id: "driver-report", label: "Báo cáo đường", path: "driver/report", permission: "reports:submit", role: "driver" },
  { id: "community", label: "Báo cáo của tôi", path: "community/reports", permission: "contributor:self:read", role: "contributor" },
  { id: "community-new", label: "Gửi báo cáo ảnh", path: "community/new", permission: "reports:submit", role: "contributor" },
  { id: "points", label: "Điểm mô phỏng", path: "community/points", permission: "contributor:self:read", role: "contributor" },
  { id: "map", label: "Điều phối", path: "dispatch/map", permission: "operations:read", role: "dispatcher" },
  { id: "plans", label: "Kế hoạch", path: "dispatch/plans", permission: "operations:read", role: "dispatcher" },
  { id: "review", label: "Review báo cáo", path: "dispatch/reports", permission: "reports:review", role: "dispatcher" },
  { id: "results", label: "Kết quả", path: "dispatch/results", permission: "results:read", role: "dispatcher" },
];
/** Data for the future Data Mode router; it does not perform navigation or grant authorization. */
export function capabilityDestinations(context: AccessContext): readonly FeatureDestination[] {
  return destinations.filter(item => !accessReason(context, item.permission, item.role));
}
