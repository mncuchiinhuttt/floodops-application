import type { ReactNode } from "react";
import type { SessionMeta, ProvenanceLabel } from "@floodops/contracts";
import { Alert, Skeleton } from "@floodops/ui-web";

export type Resource<T> = { status: "loading" } | { status: "error"; message: string } |
  { status: "stale" } | { status: "ready"; data: T };
export function ResourceView<T>({ resource, children }: { resource: Resource<T>; children: (data: T) => ReactNode }) {
  if (resource.status === "loading") return <Skeleton label="Đang tải dữ liệu phiên" />;
  if (resource.status === "error") return <Alert title="Không tải được dữ liệu">{resource.message}</Alert>;
  if (resource.status === "stale") return <Alert title="Dữ liệu cũ">Làm mới phiên trước khi tiếp tục.</Alert>;
  return <>{children(resource.data)}</>;
}
export function SimulationBanner({ session, provenance }: { session: SessionMeta; provenance?: ProvenanceLabel }) {
  return <aside className="simulation-banner" aria-label="Ngữ cảnh mô phỏng">
    <strong>Simulation</strong> · Nguồn: {provenance ?? "Chưa có metadata nguồn"} · Phút {session.sim_minute} · Revision {session.revision}
    <p>{session.calibration_status === "incomplete" ? "Calibration incomplete" : `Calibration: ${session.calibration_status}`}</p>
  </aside>;
}
export function Denied({ reason }: { reason: string }) { return <Alert title="Không thể mở workspace">{reason}</Alert>; }
export function etaLabel(value: number | null): string { return value === null ? "Đang chờ — ETA chưa có" : `Phút ${value}`; }
