/** Real local Workerd HTTP. SecurePort is a disclosed test port, not native device proof. */
import manifest from "../../../data/scenarios/functional-v1/manifest.json";
import { createIdempotencyKey } from "@floodops/api-client";
import { ApiError } from "@floodops/api-client";
import { createNativeApi } from "../src/shared/native-client";
import { CredentialVault } from "../src/shared/native/credential-vault";
import { NativeSessionService } from "../src/features/session/runtime/session-service";
const values = new Map<string, string>();
const vault = new CredentialVault({ available: async () => true, read: async key => values.get(key) ?? null,
  write: async (key, value) => { values.set(key, value); }, remove: async key => { values.delete(key); } }, Date.now);
const api = createNativeApi("http://127.0.0.1:8790/api/v1", vault);
const service = new NativeSessionService(api, vault, createIdempotencyKey);
try { await api.request("listScenarios", {}); throw new Error("Catalog unexpectedly mounted; update this pinned smoke"); }
catch (error) { if (!(error instanceof ApiError) || error.status !== 404) throw error; }
// Explicit canonical synthetic scenario input, matching this local server's pinned catalog source.
const scenario = manifest.config.scenario;
const owner = await service.create(scenario.scenario_id, scenario.version);
if (owner.participant.role !== "dispatcher" || owner.session.calibration_status !== "incomplete") throw new Error("Wrong server owner/label");
const restored = await service.restore(); if (restored.participant.participant_id !== owner.participant.participant_id) throw new Error("Wrong restored principal");
try { await api.request("getSessionSnapshot", { path: { session_id: owner.session.session_id } }); throw new Error("Unfinished business view unexpectedly succeeded"); }
catch (error) { if (!(error instanceof ApiError) || error.status !== 503 || error.response.error.code !== "CONFIG_INCOMPLETE") throw error; }
const invitation = await api.request("createInvitation", { path: { session_id: owner.session.session_id }, headers: { "Idempotency-Key": createIdempotencyKey() }, body: { role: "viewer", bound_entity_id: null, expires_in_seconds: 120 } });
const viewer = await service.claim(owner.session.session_id, invitation.body.data.claim_token);
if (viewer.participant.role !== "viewer" || viewer.participant.participant_id === owner.participant.participant_id) throw new Error("Wrong claimed capability");
try { await api.request("getSessionSnapshot", { path: { session_id: owner.session.session_id } }); throw new Error("Viewer accessed dispatcher data"); }
catch (error) { if (!(error instanceof ApiError) || error.status !== 403) throw error; }
await vault.clear();
console.log("PASS: real local Workerd catalog404 (not mounted) -> explicit canonical scenario native create/persist/identity/rejoin -> invitation/claim -> viewer403; unfinished snapshot503 CONFIG_INCOMPLETE. Test SecurePort only, no device proof.");
