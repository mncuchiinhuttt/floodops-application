import { useRef, useState } from "react";
import { useNativeRuntime } from "../../features/session/runtime/native-runtime";
import { clientFailure } from "../client-failure";
export function useNativeCommand() {
  const runtime = useNativeRuntime(); const [pending, setPending] = useState(false), [error, setError] = useState<string | null>(null);
  const lock = useRef(false); const current = useRef(runtime.context); current.current = runtime.context;
  async function run(action: () => Promise<unknown>) {
    if (lock.current || !runtime.context?.online) return;
    const principal = runtime.context.participant.participant_id; lock.current = true; setPending(true); setError(null);
    try { await action(); if (current.current?.participant.participant_id === principal) await runtime.refresh(); }
    catch (cause) { if (current.current?.participant.participant_id === principal) setError(clientFailure(cause).message); }
    finally { lock.current = false; setPending(false); }
  }
  return { pending, error, run };
}
