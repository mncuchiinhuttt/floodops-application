import { useState } from "react";
import { useNavigate } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { Alert, Button, Card } from "@floodops/ui-web";
import { useRuntime } from "../../../app/context";
import { readOptions } from "../../../app/queries";
import { failureText } from "../../../app/failure";
import { useCommand } from "../../../shared/use-command";
import type { SessionCommands } from "./commands";
import { Invitations } from "./invitations";

export function SessionPage({ commands }: { commands: SessionCommands }) {
  const runtime = useRuntime(), context = runtime.context(), navigate = useNavigate(), { session, participant } = context.identity;
  const [confirm, setConfirm] = useState(false);
  const command = useCommand(`${session.session_id}:${session.generation}:${participant.participant_id}`);
  const members = useQuery({ ...readOptions(runtime, "listParticipants", "session:read", "dispatcher", { path: { session_id: session.session_id } }), enabled: participant.role === "dispatcher" });
  const block = !context.online ? "Đang offline. Không xếp hàng lệnh." : !confirm ? "Xác nhận trước khi đổi trạng thái phiên." : null;
  const disabled = (permission: string) => block || !participant.permissions.some(value => value === permission)
    ? { disabled: true as const, disabledReason: block ?? "Capability không cấp quyền này." } : { disabled: false as const };
  return <div className="grid min-w-0 gap-4"><h1>Phiên của bạn</h1><Card title="Trạng thái server"><dl>
    <dt>Session ID</dt><dd>{session.session_id}</dd><dt>Generation</dt><dd>{session.generation}</dd><dt>Revision</dt><dd>{session.revision}</dd>
    <dt>Vai trò</dt><dd>{participant.role}</dd><dt>Entity</dt><dd>{participant.bound_entity_id ?? "Không binding entity"}</dd>
    <dt>Trạng thái</dt><dd>{session.status}</dd><dt>Scenario</dt><dd>{session.scenario_id} / {session.scenario_version}</dd>
  </dl><p>Phiên tạo và quyền được đọc từ backend. Dữ liệu vận hành chỉ hiện khi API tương ứng đã cung cấp.</p></Card>
    {participant.role === "dispatcher" && <>{members.isError && <Alert title="Không đọc được thành viên">{failureText(members.error)}</Alert>}
      <Invitations commands={commands} participants={members.data?.body.data} /></>}
    <Card title="Vòng đời phiên"><label><input type="checkbox" checked={confirm} onChange={event => setConfirm(event.target.checked)} /> Tôi đã xem lại thao tác thay đổi phiên</label>
      <div className="feature-actions"><Button {...(!context.online ? { disabled: true, disabledReason: "Đang offline. Kết nối để đăng xuất server." } : { disabled: false })} pending={command.pending}
        onClick={() => void command.run(async () => { await commands.logout(); navigate("/"); })}>Đăng xuất</Button>
      <Button {...disabled("simulation:reset")} pending={command.pending} onClick={() => void command.run(async () => { const next = await commands.reset(); navigate(`/sessions/${next.session.session_id}/session`); })}>Reset sang phiên mới</Button>
      <Button {...disabled("session:delete")} variant="danger" pending={command.pending} onClick={() => void command.run(async () => { await commands.remove(); navigate("/"); })}>Đóng phiên</Button></div>
      {command.message && <Alert title="Kết quả lệnh">{command.message}</Alert>}
    </Card>
  </div>;
}
