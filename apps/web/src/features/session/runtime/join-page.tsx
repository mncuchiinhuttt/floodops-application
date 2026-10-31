import { Form, Link, redirect, useActionData, useNavigation, type ActionFunctionArgs } from "react-router";
import { ClaimInputSchema, CreateSessionInputSchema, IdSchema } from "@floodops/contracts";
import { Alert, Button, Card, TextField } from "@floodops/ui-web";
import type { SessionCommands } from "./commands";
import { useRuntimeSnapshot } from "../../../app/context";
import { failureText } from "../../../app/failure";

export function joinAction(commands: SessionCommands) {
  return async ({ request }: ActionFunctionArgs) => {
    const data = await request.formData(), intent = data.get("intent");
    try {
      if (intent === "rejoin") return redirect(`/sessions/${IdSchema.parse(data.get("session_id"))}/session`);
      const identity = intent === "retry" ? await commands.retryAdmission(request.signal) : intent === "claim" ?
        await commands.claim(ClaimInputSchema.parse({ session_id: data.get("session_id"), claim_token: data.get("claim_token"), client_type: "web" }), request.signal) :
        await commands.create(CreateSessionInputSchema.parse({ scenario_id: data.get("scenario_id"), scenario_version: data.get("scenario_version"), client_type: "web" }), request.signal);
      return redirect(`/sessions/${identity.session.session_id}`);
    } catch (error) { return { error: failureText(error), canRetryAdmission: commands.hasAdmission() }; }
  };
}
export function JoinPage() {
  const result = useActionData<{ error: string; canRetryAdmission: boolean }>();
  const pending = useNavigation().state !== "idle", state = useRuntimeSnapshot();
  const disabled = !state.online ? { disabled: true as const, disabledReason: "Đang offline. Không xếp hàng lệnh; kết nối rồi gửi lại rõ ràng." } : { disabled: false as const };
  const stack = "grid gap-4 [&>span]:flex [&_button]:w-full";
  return <main className="mx-auto grid min-h-dvh w-full max-w-4xl content-center gap-6 p-4 sm:p-6">
    <header className="grid gap-2">
      <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-primary text-base font-bold text-primary-foreground">F</span>FloodOps</h1>
      <p className="font-medium">Simulation · Tham gia bằng capability server cấp.</p>
      <p className="max-w-[65ch] text-muted-foreground">Session ID chỉ định phiên; mã ghép nối được nhập riêng và không nằm trên URL.</p>
    </header>
    {result && <Alert title="Không hoàn tất yêu cầu" urgent>{result.error}</Alert>}
    {result?.canRetryAdmission && <Form method="post" className={stack}><Button name="intent" value="retry" type="submit" {...disabled} pending={pending}>Thử lại cùng yêu cầu đã chuẩn bị</Button></Form>}
    <div className="grid items-start gap-4 md:grid-cols-2">
      <Card title="Tạo phiên" description="Dispatcher mở một phiên mô phỏng mới trên scenario đã đăng ký.">
        <Form method="post" autoComplete="off" className={stack}>
          <TextField label="Scenario ID" name="scenario_id" required /><TextField label="Scenario version" name="scenario_version" required />
          <Button name="intent" value="create" type="submit" {...disabled} pending={pending}>Tạo phiên</Button></Form></Card>
      <div className="grid gap-4">
        <Card title="Ghép nối"><Form method="post" autoComplete="off" className={stack}>
          <TextField label="Session ID để ghép nối" name="session_id" required />
          <TextField label="Mã ghép nối" name="claim_token" type="password" autoComplete="off" required />
          <Button variant="secondary" name="intent" value="claim" type="submit" {...disabled} pending={pending}>Ghép nối capability</Button></Form></Card>
        <Card title="Mở lại phiên"><Form method="post" className={stack}><TextField label="Session ID đã tham gia" name="session_id" required />
          <Button variant="secondary" name="intent" value="rejoin" type="submit" {...disabled} pending={pending}>Mở lại bằng cookie hiện có</Button></Form>
          {state.identity && <Link to={`/sessions/${state.identity.session.session_id}/session`}>Về phiên hiện tại</Link>}</Card>
      </div>
    </div>
  </main>;
}
