import { runInDurableObject } from "cloudflare:test";
import { parseSchema } from "@floodops/contracts";
import type { Snapshot } from "../../src/shared/platform-types";
import { bindings, fixture, request, requestKey, type Fixture } from "../capabilities/helpers";
export async function createVersioned(type: "native" | "web" = "native"): Promise<Fixture> {
  const result = await request("/sessions", { method: "POST", headers: { "Content-Type": "application/json", "Idempotency-Key": requestKey(),
    "X-Client-Request-Scope": requestKey(), ...(type === "web" ? { Origin: "https://floodops.test" } : {}) },
    body: JSON.stringify({ scenario_id: "scenario_versioned01", scenario_version: "1", client_type: type }) });
  if (result.status !== 201) throw new Error(`Versioned create status ${result.status}`);
  return fixture(parseSchema("SessionCreatedResponse", await result.json()).data!, result.headers.get("Set-Cookie"));
}
export async function snapshot(f: Fixture): Promise<Snapshot> {
  return runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
    return JSON.parse(state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one().value) as Snapshot;
  });
}
export async function removeMarker(f: Fixture, mode: "missing" | "old" | "null" | "mutable-only" = "missing") {
  await runInDurableObject(bindings.SESSIONS.get(bindings.SESSIONS.idFromName(f.id)), (_instance, state) => {
    const row = state.storage.sql.exec<{ value: string }>("SELECT value FROM documents WHERE collection='runtime' AND id='snapshot'").one();
    const stored = JSON.parse(row.value) as Snapshot;
    if (mode === "old") stored.seed.values.runtime_contract = { serialization: "legacy-v1" };
    else if (mode === "null") stored.seed.values.runtime_contract = null;
    else delete stored.seed.values.runtime_contract;
    if (mode !== "mutable-only") stored.values.runtime_contract = stored.seed.values.runtime_contract;
    state.storage.sql.exec("UPDATE documents SET value=? WHERE collection='runtime' AND id='snapshot'", JSON.stringify(stored));
  });
}
