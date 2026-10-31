import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { RequestScope, watchEvents } from "@floodops/api-client";
import { fetch as expoFetch } from "expo/fetch";
import Constants from "expo-constants";
import type { Event, Identity, SessionCreated } from "@floodops/contracts";
import { createNativeApi, NativeSessionClient } from "../../../shared/native-client";
import type { MobileContext } from "../../../shared/session-context";
import { clientFailure } from "../../../shared/client-failure";
import { createSecureVault } from "../../../shared/native/secure-store";
import { nativeKey } from "../../../shared/native/random-key";
import { useNativeAvailability } from "../../../shared/native/availability";
import { NativeSessionService } from "./session-service";
interface Runtime {
  getContext(): MobileContext | null; lastEvent: Event | null; context: MobileContext | null; service: NativeSessionService; client: NativeSessionClient | null;
  online: boolean; busy: boolean; error: string | null; connection: string; refresh(): Promise<void>;
  join(action: () => Promise<Identity>): Promise<void>; leave(): Promise<void>; stageReplacement(value: SessionCreated): Promise<void>;
}
const RuntimeContext = createContext<Runtime | null>(null);
export function NativeRuntimeProvider({ children }: { children: ReactNode }) {
  const [cache] = useState(() => new QueryClient({ defaultOptions: { queries: { retry: false, staleTime: 0, gcTime: 120_000 } } }));
  const [vault] = useState(createSecureVault);
  const [service] = useState(() => new NativeSessionService(createNativeApi(String(Constants.expoConfig?.extra?.apiBaseUrl ?? "http://127.0.0.1:8790/api/v1"), vault, expoFetch), vault, nativeKey));
  const [identity, setIdentity] = useState<Identity | null>(null);
  const [busy, setBusy] = useState(false), [error, setError] = useState<string | null>(null), [connection, setConnection] = useState("Disconnected");
  const [tick, setTick] = useState(0);
  const [validatedOnline, setValidatedOnline] = useState(false);
  const [lastEvent, setLastEvent] = useState<Event | null>(null);
  const clientRef = useRef<NativeSessionClient | null>(null);
  const contextRef = useRef<MobileContext | null>(null);
  const identityRef = useRef(identity); identityRef.current = identity;
  const epoch = useRef(0), joining = useRef(false), stream = useRef<RequestScope | null>(null);
  const availability = useNativeAvailability();
  const clearView = useCallback(() => {
    epoch.current++; stream.current?.cancel(); clientRef.current?.invalidate(); contextRef.current = null; service.cancelPending();
    const previous = identityRef.current; if (previous) service.api.cancelSession(previous.session.session_id);
    identityRef.current = null; setIdentity(null); setLastEvent(null); setValidatedOnline(false); void cache.cancelQueries(); cache.clear();
  }, [cache, service]);
  const refresh = useCallback(async () => {
    const current = identityRef.current; if (!current) return;
    const ticket = epoch.current;
    try {
      const next = await service.identity(current.session.session_id, current.session.generation);
      if (ticket === epoch.current && next.participant.participant_id === current.participant.participant_id) { clientRef.current?.acknowledgeRefresh(next.session); setIdentity(next); setValidatedOnline(true); setError(null); await cache.invalidateQueries({ queryKey: ["native", current.session.session_id, current.session.generation, current.participant.participant_id] }); }
    } catch (cause) { if (ticket === epoch.current) { const failure = clientFailure(cause); setError(failure.message); if (failure.next === "rejoin") clearView(); } throw cause; }
  }, [cache, clearView, service]);
  const join = useCallback(async (action: () => Promise<Identity>) => {
    if (!availability.online) { setError("Connect in the foreground before joining."); return; }
    if (joining.current) return; joining.current = true; clearView(); const ticket = epoch.current; setBusy(true); setError(null);
    try { const next = await action(); if (ticket === epoch.current) { setIdentity(next); setValidatedOnline(true); } }
    catch { if (ticket === epoch.current) setError("Join unavailable. Check the server session and secure storage, then retry explicitly."); }
    finally { joining.current = false; setBusy(false); }
  }, [clearView, availability.online]);
  const leave = useCallback(async () => { clearView(); try { await vault.clear(); } catch { setError("Secure storage unavailable. Access is closed."); } }, [clearView, vault]);
  const stageReplacement = useCallback(async (value: SessionCreated) => { clearView(); await service.storeReplacement(value); setError("Reset completed. Rejoin the stored replacement explicitly. Prior drafts remain privately retained."); }, [clearView, service]);
  useEffect(() => {
    if (!availability.online) {
      setValidatedOnline(false); service.cancelPending(); if (joining.current) epoch.current++;
      const previous = identityRef.current;
      if (previous) { service.api.cancelSession(previous.session.session_id); void cache.cancelQueries({ queryKey: ["native", previous.session.session_id, previous.session.generation, previous.participant.participant_id] }); }
    } else if (identityRef.current) void refresh().catch(() => undefined);
  }, [availability.online, cache, refresh, service]);
  useEffect(() => { const timer = setInterval(() => setTick(value => value + 1), 15_000); return () => clearInterval(timer); }, []);
  useEffect(() => {
    if (!identity || !availability.online) { setConnection(availability.foreground ? "Offline / reads may be cached" : "Background / subscription paused"); return; }
    const scope = new RequestScope(identity.session.session_id, identity.session.generation); stream.current = scope;
    let poll: ReturnType<typeof setInterval> | undefined;
    void (async () => {
      try {
        setConnection("Connecting foreground updates");
        for await (const event of watchEvents(service.api, { scope, initialMeta: { request_id: "native-stream", session_id: identity.session.session_id, generation: identity.session.generation, revision: identity.session.revision, event_sequence: identity.session.event_sequence },
          maxReconnects: 1, refresh: async () => { await refresh(); const next = identityRef.current!.session; return { request_id: "native-refresh", session_id: next.session_id, generation: next.generation, revision: next.revision, event_sequence: next.event_sequence }; } })) {
          setConnection("Foreground events received"); setLastEvent(event);
          if (["session_reset", "session_expired", "capability_revoked"].includes(event.type)) { clearView(); setError("Session changed. Rejoin explicitly; old commands are cancelled."); break; }
          await cache.invalidateQueries({ queryKey: ["native", identity.session.session_id, identity.session.generation, identity.participant.participant_id] });
          await refresh();
        }
      } catch { if (!scope.signal.aborted) { setConnection("Stream unavailable / foreground polling"); poll = setInterval(() => { void refresh().catch(() => undefined); }, 5000); } }
    })();
    return () => { scope.cancel(); if (poll) clearInterval(poll); };
  }, [identity, availability.online, availability.foreground, cache, clearView, refresh, service]);
  const context = useMemo<MobileContext | null>(() => identity ? { ...identity, nowMs: Date.now(), online: availability.online, freshness: availability.online && validatedOnline ? "current" : "stale" } : null, [identity, availability.online, validatedOnline, tick]);
  contextRef.current = context;
  const scopeKey = context ? `${context.session.session_id}:${context.session.generation}:${context.participant.participant_id}` : "none";
  const client = useMemo(() => contextRef.current ? new NativeSessionClient(service.api, contextRef.current, () => contextRef.current) : null, [scopeKey, service]);
  clientRef.current = client;
  useEffect(() => () => client?.scope.cancel(), [client]);
  const value = { getContext: () => contextRef.current, lastEvent, online: availability.online, context, service, client, busy, error, connection, refresh, join, leave, stageReplacement };
  return <QueryClientProvider client={cache}><RuntimeContext.Provider value={value}>{children}</RuntimeContext.Provider></QueryClientProvider>;
}
export function useNativeRuntime(): Runtime {
  const runtime = useContext(RuntimeContext); if (!runtime) throw new Error("Native runtime provider missing"); return runtime;
}
