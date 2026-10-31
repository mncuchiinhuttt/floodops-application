import { createHash } from "node:crypto";
import { formatEtag, parseSchema } from "@floodops/contracts";
import type { AdvanceJob } from "@floodops/contracts";
import type { Call, Reply } from "../../shared/index";
import { ADVANCE_CHUNK } from "./runtime-types";
import type { AdvanceReservation } from "./runtime-types";

export type RuntimeDispatch = (call: Call) => Promise<Reply>;
/** Lease authority was durably reserved by the start command before this async loop. */
export async function driveAdvance(dispatch: RuntimeDispatch, startCall: Call, reserved: Reply, maxChunks: number): Promise<void> {
  if (!Number.isSafeInteger(maxChunks) || maxChunks < 1 || maxChunks > 128) throw new Error("Invalid advance driver budget.");
  if (reserved.status !== 200) return;
  const reservation = reserved.body.data as AdvanceReservation;
  let meta = reserved.body.meta;
  const { jobId, leaseId, nonce } = reservation.execution;
  for (let chunk = 0; chunk < maxChunks; chunk++) {
    let reply: Reply;
    try { reply = await dispatch({ ...startCall, kind: "command", name: ADVANCE_CHUNK,
      key: `advance_chunk_${createHash("sha256").update(`${jobId}:${chunk}`).digest("hex")}`, path: `/internal/advance/${jobId}/chunks`,
      payload: { job_id: jobId, lease_id: leaseId, nonce },
      ifMatch: formatEtag(parseSchema("Meta", meta) as { session_id: string; generation: number; revision: number }),
      fence: { lease_id: leaseId, nonce }, expectedPointers: { active_advance_job_id: jobId } });
    } catch { return; } // Transport interruption leaves the durable checkpoint for watchdog/explicit resume.
    if (reply.status !== 200) return; // Checkpoint stays persisted; watchdog unlocks and user explicitly resumes.
    const job = parseSchema("AdvanceJob", reply.body.data) as AdvanceJob;
    if (job.status !== "running") return;
    meta = reply.body.meta;
  }
}
