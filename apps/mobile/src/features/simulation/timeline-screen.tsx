import { useState } from "react";
import { Text } from "react-native";
import { Alert, TextField } from "@floodops/ui-native";
import type { Event, SessionMeta, SimulationClock } from "@floodops/contracts";
import { accessReason, commandReason, sameSession, type MobileContext } from "../../shared/session-context";
import { CommandButton, ScreenFrame } from "../../shared/screen-frame";
export function TimelineScreen({ context, clock, clockSession, events, onAdvance, onReset, pending = false }: {
  context: MobileContext; clock: SimulationClock; clockSession: SessionMeta; events: readonly Event[]; pending?: boolean;
  onAdvance?: (target: number) => void; onReset?: () => void;
}) {
  const [amount, setAmount] = useState("");
  const [confirmReset, setConfirmReset] = useState<string | null>(null);
  const currentKey = `${context.session.session_id}:${context.session.generation}:${context.session.revision}:${context.participant.participant_id}`;
  const clockStale = !sameSession(clockSession, context.session) || clockSession.revision !== context.session.revision;
  const denied = accessReason(context, "session:read", ["dispatcher"]);
  const delta = Number(amount);
  const advanceReason = commandReason(context, "simulation:advance", ["dispatcher"]) ?? (clockStale ? "Refresh the clock for the current session." : clock.mode !== "paused" ? "An advance is already running."
    : !amount.trim() || !Number.isFinite(delta) || delta <= 0 || clock.now_minute + delta > clock.horizon_minute ? "Enter positive minutes within the simulation horizon."
    : !onAdvance ? "Clock adapter unavailable." : null);
  const resetReason = commandReason(context, "simulation:reset", ["dispatcher"]) ?? (!onReset ? "Reset adapter unavailable." : null);
  return <ScreenFrame title="Timeline and clock" context={context}>
    {denied ? <Alert title="Timeline unavailable">{denied}</Alert> : <>
      <Text>Simulation time: {clock.now_minute} / {clock.horizon_minute} min · {clock.mode}</Text>
      <Text>Playback speed changes presentation only. Operational commands require online server confirmation.</Text>
      <TextField label="Advance minutes" value={amount} onChangeText={setAmount} keyboardType="decimal-pad" />
      <CommandButton label="Advance simulation" reason={advanceReason} pending={pending} onPress={() => onAdvance?.(clock.now_minute + delta)} />
      <CommandButton label="Reset session" reason={resetReason} pending={pending} onPress={() => setConfirmReset(currentKey)} />
      {confirmReset === currentKey && <><Alert title="Confirm Reset">Reset invalidates capabilities, plans and commands. Local report drafts require explicit review and re-link.</Alert>
        <CommandButton label="Confirm Reset" reason={resetReason} pending={pending} onPress={() => { setConfirmReset(null); onReset?.(); }} />
        <CommandButton label="Cancel Reset" reason={null} onPress={() => setConfirmReset(null)} /></>}
      {events.filter(event => sameSession(context.session, event)).map(event => <Text key={event.event_id}>
        #{event.event_sequence} · {event.sim_minute} min · {event.actor} · {event.type} · {event.reason_code ?? ""}
      </Text>)}
    </>}
  </ScreenFrame>;
}
