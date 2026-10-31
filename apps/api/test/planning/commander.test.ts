import { expect, test } from "bun:test";
import { getToolDefinitions } from "@floodops/contracts";
import { createResponsesProvider, ModelFailure } from "../../src/integrations/openai/index";
import { runCommander } from "../../src/features/planning/commander";
import { createToolSession } from "../../src/features/planning/tool-session";
import type { CommanderProvider, ResolvedPlanningOptions } from "../../src/features/planning/runtime-types";
import { runFixture } from "./planning-context.ts";
import { runtimeContext } from "./runtime-unit-context";
function fixture(provider: CommanderProvider) {
  const run = runFixture(), context = runtimeContext(run);
  const reference = { scenario_id: context.snapshot.meta.scenario_id, scenario_version: context.snapshot.meta.scenario_version, bundle_hash: run.scenario.bundleHash };
  const options: ResolvedPlanningOptions<unknown> = { persistence: { reference, read: () => run,
    write: (values, state) => ({ ...values, simulation: { reference, state } }) },
    provider, model: "declared-test-model", modelConfigHash: "test-config", deadlineMs: 20, maxTurns: 2, maxToolCalls: 2,
    material: () => ({ jobId: "job_fixture1", leaseId: "lease_fixture1", planId: "plan_fixture1", nonce: "n".repeat(32) }) };
  return { run, options, session: createToolSession(context, run, "job_fixture1", "plan_fixture1", options) };
}
test("Responses adapter uses fixed endpoint, strict final schema, all8tools and no default provider", async () => {
  expect(createResponsesProvider({})).toBeUndefined();
  let called = false;
  const provider = createResponsesProvider({ apiKey: "synthetic-test-key", fetch: (async (url: RequestInfo | URL, init?: RequestInit) => {
    called = true; expect(String(url)).toBe("https://api.openai.com/v1/responses");
    const body = JSON.parse(String(init!.body));
    expect(body.store).toBe(false); expect(body.tools).toHaveLength(8); expect(body.parallel_tool_calls).toBe(false);
    expect(body.text.format.strict).toBe(true); expect(body.text.format.schema.additionalProperties).toBe(false);
    return Response.json({ status: "completed", output: [] });
  }) as unknown as typeof fetch })!;
  await provider.respond({ model: "test-model", instructions: "Test", tools: getToolDefinitions(), input: [], signal: new AbortController().signal });
  expect(called).toBe(true);
});
test.each(["refusal", "forbidden_tool", "bad_ids"] as const)("controller rejects %s without touching operations/source facts", async kind => {
  const provider: CommanderProvider = { async respond() {
    if (kind === "forbidden_tool") return { status: "completed", output: [{ type: "function_call", call_id: "call_1", name: "execute_plan", arguments: "{}" }] };
    return { status: "completed", output: [{ type: "message", content: [kind === "refusal" ? { type: "refusal", refusal: "No" }
      : { type: "output_text", text: JSON.stringify({ action_ids: ["action_foreign1"], route_ids: [] }) }] }] };
  } };
  const f = fixture(provider), before = JSON.stringify(f.run);
  await expect(runCommander(f.session, f.options, Date.now() + 1000, async () => true)).rejects.toThrow();
  expect(JSON.stringify(f.run)).toBe(before);
});
test("controller timeout is bounded even if transport ignores AbortSignal", async () => {
  const f = fixture({ respond: () => new Promise(() => {}) });
  try { await runCommander(f.session, f.options, Date.now() + 1000, async () => true); throw new Error("Unexpected success"); }
  catch (error) { expect(error instanceof ModelFailure && error.code).toBe("MODEL_TIMEOUT"); }
});
