import internalDefinitions from "./generated/internal-services.json";
import imageReviewOutput from "./generated/image-review-model-output.json";

export class UnsupportedToolSchemaError extends Error {
  override readonly name = "UnsupportedToolSchemaError";
}
const supported = new Set([
  "type", "properties", "required", "additionalProperties", "items", "anyOf",
  "enum", "const", "minimum", "maximum", "exclusiveMinimum", "minItems",
  "maxItems", "uniqueItems", "pattern", "minLength", "maxLength", "description",
]);
export function assertStrictToolSchema(value: unknown, allowedKeywords: ReadonlySet<string> = supported): void {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new UnsupportedToolSchemaError("Schema must be an object");
  const schema = value as Record<string, unknown>;
  for (const key of Object.keys(schema)) if (!allowedKeywords.has(key)) throw new UnsupportedToolSchemaError(`Unsupported keyword: ${key}`);
  if (schema.type === "object") {
    const props = schema.properties as Record<string, unknown> | undefined;
    const required = schema.required;
    if (!props || schema.additionalProperties !== false || !Array.isArray(required) ||
      required.length !== Object.keys(props).length || Object.keys(props).some(k => !required.includes(k))) {
      throw new UnsupportedToolSchemaError("Strict objects require every declared field");
    }
    Object.values(props).forEach(s => assertStrictToolSchema(s, allowedKeywords));
  }
  if (schema.items) assertStrictToolSchema(schema.items, allowedKeywords);
  if (schema.anyOf) (schema.anyOf as unknown[]).forEach(s => assertStrictToolSchema(s, allowedKeywords));
}
export class RuntimeCommanderDisabledError extends Error {
  override readonly name = "RuntimeCommanderDisabledError";
  constructor() { super("M1 has no runtime Commander or model-callable operational tools"); }
}
interface LegacyToolDefinition { type: "function"; name: string; description: string; strict: true; parameters: unknown }
/** @deprecated PRD v0.5 permits internal deterministic services only. Always fails closed. */
export function getToolDefinitions(allowedKeywords?: ReadonlySet<string>): LegacyToolDefinition[] {
  void allowedKeywords;
  throw new RuntimeCommanderDisabledError();
}
/** Typed deterministic service contracts; these are never provider tool registrations. */
export function getInternalServiceDefinitions(): typeof internalDefinitions {
  return JSON.parse(JSON.stringify(internalDefinitions)) as typeof internalDefinitions;
}

/** Send only the model-output schema to vision providers, never Job/Advice authority. */
export function getImageReviewModelOutputSchema(allowedKeywords?: ReadonlySet<string>): typeof imageReviewOutput {
  const copy = JSON.parse(JSON.stringify(imageReviewOutput)) as typeof imageReviewOutput;
  assertStrictToolSchema(copy, allowedKeywords);
  return copy;
}
