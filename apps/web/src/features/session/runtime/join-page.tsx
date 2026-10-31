import { Form, Link, redirect, useActionData, useNavigation, type ActionFunctionArgs } from "react-router";
import { ClaimInputSchema, CreateSessionInputSchema, IdSchema } from "@floodops/contracts";
import { ClipboardCheck, Truck, Users, type LucideIcon } from "lucide-react";
import { Alert, Button, Card, TextField } from "@floodops/ui-web";
import type { DemoRole, SessionCommands } from "./commands";
import { useRuntimeSnapshot } from "../../../app/context";
import { failureText } from "../../../app/failure";

const DEMO_ROLES: readonly { role: DemoRole; label: string; hint: string; icon: LucideIcon }[] = [
  { role: "dispatcher", label: "Log in as Dispatcher", hint: "Map, report review, planning, approve and execute.", icon: ClipboardCheck },
  { role: "driver", label: "Log in as Driver", hint: "Own orders and quick road reports.", icon: Truck },
  { role: "contributor", label: "Log in as Resident", hint: "Send photos with a map location.", icon: Users },
];
const demoRole = (value: unknown): DemoRole => value === "driver" || value === "contributor" ? value : "dispatcher";

export function joinAction(commands: SessionCommands) {
  return async ({ request }: ActionFunctionArgs) => {
    const data = await request.formData(), intent = data.get("intent");
    try {
      if (intent === "rejoin") return redirect(`/sessions/${IdSchema.parse(data.get("session_id"))}/session`);
      const identity = intent === "demo" ? await commands.demoLogin(demoRole(data.get("role")), request.signal) : intent === "retry" ? await commands.retryAdmission(request.signal) : intent === "claim" ?
        await commands.claim(ClaimInputSchema.parse({ session_id: data.get("session_id"), claim_token: data.get("claim_token"), client_type: "web" }), request.signal) :
        await commands.create(CreateSessionInputSchema.parse({ scenario_id: data.get("scenario_id"), scenario_version: data.get("scenario_version"), client_type: "web" }), request.signal);
      return redirect(`/sessions/${identity.session.session_id}`);
    } catch (error) { return { error: failureText(error), canRetryAdmission: commands.hasAdmission() }; }
  };
}
export function JoinPage() {
  const result = useActionData<{ error: string; canRetryAdmission: boolean }>();
  const pending = useNavigation().state !== "idle", state = useRuntimeSnapshot();
  const disabled = !state.online ? { disabled: true as const, disabledReason: "You are offline. Commands are not queued; reconnect and submit again." } : { disabled: false as const };
  const stack = "grid gap-4 [&>span]:flex [&_button]:w-full";
  return <main className="mx-auto grid min-h-dvh w-full max-w-4xl content-center gap-6 p-4 sm:p-6">
    <header className="grid gap-2">
      <h1 className="flex items-center gap-3 text-2xl font-semibold tracking-tight sm:text-3xl">
        <span aria-hidden="true" className="grid size-9 place-items-center rounded-xl bg-primary text-base font-bold text-primary-foreground">F</span>FloodOps</h1>
      <p className="font-medium">Simulation prototype</p>
      <p className="max-w-[65ch] text-muted-foreground">Pick a demo account to start a fresh synthetic session. Nothing here uses real data.</p>
    </header>
    {result && <Alert title="Request not completed" urgent>{result.error}</Alert>}
    {result?.canRetryAdmission && <Form method="post" className={stack}><Button name="intent" value="retry" type="submit" {...disabled} pending={pending}>Retry the prepared request</Button></Form>}
    <Card title="Demo accounts" description="One click creates a new session and signs you in with that role.">
      <Form method="post" className="grid gap-3 sm:grid-cols-3">
        <input type="hidden" name="intent" value="demo" />
        {DEMO_ROLES.map(item => <div key={item.role} className="grid content-start gap-2">
          <Button name="role" value={item.role} type="submit" variant={item.role === "dispatcher" ? "primary" : "secondary"} {...disabled} pending={pending}><item.icon className="size-4" aria-hidden="true" />{item.label}</Button>
          <p className="text-xs text-muted-foreground">{item.hint}</p></div>)}
      </Form>
    </Card>
    <details className="rounded-xl border bg-card p-4 sm:p-5">
      <summary className="cursor-pointer text-sm font-medium">Advanced: custom scenario, invitation code, reopen a session</summary>
      <div className="mt-4 grid items-start gap-4 md:grid-cols-2">
        <Card title="Create a session" description="A dispatcher opens a new simulated session on a registered scenario.">
          <Form method="post" autoComplete="off" className={stack}>
            <TextField label="Scenario ID" name="scenario_id" required /><TextField label="Scenario version" name="scenario_version" required />
            <Button name="intent" value="create" type="submit" {...disabled} pending={pending}>Create session</Button></Form></Card>
        <div className="grid gap-4">
          <Card title="Join with an invitation"><Form method="post" autoComplete="off" className={stack}>
            <TextField label="Session ID" name="session_id" required />
            <TextField label="Invitation code" name="claim_token" type="password" autoComplete="off" required />
            <Button variant="secondary" name="intent" value="claim" type="submit" {...disabled} pending={pending}>Join session</Button></Form></Card>
          <Card title="Reopen a session"><Form method="post" className={stack}><TextField label="Joined session ID" name="session_id" required />
            <Button variant="secondary" name="intent" value="rejoin" type="submit" {...disabled} pending={pending}>Reopen with the current cookie</Button></Form>
            {state.identity && <Link to={`/sessions/${state.identity.session.session_id}/session`}>Back to the current session</Link>}</Card>
        </div>
      </div>
    </details>
  </main>;
}
