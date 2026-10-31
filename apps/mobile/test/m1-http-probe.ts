/** Real loopback HTTP probe helpers; platform storage below is test-only, never device proof. */
import { ApiError, createIdempotencyKey } from "@floodops/api-client";
import { ContractValidationError, type Identity } from "@floodops/contracts";
import { createNativeApi } from "../src/shared/native-client";
import { CredentialVault } from "../src/shared/native/credential-vault";
import { NativeSessionService } from "../src/features/session/runtime/session-service";
export function nativeActor() {
  const values = new Map<string, string>(); const vault = new CredentialVault({ available: async () => true, read: async key => values.get(key) ?? null,
    write: async (key, value) => { values.set(key, value); }, remove: async key => { values.delete(key); } }, Date.now);
  const api = createNativeApi("http://127.0.0.1:8790/api/v1", vault);
  return { vault, api, service: new NativeSessionService(api, vault, createIdempotencyKey) };
}
export const nativeContext = (identity: Identity) => ({ ...identity, nowMs: Date.now(), online: true, freshness: "current" as const });
export async function runNativeProbe(name: string, run: (step: <T>(action: string, execute: () => Promise<T>) => Promise<T>) => Promise<Record<string, unknown>>) {
  const completed: string[] = []; let action = "initialize";
  async function step<T>(target: string, execute: () => Promise<T>) {
    action = target; const result = await execute(); completed.push(target); return result;
  }
  try { console.log(JSON.stringify({ result: "PASS", probe: name, completed, ...await run(step), device_proof: false })); }
  catch (error) {
    const detail = error instanceof ApiError ? { status: error.status, code: error.response.error.code }
      : error instanceof ContractValidationError ? { boundary: error.boundary, issues: error.issues }
      : { kind: error instanceof Error ? error.name : "Unknown failure" };
    console.log(JSON.stringify({ result: "BLOCKED", probe: name, action, completed, ...detail, device_proof: false, note: "No response parser relaxation, mock backend or device proof substituted" }));
    process.exitCode = 1;
  }
}
