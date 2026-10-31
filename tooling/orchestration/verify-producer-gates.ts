import { verifyProducerGates } from "./producer-gates.ts";

const [candidate, ...gates] = Bun.argv.slice(2);
if (!candidate || !gates.length) throw new Error("Usage: bun tooling/orchestration/verify-producer-gates.ts EXACT_CANDIDATE_SHA GATE_ID...");
const result = await verifyProducerGates(candidate, gates, async (...args) => {
  const process = Bun.spawn(["git", ...args], { stdin: "ignore", stdout: "pipe", stderr: "pipe" });
  const [output, error, status] = await Promise.all([new Response(process.stdout).text(), new Response(process.stderr).text(), process.exited]);
  if (status) throw new Error(`Git check failed (${args[0]}): ${error.trim()}`);
  return output;
});
console.log(JSON.stringify(result, null, 2));
if (!result.coordination_ready) process.exitCode = 2;
