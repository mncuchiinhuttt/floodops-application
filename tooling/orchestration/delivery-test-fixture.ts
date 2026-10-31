import { mkdtemp, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { coordinationRoot as coord, sha256, type GitReader } from "./delivery-verifier-core.ts";

export async function createFixture(options: { partial?: boolean; badHash?: boolean; artifactDrift?: boolean; launchSource?: boolean; binary?: boolean } = {}) {
  const root = await mkdtemp(join(tmpdir(), "floodops-delivery-test-"));
  const git: GitReader = async (...args) => {
    const process = Bun.spawn(["git", "-c", "commit.gpgsign=false", "-c", "core.hooksPath=/dev/null", "-c", "user.name=Fixture", "-c", "user.email=fixture@example.invalid", ...args], { cwd: root, stdin: "ignore", stdout: "pipe", stderr: "pipe" });
    const [out, err, status] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
    if (status) throw new Error(err || `Git ${args[0]} failed`);
    return out;
  };
  const write = async (path: string, body: string | Uint8Array) => { await mkdir(dirname(join(root, path)), { recursive: true }); await Bun.write(join(root, path), body); };
  const commit = async (message: string) => { await git("add", "--all"); await git("commit", "--allow-empty", "-qm", message); return (await git("rev-parse", "HEAD")).trim(); };
  await git("init", "-q", "--initial-branch=fixture");
  const role = "simulation-data", item = "simulation-test-v1", report = `plans/reports/worktree-${role}-${item}.md`;
  const artifact = options.binary ? "specs/routing.bin" : "specs/routing.md", policy = "fixture policy\n";
  const input = options.binary ? new Uint8Array([0, 255, 195, 40, 128, 10]) : "frozen input\n";
  await write("AGENTS.md", policy); await write(artifact, input);
  await write(`${coord}/roles.json`, JSON.stringify({ ownership_policy: { protected_files: ["packages/simulation/package.json"] }, roles: [
    { id: role, include_files: [], include_prefixes: ["packages/simulation/"], exclude_prefixes: [], report_prefix: "plans/reports/worktree-simulation-data-", report_suffix: ".md" }
  ] }));
  const initial = await commit("fixture inputs");
  const indexPath = `${coord}/contracts/fixture.json`;
  const index = JSON.stringify({ source_commit: initial, artifacts: [{ path: artifact, sha256: sha256(input) }] });
  await write(indexPath, index);
  const indexed = await commit("fixture index");
  if (options.artifactDrift) await write(artifact, options.binary ? new Uint8Array([0, 254, 195, 40, 128, 10]) : "drifted input\n");
  const base = await commit("fixture baseline");
  const receiptPath = `${coord}/launch/${role}/${item}.json`;
  await write(receiptPath, JSON.stringify({ work_item_id: item, role_id: role, base_sha: base, status: "authorized",
    policy_ref: { path: "AGENTS.md", commit_sha: initial, sha256: sha256(policy) },
    contract_ref: { path: indexPath, commit_sha: indexed, sha256: options.badHash ? "0".repeat(64) : sha256(index) },
    required_gates: [{ gate_id: "workspace-bootstrap", commit_sha: initial }],
    contract_mode: options.partial ? "approved-amendment" : "frozen-consumer", amendment_id: options.partial ? "partial-test-v1" : null }));
  if (options.partial) await write(`${coord}/amendments/partial-test-v1.json`, JSON.stringify({ amendment_id: "partial-test-v1", status: "authorized", work_items: [
    { role_id: role, work_item_id: item, include_prefixes: ["packages/simulation/src/graph/"], include_files: [] }
  ] }));
  if (options.launchSource) await write("packages/simulation/src/graph/hidden.ts", "export const hidden = 1;\n");
  const launchSha = await commit("fixture launch");
  const finish = async (changes: [string, string][] = [["packages/simulation/src/graph/route.ts", "export const route = 1;\n"]], reportOptions: { wrongSource?: boolean; extraSource?: boolean; gap?: boolean } = {}) => {
    for (const [path, body] of changes) await write(path, body);
    const sourceSha = await commit("fixture implementation");
    if (reportOptions.gap) await commit("intervening commit");
    await write(report, `SourceEvidence\nsource_sha=${reportOptions.wrongSource ? initial : sourceSha}\n`);
    if (reportOptions.extraSource) await write("packages/simulation/src/graph/late.ts", "export const late = 1;\n");
    return { receiptPath, launchSha, sourceSha, deliverySha: await commit("fixture report") };
  };
  return { root, git, write, commit, finish, receiptPath, launchSha, report, dispose: () => rm(root, { recursive: true, force: true }) };
}
