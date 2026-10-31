import { useEffect, useState } from "react";
import { Link, Outlet, useNavigate, useParams } from "react-router";
import { RequestScope } from "@floodops/api-client";
import { Alert, Button } from "@floodops/ui-web";
import { capabilityDestinations } from "../navigation";
import { SimulationBanner } from "../../../shared/feature-state";
import { useRuntime, useRuntimeSnapshot } from "../../../app/context";
import { followSession } from "./foreground";
import { failureText } from "../../../app/failure";

export function SessionShell() {
  const runtime = useRuntime(), state = useRuntimeSnapshot(), params = useParams(), navigate = useNavigate();
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
  if (!identity || identity.session.session_id !== params.sessionId) return <main><Alert title="Cần ghép nối lại">Phiên hoặc capability đã đổi.</Alert><Link to="/">Ghép nối phiên</Link></main>;
  const context = runtime.context();
  const destinations = capabilityDestinations(context);
  return <><header className="app-header"><Link to="/">FloodOps</Link><span>Vai trò: {identity.participant.role}</span>
    <nav aria-label="Workspace được cấp quyền"><Link to={`/sessions/${session!.session_id}/session`}>Phiên & quyền</Link>
      {destinations.map(item => <Link key={item.id} to={`/sessions/${session!.session_id}/${item.path}`}>{item.label}</Link>)}</nav></header>
    <SimulationBanner session={identity.session} />
    {!state.online && <Alert title="Offline">Dữ liệu có thể cũ. Không xếp hàng thao tác vận hành.</Alert>}
    <div className="stream-status" role="status">{visible ? streamMessage : "Tạm dừng cập nhật khi ứng dụng ở nền."}</div>
    <Button variant="secondary" onClick={() => { void runtime.refresh().then(() => runtime.queries.invalidateQueries({ queryKey: ["session"] })).catch(error => setStreamMessage(failureText(error))); }}>Làm mới phiên</Button>
    <Button variant="secondary" onClick={() => navigate(`/sessions/${session!.session_id}/session`)}>Quản lý phiên</Button>
    <Outlet key={`${session!.session_id}:${session!.generation}:${identity.participant.participant_id}:${state.epoch}`} /></>;
}
