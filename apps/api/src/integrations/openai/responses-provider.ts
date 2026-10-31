import type { CommanderProvider, CommanderRequest } from "../../features/planning/runtime-types";
export type ModelFailureCode = "MODEL_TIMEOUT" | "MODEL_REFUSED" | "MODEL_INVALID_OUTPUT" | "MODEL_UNAVAILABLE";
export class ModelFailure extends Error {
  constructor(readonly code: ModelFailureCode) { super(code); }
}
export const selectionSchema = { type: "object", properties: {
  action_ids: { type: "array", items: { type: "string" }, maxItems: 100 },
  route_ids: { type: "array", items: { type: "string" }, maxItems: 100 }
}, required: ["action_ids", "route_ids"], additionalProperties: false } as const;
export function createResponsesProvider(options: { apiKey?: string; fetch?: typeof fetch; maxOutputTokens?: number }): CommanderProvider | undefined {
  if (!options.apiKey?.trim()) return undefined;
  const apiKey = options.apiKey, transport = options.fetch ?? fetch, tokens = options.maxOutputTokens ?? 4096;
  if (!Number.isSafeInteger(tokens) || tokens < 1 || tokens > 8192) throw new Error("Invalid provider token budget.");
  return { async respond(request: CommanderRequest) {
    let response: Response;
    try {
      response = await transport("https://api.openai.com/v1/responses", { method: "POST", redirect: "error", signal: request.signal,
        headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
        body: JSON.stringify({ model: request.model, store: false, instructions: request.instructions, input: request.input,
          tools: request.tools, parallel_tool_calls: false, max_output_tokens: tokens,
          text: { format: { type: "json_schema", name: "planner_selection", strict: true, schema: selectionSchema } } }) });
    } catch { throw new ModelFailure(request.signal.aborted ? "MODEL_TIMEOUT" : "MODEL_UNAVAILABLE"); }
    if (!response.ok) { await response.body?.cancel(); throw new ModelFailure("MODEL_UNAVAILABLE"); }
    const reader = response.body?.getReader(); if (!reader) throw new ModelFailure("MODEL_INVALID_OUTPUT");
    const parts: Uint8Array[] = []; let length = 0;
    while (true) {
      const part = await reader.read(); if (part.done) break;
      length += part.value.byteLength;
      if (length > 262144) { await reader.cancel(); throw new ModelFailure("MODEL_INVALID_OUTPUT"); }
      parts.push(part.value);
    }
    const bytes = new Uint8Array(length); let offset = 0;
    for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
    try { return JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)) as unknown; }
    catch { throw new ModelFailure("MODEL_INVALID_OUTPUT"); }
  } };
}
