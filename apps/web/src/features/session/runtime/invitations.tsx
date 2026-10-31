import { useId, useState } from "react";
import { InviteInputSchema, type Invite, type ParticipantList } from "@floodops/contracts";
import { Alert, Button, Card, Form, SelectField, TextField } from "@floodops/ui-web";
import { useCommand } from "../../../shared/use-command";
import type { SessionCommands } from "./commands";
import { useRuntime } from "../../../app/context";
import { accessReason } from "../../../shared/access";

export function Invitations({ commands, participants }: { commands: SessionCommands; participants?: ParticipantList }) {
  const runtime = useRuntime(), context = runtime.context(), prefix = useId();
  const [role, setRole] = useState("driver"), [entity, setEntity] = useState(""), [invite, setInvite] = useState<Invite | null>(null), [error, setError] = useState("");
  const [showToken, setShowToken] = useState(false);
  const command = useCommand(`${context.identity.session.session_id}:${context.identity.session.generation}:${context.identity.participant.participant_id}`);
  const blocked = accessReason(context, "participants:invite", "dispatcher", true);
  const options = [{ value: "driver", label: "Driver" }, { value: "contributor", label: "Contributor" }, { value: "viewer", label: "Viewer" },
    ...(context.identity.participant.permissions.includes("manage_dispatchers") ? [{ value: "dispatcher", label: "Dispatcher" }] : [])];
  return <Card title="Ghép nối thành viên" description="Vai trò được đóng vào invitation server; người nhận không tự chọn thêm quyền.">
    <Form aria-label="Tạo invitation" onSubmit={() => {
      const body = InviteInputSchema.safeParse({ role, bound_entity_id: ["driver", "contributor"].includes(role) ? entity.trim() || null : null, expires_in_seconds: 300 });
      if (!body.success || (["driver", "contributor"].includes(role) && !entity.trim())) { setError("Nhập binding entity hợp lệ cho driver/contributor."); return; }
      setError(""); setInvite(null); setShowToken(false); void command.run(async () => {
        const result = await commands.invite(body.data); setInvite(result.body.data); await runtime.refresh();
      });
    }}><SelectField label="Vai trò invitation" value={role} onValueChange={setRole} options={options} />
      <TextField id={`${prefix}-entity`} label="Entity ID được phép trong scenario" value={entity} onChange={event => setEntity(event.target.value)} />
      <Button type="submit" pending={command.pending} {...(blocked ? { disabled: true, disabledReason: blocked } : { disabled: false })}>Tạo invitation</Button>
    </Form>{error && <Alert title="Kiểm tra invitation">{error}</Alert>}{command.message && <Alert title="Trạng thái invitation">{command.message}</Alert>}
    {invite && <section><p>Invitation {invite.role} · Hết hạn {invite.expires_at}</p><TextField label="Mã dùng một lần" type={showToken ? "text" : "password"} value={invite.claim_token} readOnly autoComplete="off" />
      <Button variant="secondary" onClick={() => setShowToken(value => !value)}>{showToken ? "Ẩn mã" : "Hiện mã để ghép nối"}</Button>
      <p>Chỉ đưa mã cho đúng người nhận. Mã không có trong link hoặc cache đọc.</p></section>}
    {participants && <ul>{participants.items.map(participant => <li key={participant.participant_id}>{participant.role} · {participant.bound_entity_id ?? "Không binding entity"} · {participant.is_owner ? "Owner" : "Thành viên"}
      {participant.participant_id !== context.identity.participant.participant_id && <Button variant="danger" pending={command.pending}
        {...(!context.online || !context.identity.participant.permissions.includes("participants:revoke") ? { disabled: true, disabledReason: "Cần online và quyền thu hồi." } : { disabled: false })}
        onClick={() => void command.run(async () => { await commands.revoke(participant.participant_id); await runtime.refresh(); await runtime.queries.invalidateQueries({ queryKey: ["session"] }); })}>Thu hồi capability</Button>}
    </li>)}</ul>}
  </Card>;
}
