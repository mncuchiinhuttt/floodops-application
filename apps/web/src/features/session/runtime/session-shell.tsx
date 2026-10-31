import { useEffect, useState } from "react";
import { Link, Outlet, useLocation, useNavigate, useParams } from "react-router";
import { RequestScope } from "@floodops/api-client";
import { Alert, AppShell, Button, cn, type ShellNavItem } from "@floodops/ui-web";
import { capabilityDestinations } from "../navigation";
import { shellIcon } from "./shell-icons";
import { useRuntime, useRuntimeSnapshot } from "../../../app/context";
import { followSession } from "./foreground";
import { failureText } from "../../../app/failure";
import { Settings } from "lucide-react";

/** One short word per destination so the 5-item bottom bar never truncates. */
const SHORT_LABELS: Record<string, string> = { driver: "Việc", "driver-report": "Báo cáo", community: "Của tôi", "community-new": "Gửi ảnh", points: "Điểm",
  "dispatch-report": "Gửi ảnh", map: "Điều phối", plans: "Kế hoạch", review: "Duyệt", results: "Kết quả" };
export function SessionShell() {
  const runtime = useRuntime(), state = useRuntimeSnapshot(), params = useParams(), navigate = useNavigate(), location = useLocation();
  const [visible, setVisible] = useState(document.visibilityState === "visible");
  const [streamMessage, setStreamMessage] = useState("Luồng cập nhật chưa kết nối.");
  const identity = state.identity, session = identity?.session;
  useEffect(() => {
    const changed = () => setVisible(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", changed); return () => document.removeEventListener("visibilitychange", changed);
  }, []);
  useEffect(() => {
    if (!identity || !visible || !state.online || state.eventsPaused || !runtime.eventMeta) return;
    const stream = new RequestScope(identity.session.session_id, identity.session.generation);
    const release = runtime.registerStream(stream); void followSession(runtime, stream, setStreamMessage);
    return () => { stream.cancel(); release(); };
  }, [runtime, state.epoch, state.online, state.eventsPaused, visible, identity?.participant.participant_id, session?.session_id, session?.generation]);
  if (!identity || identity.session.session_id !== params.sessionId) return <main className="mx-auto grid max-w-md gap-3 p-6"><Alert title="Cần ghép nối lại">Phiên hoặc capability đã đổi.</Alert><Link to="/">Ghép nối phiên</Link></main>;
  const context = runtime.context(), base = `/sessions/${session!.session_id}`;
  const destinations = capabilityDestinations(context);
  const active = (path: string) => location.pathname === `${base}/${path}` || location.pathname.startsWith(`${base}/${path}/`);
  const nav: ShellNavItem[] = [{ id: "session", label: "Phiên & quyền", shortLabel: "Phiên", href: `${base}/session`, icon: <Settings className="size-4 shrink-0" />, current: active("session") },
    ...destinations.map(item => ({ id: item.id, label: item.label, shortLabel: SHORT_LABELS[item.id], href: `${base}/${item.path}`, icon: shellIcon(item.id), current: active(item.path) }))];
  const clock = `Phút ${session!.sim_minute} / ${session!.horizon_minute}`;
  return <AppShell navLabel="Workspace được cấp quyền" nav={nav}
    renderLink={(item, props) => <Link to={item.href} {...props} />}
    brand={<><span aria-hidden="true" className="grid size-7 place-items-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">F</span>FloodOps</>}
    actions={<>
      <span className="inline-flex h-7 items-center rounded-full border bg-card px-2.5 text-xs font-medium tabular-nums">{clock}</span>
      <span className="inline-flex h-7 items-center rounded-full bg-secondary px-2.5 text-xs font-medium">Vai trò: {identity.participant.role}</span>
      <Button variant="ghost" onClick={() => { void runtime.refresh().then(() => runtime.queries.invalidateQueries({ queryKey: ["session"] })).catch(error => setStreamMessage(failureText(error))); }}>Làm mới phiên</Button>
    </>}
    sidebarFooter={<div className="grid gap-2">
      <div role="status" className={cn("leading-snug", !visible && "text-muted-foreground")}>{visible ? streamMessage : "Tạm dừng cập nhật khi ứng dụng ở nền."}</div>
      <Button variant="secondary" onClick={() => navigate(`${base}/session`)}>Quản lý phiên</Button></div>}>
    <div className="grid gap-4">
      {!state.online && <Alert title="Offline">Dữ liệu có thể cũ. Không xếp hàng thao tác vận hành.</Alert>}
      <div className="lg:hidden" role="status">{visible ? streamMessage : "Tạm dừng cập nhật khi ứng dụng ở nền."}</div>
      <Outlet key={`${session!.session_id}:${session!.generation}:${identity.participant.participant_id}:${state.epoch}`} />
    </div>
  </AppShell>;
}
