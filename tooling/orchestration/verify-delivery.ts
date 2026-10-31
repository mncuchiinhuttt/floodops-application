import { verifyDelivery } from "./delivery-verifier-core.ts";

const [receiptPath, launchSha, sourceSha, deliverySha, extra] = Bun.argv.slice(2);
if (!receiptPath || !launchSha || !sourceSha || !deliverySha || extra) {
  throw new Error("Usage: bun tooling/orchestration/verify-delivery.ts RECEIPT LAUNCH_SHA SOURCE_SHA DELIVERY_SHA");
}
const result = await verifyDelivery({ receiptPath, launchSha, sourceSha, deliverySha }, async (...args) => {
  const proc = Bun.spawn(["git", ...args], { stdin: "ignore", stdout: "pipe", stderr: "pipe" });
  const [output, error, status] = await Promise.all([
    new Response(proc.stdout).text(), new Response(proc.stderr).text(), proc.exited
  ]);
  if (status) throw new Error(`Git check failed (${args[0]}): ${error.trim()}`);
  return output;
}, async (commit, path) => {
  const proc = Bun.spawn(["git", "show", `${commit}:${path}`], { stdin: "ignore", stdout: "pipe", stderr: "pipe" });
  const [output, error, status] = await Promise.all([new Response(proc.stdout).arrayBuffer(), new Response(proc.stderr).text(), proc.exited]);
  if (status) throw new Error(`Git blob read failed: ${error.trim()}`);
  return new Uint8Array(output);
});
console.log(JSON.stringify(result, null, 2));
