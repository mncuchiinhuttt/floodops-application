import { parseSchema } from "@floodops/contracts";
import { fail, success } from "../shared/platform-error";
import type { Reply, SessionSeed, Snapshot } from "../shared/platform-types";
import { MAX_AGE_MS, IDLE_MS } from "./auth";
import { created, type Credentials } from "./credentials";
import { Store } from "./store";
export interface Initialization {
  sessionId: string; generation: number; seed: SessionSeed; credentials: Credentials;
  key: string; digest: string; marker: string; requestId: string; now: number;
}
export function initialize(store: Store, input: Initialization): Reply {
  const existing = store.get<string>("runtime", "origin");
  if (existing && existing !== input.marker) fail(409, "STATE_CONFLICT");
  const replay = store.replay("initialize", input.key, input.digest);
  if (replay) return replay;
  if (existing) fail(409, "STATE_CONFLICT");
  const snapshot: Snapshot = { meta: parseSchema("SessionMeta", { session_id: input.sessionId, generation: input.generation,
    revision: 0, event_sequence: 0, scenario_id: input.seed.scenario_id, scenario_version: input.seed.scenario_version,
    sim_minute: 0, horizon_minute: input.seed.horizon_minute, status: "active", calibration_status: input.seed.calibration_status,
    created_at: new Date(input.now).toISOString(), expires_at: new Date(input.now + IDLE_MS).toISOString() }),
    pointers: { latest_requested_job_id: null, latest_plan_id: null }, leases: {}, seed: input.seed, values: structuredClone(input.seed.values), absoluteExpiry: input.now + MAX_AGE_MS };
  parseSchema("Participant", input.credentials.record.participant);
  store.put("runtime", "origin", input.marker);
  store.save(snapshot);
  store.put("participants", input.credentials.record.digest, input.credentials.record);
  const reply = { ...success(201, created(snapshot, input.credentials), input.requestId, snapshot), credential: input.credentials.delivery };
  store.remember("initialize", input.key, input.digest, reply);
  return reply;
}
