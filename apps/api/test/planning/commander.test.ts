import { expect, test } from "bun:test";
import { getToolDefinitions, RuntimeCommanderDisabledError } from "@floodops/contracts";
import { createResponsesProvider } from "../../src/integrations/openai/index";
import { runCommander } from "../../src/features/planning/commander";
import { createToolSession } from "../../src/features/planning/tool-session";
import { DEFAULT_SEARCH_LIMITS } from "../../src/features/planning/deterministic-types";
import type { CommanderProvider, ResolvedPlanningOptions } from "../../src/features/planning/runtime-types";
import { runFixture } from "./planning-context.ts";
import { runtimeContext } from "./runtime-unit-context";
function fixture(provider: CommanderProvider) {
  const run = runFixture(), context = runtimeContext(run);
  const reference = { scenario_id: context.snapshot.meta.scenario_id, scenario_version: context.snapshot.meta.scenario_version, bundle_hash: run.scenario.bundleHash };
  const options: ResolvedPlanningOptions<unknown> = { planner: { kind: "deterministic", algorithm_version: "legacy-test", config_hash: "0".repeat(64), search_limit: 1 }, limits: { ...DEFAULT_SEARCH_LIMITS }, persistence: { reference, read: () => run,
    write: (values, state) => ({ ...values, simulation: { reference, state } }) },
    provider, model: "declared-test-model", modelConfigHash: "test-config", deadlineMs: 20, maxTurns: 2, maxToolCalls: 2,
    material: () => ({ jobId: "job_fixture1", leaseId: "lease_fixture1", planId: "plan_fixture1", nonce: "n".repeat(32) }) };
  return { run, options, session: createToolSession(context, run, "job_fixture1", "plan_fixture1", options) };
}
test("preserved Responses adapter has no default key and registers no operational tools", async () => {
  expect(createResponsesProvider({})).toBeUndefined();
  expect(() => getToolDefinitions()).toThrow(RuntimeCommanderDisabledError);
  let called = false;
  const provider = createResponsesProvider({ apiKey: "synthetic-test-key", fetch: (async (url: RequestInfo | URL, init?: RequestInit) => {
    called = true; expect(String(url)).toBe("https://api.openai.com/v1/responses");
    const body = JSON.parse(String(init!.body));
    expect(body.store).toBe(false); expect(body.tools).toHaveLength(0); expect(body.parallel_tool_calls).toBe(false);
    expect(body.text.format.strict).toBe(true); expect(body.text.format.schema.additionalProperties).toBe(false);
    return Response.json({ status: "completed", output: [] });
  }) as unknown as typeof fetch })!;
  await provider.respond({ model: "test-model", instructions: "Test", tools: [], input: [], signal: new AbortController().signal });
  expect(called).toBe(true);
});
test.each(["refusal", "forbidden_tool", "bad_ids"] as const)("disabled legacy controller never calls transport for %s", async kind => {
  let called = false;
  const provider: CommanderProvider = { async respond() {
    called = true;
    if (kind === "forbidden_tool") return { status: "completed", output: [{ type: "function_call", call_id: "call_1", name: "execute_plan", arguments: "{}" }] };
    return { status: "completed", output: [{ type: "message", content: [kind === "refusal" ? { type: "refusal", refusal: "No" }
      : { type: "output_text", text: JSON.stringify({ action_ids: ["action_foreign1"], route_ids: [] }) }] }] };
  } };
  const f = fixture(provider), before = JSON.stringify(f.run);
  await expect(runCommander(f.session, f.options, Date.now() + 1000, async () => true)).rejects.toBeInstanceOf(RuntimeCommanderDisabledError);
  expect(called).toBe(false);
  expect(JSON.stringify(f.run)).toBe(before);
});
test("disabled legacy controller rejects before an unresponsive transport can run", async () => {
  const f = fixture({ respond: () => new Promise(() => {}) });
  try { await runCommander(f.session, f.options, Date.now() + 1000, async () => true); throw new Error("Unexpected success"); }
  catch (error) { expect(error).toBeInstanceOf(RuntimeCommanderDisabledError); }
});
