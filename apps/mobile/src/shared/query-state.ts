import type { SessionMeta } from "@floodops/contracts";
import { sameSession } from "./session-context";
export interface QueryState<T> {
  session_id: string; generation: number; revision: number; event_sequence: number;
  request: number; status: "loading" | "ready" | "offline" | "error" | "relink"; data: T | null; message: string | null;
}
export function initialQuery<T>(session: SessionMeta): QueryState<T> {
  return { session_id: session.session_id, generation: session.generation, revision: session.revision,
    event_sequence: session.event_sequence, request: 0, status: "loading", data: null, message: null };
}
export type QueryAction<T> = { type: "begin" } | { type: "loaded"; request: number; session: SessionMeta; data: T }
  | { type: "failed"; request: number; message: string; rejoin?: boolean } | { type: "offline" }
  | { type: "reset"; session: SessionMeta };
export function reduceQuery<T>(state: QueryState<T>, action: QueryAction<T>): QueryState<T> {
  if (action.type === "reset") return { ...initialQuery<T>(action.session), request: state.request + 1, status: "relink" };
  if (action.type === "begin") return state.status === "relink" ? state : { ...state, request: state.request + 1, status: "loading", message: null };
  if (action.type === "offline") return state.status === "relink" ? state : { ...state, status: "offline", request: state.request + 1 };
  if (state.status === "relink" || action.request !== state.request) return state;
  if (action.type === "failed") return { ...state, status: action.rejoin ? "relink" : "error", data: action.rejoin ? null : state.data, message: action.message };
  if (!sameSession(state, action.session) || action.session.revision < state.revision || action.session.event_sequence < state.event_sequence) return state;
  return { ...state, revision: action.session.revision, event_sequence: action.session.event_sequence, data: action.data, status: "ready", message: null };
}
