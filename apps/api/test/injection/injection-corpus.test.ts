import { expect, test } from "bun:test";
import { injectionCorpus, injectionSchema, scenarioCoverage } from "./scenario-corpus";
import type { InjectionScenario, JsonSchema } from "./scenario-corpus";

const supportedKeywords: Record<string, true> = {
  "$schema": true, type: true, additionalProperties: true, properties: true, required: true, enum: true, const: true,
  minItems: true, maxItems: true, uniqueItems: true, items: true, minLength: true, maxLength: true, pattern: true,
  allOf: true, if: true, then: true, else: true,
};
function validate(schema: JsonSchema, value: unknown, path = "$scenario"): void {
  const unsupported = Object.keys(schema).find(key => !supportedKeywords[key]);
  if (unsupported) throw new Error(`${path}: unsupported schema keyword ${unsupported}`);
  if (Object.hasOwn(schema, "const") && JSON.stringify(value) !== JSON.stringify(schema.const)) throw new Error(`${path}: const mismatch`);
  if (schema.enum && !schema.enum.some(item => JSON.stringify(item) === JSON.stringify(value))) throw new Error(`${path}: enum mismatch`);
  const isObject = typeof value === "object" && value !== null && !Array.isArray(value);
  if (schema.type === "object" && !isObject) throw new Error(`${path}: expected object`);
  if (isObject && (schema.properties || schema.required || schema.additionalProperties !== undefined)) {
    const record = value as Record<string, unknown>, properties = schema.properties ?? {};
    for (const required of schema.required ?? []) if (!Object.hasOwn(record, required)) throw new Error(`${path}.${required}: required`);
    if (schema.additionalProperties === false) for (const key of Object.keys(record))
      if (!Object.hasOwn(properties, key)) throw new Error(`${path}.${key}: additional property`);
    for (const [key, child] of Object.entries(properties)) if (Object.hasOwn(record, key)) validate(child, record[key], `${path}.${key}`);
  }
  if (schema.type === "array" && !Array.isArray(value)) throw new Error(`${path}: expected array`);
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined && value.length < schema.minItems) throw new Error(`${path}: too few items`);
    if (schema.maxItems !== undefined && value.length > schema.maxItems) throw new Error(`${path}: too many items`);
    if (schema.uniqueItems && new Set(value.map(item => JSON.stringify(item))).size !== value.length) throw new Error(`${path}: duplicate items`);
    if (schema.items) value.forEach((item, index) => validate(schema.items!, item, `${path}[${index}]`));
  }
  if (schema.type === "string" && typeof value !== "string") throw new Error(`${path}: expected string`);
  if (typeof value === "string") {
    const length = [...value].length;
    if (schema.minLength !== undefined && length < schema.minLength) throw new Error(`${path}: string too short`);
    if (schema.maxLength !== undefined && length > schema.maxLength) throw new Error(`${path}: string too long`);
    if (schema.pattern && !new RegExp(schema.pattern).test(value)) throw new Error(`${path}: pattern mismatch`);
  }
  for (const child of schema.allOf ?? []) validate(child, value, path);
  if (schema.if) {
    let matches = true;
    try { validate(schema.if, value, path); } catch { matches = false; }
    const branch = matches ? schema.then : schema.else;
    if (branch) validate(branch, value, path);
  }
}
const invalidCase = (scenario: InjectionScenario, patch: Record<string, unknown>): unknown => ({ ...scenario, ...patch });

test("loads all 22 inert cases and validates the corpus against its published JSON Schema", () => {
  expect(() => validate(injectionSchema, injectionCorpus)).not.toThrow();
  expect(injectionCorpus.cases).toHaveLength(22);
  expect(injectionCorpus.cases.filter(item => item.classification === "injection")).toHaveLength(18);
  expect(injectionCorpus.cases.filter(item => item.classification === "benign")).toHaveLength(4);
  expect(new Set(injectionCorpus.cases.map(item => item.case_id)).size).toBe(injectionCorpus.cases.length);
});
test("every corpus ID has an explicit executed, partial, or unavailable disposition", () => {
  const caseIds = injectionCorpus.cases.map(item => item.case_id).sort();
  expect(Object.keys(scenarioCoverage).sort()).toEqual(caseIds);
  const dispositions = Object.values(scenarioCoverage);
  expect(dispositions.filter(item => item.status === "exercised")).toHaveLength(6);
  expect(dispositions.filter(item => item.status === "partial")).toHaveLength(2);
  expect(dispositions.filter(item => item.status === "not-exercised")).toHaveLength(14);
  for (const item of dispositions.filter(item => item.status !== "exercised")) expect(item.limitation).toBeTruthy();
});

test("schema validation rejects malformed and over-broad corpus entries", () => {
  const sample = injectionCorpus.cases[0]!;
  for (const value of [invalidCase(sample, { case_id: "PI-X" }), invalidCase(sample, { extra: true }),
    invalidCase(sample, { classification: "injection", deny_actions: [] }),
    invalidCase(sample, { rule_ids: [...sample.rule_ids, sample.rule_ids[0]] })]) {
    expect(() => validate(injectionSchema.properties!.cases!.items!, value)).toThrow();
  }
});
