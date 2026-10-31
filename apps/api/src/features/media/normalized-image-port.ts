import { parseSchema } from "@floodops/contracts";
import type { FixtureAsset, Report } from "@floodops/contracts";
import { sourceState } from "@floodops/domain/reporting";
import type { StoredSourceReport, StoredSourceUpload } from "@floodops/domain/reporting";
import { createSessionRuntimeClient, fail, PlatformError } from "../../shared/index";
import type { Call, PlatformBindings, Reply, SessionRequestContext, Snapshot } from "../../shared/index";
import { sha256 } from "../scenario/index";
import { boundedBytes } from "./bounded-bytes";
import { imageShape, normalizeImage } from "./normalize-image";
import type { MediaBindings } from "./media-types";
function assertSuccess(reply: Reply): void {
  if (reply.status >= 400) { const error = parseSchema("ErrorResponse", reply.body); throw new PlatformError(reply.status, error.error.code); }
}
export async function verifiedFixture(env: PlatformBindings, call: Call, fixturePhotoId: string) {
  const client = createSessionRuntimeClient(env), response = await client.dispatch({ ...call, kind: "view", name: "source-fixture-assets" });
  assertSuccess(response);
  const asset = (response.body.data as FixtureAsset[]).find(item => item.fixture_photo_id === fixturePhotoId);
  if (!asset || !asset.provenance.licence.trim()) fail(404, "NOT_FOUND");
  const bindings = env as MediaBindings;
  if (!bindings.SCENARIO_ASSETS) fail(503, "STORAGE_UNAVAILABLE");
  const object = await bindings.SCENARIO_ASSETS.get(`assets/${asset.asset_id}`); if (!object) fail(503, "STORAGE_UNAVAILABLE");
  const bytes = await boundedBytes(object.body), shape = imageShape(bytes, asset.content_type);
  if (bytes.length !== asset.byte_length || await sha256(bytes) !== asset.sha256 || shape.width !== asset.width || shape.height !== asset.height) fail(503, "STORAGE_UNAVAILABLE");
  const normalized = await normalizeImage(bindings.IMAGES, bytes, asset.content_type);
  return { ...normalized, sha256: await sha256(normalized.bytes) };
}
interface Projection { sessionId: string; generation: number; reports: StoredSourceReport[]; uploads: StoredSourceUpload[] }
export interface NormalizedImage {
  status: "ready"; sessionId: string; generation: number; reportId: string; mediaDigest: string;
  contentType: "image/png" | "image/jpeg"; width: number; height: number; bytes: Uint8Array<ArrayBuffer>; report: Pick<Report, "description" | "captured_at" | "vehicle_types" | "segment_id">;
}
export function normalizedImageBinding(snapshot: Snapshot, reportId: string) {
  const state = sourceState(snapshot.values), stored = state.reports[reportId];
  if (!stored || stored.generation !== snapshot.meta.generation || stored.report.kind !== "citizen" || stored.report.status !== "pending_review" || !stored.normalizedDigest) return null;
  const upload = stored.report.media_id ? Object.values(state.uploads).find(item => item.media?.media_id === stored.report.media_id) : null;
  if (stored.report.media_id && (!upload?.media || upload.upload.status !== "ready")) return null;
  return { reportId, generation: snapshot.meta.generation, mediaDigest: stored.normalizedDigest, duplicate: upload?.duplicate ?? false };
}
/** Server-only authorized bytes, no raw quarantine key, public URL or client-supplied digest/readiness. */
export function createNormalizedImagePort(env: PlatformBindings) {
  const client = createSessionRuntimeClient(env);
  async function project(context: SessionRequestContext): Promise<Projection> {
    const reply = await client.dispatch({ ...context, kind: "view", name: "source-image-review" }); assertSuccess(reply); return reply.body.data as Projection;
  }
  return { async read(context: SessionRequestContext, reportId: string): Promise<NormalizedImage> {
    parseSchema("Id", reportId);
    const before = await project(context), stored = before.reports.find(item => item.report.report_id === reportId);
    if (!stored || stored.generation !== before.generation) fail(404, "NOT_FOUND");
    const report = stored.report;
    if (report.kind !== "citizen" || report.status !== "pending_review" || !stored.normalizedDigest) fail(409, "MEDIA_NOT_READY");
    let image: { bytes: Uint8Array<ArrayBuffer>; contentType: "image/jpeg" | "image/png"; width: number; height: number; sha256: string };
    if (report.media_id) {
      const upload = before.uploads.find(item => item.media?.media_id === report.media_id);
      if (!upload?.media || upload.upload.status !== "ready" || upload.generation !== before.generation || upload.ownerId !== report.participant_id) fail(409, "MEDIA_NOT_READY");
      if (upload.duplicate) fail(422, "DUPLICATE_IMAGE");
      if (!env.REPORT_MEDIA) fail(503, "STORAGE_UNAVAILABLE");
      const object = await env.REPORT_MEDIA.get(upload.derivativeKey); if (!object) fail(503, "STORAGE_UNAVAILABLE");
      const bytes = await boundedBytes(object.body), digest = await sha256(bytes), shape = imageShape(bytes, upload.media.content_type);
      if (digest !== upload.media.sha256 || bytes.length !== upload.media.byte_length || shape.width !== upload.media.width || shape.height !== upload.media.height) fail(503, "STORAGE_UNAVAILABLE");
      image = { bytes, ...shape, sha256: digest };
    } else if (report.fixture_photo_id) image = await verifiedFixture(env, { ...context, kind: "view" }, report.fixture_photo_id);
    else fail(409, "MEDIA_NOT_READY");
    const after = await project(context), current = after.reports.find(item => item.report.report_id === reportId);
    if (after.generation !== before.generation || !current || current.report.status !== "pending_review"
      || JSON.stringify(current.report) !== JSON.stringify(report) || current.normalizedDigest !== image.sha256 || stored.normalizedDigest !== image.sha256) fail(409, "STATE_CONFLICT");
    return { status: "ready", sessionId: context.sessionId, generation: after.generation, reportId, mediaDigest: image.sha256,
      bytes: image.bytes, contentType: image.contentType, width: image.width, height: image.height,
      report: { description: report.description, captured_at: report.captured_at, vehicle_types: [...report.vehicle_types], segment_id: report.segment_id } };
  } };
}
