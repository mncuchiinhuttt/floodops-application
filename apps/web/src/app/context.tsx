import { createContext, useContext, useSyncExternalStore, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import type { WebRuntime } from "./runtime";
const Context = createContext<WebRuntime | null>(null);
export function RuntimeProvider({ runtime, children }: { runtime: WebRuntime; children: ReactNode }) {
  return <Context value={runtime}><QueryClientProvider client={runtime.queries}>{children}</QueryClientProvider></Context>;
}
export function useRuntime(): WebRuntime {
  const runtime = useContext(Context); if (!runtime) throw new Error("Missing application runtime"); return runtime;
}
export function useRuntimeSnapshot() {
  const runtime = useRuntime(); return useSyncExternalStore(runtime.subscribe, runtime.snapshot, runtime.snapshot);
}
