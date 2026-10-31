import { assertRepoPath } from "./ownership.ts";
import { coordinationRoot, sha256, type GitReader } from "./delivery-verifier-core.ts";

const exactSha = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
interface GateEvidence {
  gate_id: string; status: string; writer: string; commit_sha: string;
  producer_source_sha?: string; producer_delivery_sha?: string; producer_merge_sha?: string;
  contract_index?: { path: string; sha256: string };
}
export interface GateCheck { gate_id: string; status: "passed" | "blocked"; reason: string; evidence_commit?: string }

/** Read committed evidence only; never issues a receipt or promotes a gate. */
export async function verifyProducerGates(candidateSha: string, gateIds: string[], git: GitReader) {
  if (!exactSha.test(candidateSha)) throw new Error("Expected exact candidate SHA.");
  if (!gateIds.length || new Set(gateIds).size !== gateIds.length || gateIds.some(id => !/^[a-z][a-z0-9-]{2,63}$/.test(id))) {
    throw new Error("Expected nonempty unique safe gate IDs.");
  }
  if ((await git("cat-file", "-t", candidateSha)).trim() !== "commit") throw new Error("Candidate must be a commit.");
  const checks: GateCheck[] = [];
  for (const id of gateIds) {
    let evidence: GateEvidence;
    try { evidence = JSON.parse(await git("show", `${candidateSha}:${coordinationRoot}/gates/${id}.json`)); }
    catch { checks.push({ gate_id: id, status: "blocked", reason: "Committed gate evidence missing, unreadable or invalid JSON." }); continue; }
    try {
      if (evidence.gate_id !== id || evidence.status !== "passed" || evidence.writer !== "integration-lead") {
        throw new Error("Gate is not a matching Lead-published passed record.");
      }
      if (!exactSha.test(evidence.commit_sha)) throw new Error("Gate evidence needs an exact code commit.");
      await git("merge-base", "--is-ancestor", evidence.commit_sha, candidateSha);
      for (const sha of [evidence.producer_source_sha, evidence.producer_delivery_sha, evidence.producer_merge_sha]) {
        if (sha === undefined) continue;
        if (!exactSha.test(sha)) throw new Error("Malformed producer SHA.");
        await git("merge-base", "--is-ancestor", sha, evidence.commit_sha);
      }
      if (evidence.contract_index) {
        const ref = evidence.contract_index;
        assertRepoPath(ref.path);
        if (!/^[a-f0-9]{64}$/.test(ref.sha256) || sha256(await git("show", `${candidateSha}:${ref.path}`)) !== ref.sha256) {
          throw new Error("Published index hash mismatch.");
        }
      }
      checks.push({ gate_id: id, status: "passed", evidence_commit: evidence.commit_sha, reason: "Committed Lead record, declared ancestry and optional index pin match." });
    } catch {
      checks.push({ gate_id: id, status: "blocked", reason: "Gate identity/status, declared commit ancestry or optional index pin is invalid." });
    }
  }
  return { candidate_sha: candidateSha, coordination_ready: checks.every(check => check.status === "passed"), checks,
    qualification: "Coordination evidence only. Trusted authority, actual feature acceptance, public-interface compatibility, delivery review and runtime/security/release evidence remain separate checks." };
}
