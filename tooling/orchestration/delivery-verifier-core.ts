import { assertOwnedPaths, assertRepoPath, changedPathsFromNameStatus, type OwnershipManifest } from "./ownership.ts";
import { assertPartialScope } from "./delivery-scope.ts";

export const coordinationRoot = "plans/20261030-2249-floodops-web-mobile-implementation/worktree-execution";
const shaPattern = /^(?:[a-f0-9]{40}|[a-f0-9]{64})$/;
export type GitReader = (...args: string[]) => Promise<string>;
interface HashRef { path: string; commit_sha: string; sha256: string }
interface Receipt {
  work_item_id: string; role_id: string; base_sha: string; policy_ref: HashRef; contract_ref: HashRef;
  required_gates: { gate_id: string; commit_sha: string }[]; status: string;
  contract_mode: string; amendment_id: string | null;
}
interface Index { source_commit: string; artifacts: { path: string; sha256: string }[] }
export interface DeliveryInput { receiptPath: string; launchSha: string; sourceSha: string; deliverySha: string }
export const sha256 = (value: string | Uint8Array) => new Bun.CryptoHasher("sha256").update(value).digest("hex");

function assertSha(sha: string): void {
  if (typeof sha !== "string" || !shaPattern.test(sha)) throw new Error("Expected exact SHA.");
}

export async function verifyDelivery(input: DeliveryInput, git: GitReader, readBlobBytes?: (commit: string, path: string) => Promise<Uint8Array>) {
  const { receiptPath, launchSha, sourceSha, deliverySha } = input;
  assertRepoPath(receiptPath);
  for (const sha of [launchSha, sourceSha, deliverySha]) assertSha(sha);
  const blob = (commit: string, path: string) => { assertSha(commit); assertRepoPath(path); return git("show", `${commit}:${path}`); };
  const ancestor = async (older: string, newer: string) => {
    assertSha(older); assertSha(newer); await git("merge-base", "--is-ancestor", older, newer);
  };
  const receipt: Receipt = JSON.parse(await blob(launchSha, receiptPath));
  if (receipt.status !== "authorized") throw new Error("Receipt not authorized.");
  const manifest: OwnershipManifest = JSON.parse(await blob(launchSha, `${coordinationRoot}/roles.json`));
  const role = manifest.roles.find(role => role.id === receipt.role_id);
  if (!role || !/^[a-z0-9][a-z0-9-]{2,95}$/.test(receipt.work_item_id)) throw new Error("Unknown role or malformed work item.");
  if (receiptPath !== `${coordinationRoot}/launch/${receipt.role_id}/${receipt.work_item_id}.json`) {
    throw new Error("Receipt path must match its role and work item.");
  }
  await ancestor(receipt.base_sha, launchSha);
  await ancestor(launchSha, sourceSha);
  if (sourceSha === launchSha || sourceSha === deliverySha) throw new Error("Source and report must be separate from launch.");
  if ((await git("rev-list", "--parents", "-n", "1", deliverySha)).trim() !== `${deliverySha} ${sourceSha}`) {
    throw new Error("Report must be a single direct child of source C.");
  }
  const launchDelta = changedPathsFromNameStatus(await git("diff", "--name-status", "-z", receipt.base_sha, launchSha));
  if (launchDelta.some(path => !path.startsWith(`${coordinationRoot}/`))) throw new Error("BASE-to-launch must be approved coordination metadata only.");
  for (const gate of receipt.required_gates) await ancestor(gate.commit_sha, launchSha);
  async function pinned(ref: HashRef): Promise<string> {
    if (!/^[a-f0-9]{64}$/.test(ref.sha256)) throw new Error("Malformed pinned hash.");
    await ancestor(ref.commit_sha, launchSha);
    const body = await blob(ref.commit_sha, ref.path);
    if (sha256(body) !== ref.sha256 || await blob(launchSha, ref.path) !== body) throw new Error(`Pinned hash mismatch: ${ref.path}`);
    return body;
  }
  if (receipt.policy_ref.path !== "AGENTS.md") throw new Error("Policy must pin AGENTS.md.");
  const policy = await pinned(receipt.policy_ref);
  if (await blob(deliverySha, "AGENTS.md") !== policy) throw new Error("Delivered policy changed.");
  const index: Index = JSON.parse(await pinned(receipt.contract_ref));
  await ancestor(index.source_commit, receipt.contract_ref.commit_sha);
  if (!Array.isArray(index.artifacts) || !index.artifacts.length) throw new Error("Empty contract index.");
  const seen = new Set<string>();
  for (const artifact of index.artifacts) {
    if (seen.has(artifact.path)) throw new Error("Duplicate indexed path.");
    seen.add(artifact.path);
    for (const commit of [index.source_commit, receipt.contract_ref.commit_sha, launchSha]) {
      const content = readBlobBytes ? await readBlobBytes(commit, artifact.path) : await blob(commit, artifact.path);
      if (sha256(content) !== artifact.sha256) throw new Error(`Artifact drift: ${artifact.path}`);
    }
  }
  const delta = async (from: string, to: string) => changedPathsFromNameStatus(await git("diff", "--name-status", "-z", "--find-renames", from, to));
  const paths = await delta(launchSha, deliverySha);
  assertOwnedPaths(paths, receipt.role_id, receipt.work_item_id, manifest);
  const reportPath = `${role.report_prefix}${receipt.work_item_id}${role.report_suffix}`;
  const reportDelta = await delta(sourceSha, deliverySha);
  if (reportDelta.length !== 1 || reportDelta[0] !== reportPath) throw new Error("C-to-R must contain only the exact own SourceEvidence report.");
  const report = await blob(deliverySha, reportPath);
  if (!report.includes(sourceSha) || report.includes(deliverySha)) throw new Error("Report must reference C, not its enclosing R.");
  if (receipt.contract_mode === "approved-amendment") {
    if (!receipt.amendment_id || !/^[a-z0-9-]+$/.test(receipt.amendment_id)) throw new Error("Missing amendment ID.");
    const amendment = JSON.parse(await blob(launchSha, `${coordinationRoot}/amendments/${receipt.amendment_id}.json`));
    if (amendment.status !== "authorized" || amendment.amendment_id !== receipt.amendment_id) throw new Error("Amendment not authorized.");
    assertPartialScope(paths, receipt.role_id, receipt.work_item_id, reportPath, amendment);
  }
  const changed = new Set(paths);
  for (const record of (await git("ls-tree", "-r", "-z", "--full-tree", deliverySha)).split("\0").filter(Boolean)) {
    const path = record.slice(record.indexOf("\t") + 1);
    if (changed.has(path) && !/^100(?:644|755) blob /.test(record)) throw new Error(`Non-regular source denied: ${path}`);
  }
  return { role: receipt.role_id, work_item: receipt.work_item_id, source_sha: sourceSha, delivery_sha: deliverySha,
    owned_changed_paths: paths.length, report_path: reportPath,
    checks: ["ancestry", "metadata-only-launch", "pinned-policy", "pinned-index-and-artifacts", "ownership", "partial-scope", "direct-report-only-delivery", "regular-source-files"],
    qualification: "Coordination checks only; runtime/tool permissions, signed authorship, approved authority, feature review and acceptance remain separate checks." };
}
