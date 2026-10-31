import { describe, expect, test } from "bun:test";
import { schemas, operations, tools, parseSchema, parseToolInput, parseOperationInput,
  parseEtag, formatEtag, getToolDefinitions, getImageReviewModelOutputSchema, UnsupportedToolSchemaError } from "../src";
import definition from "../definition/contract-definition.json";

const cases = definition["contract-examples.json"].examples;
for (const example of cases) {
  test(`wire example: ${example.name}`, () => {
    const parse = () => parseSchema(example.schema as keyof typeof schemas, example.payload);
    if (example.valid) expect(parse).not.toThrow();
    else expect(parse).toThrow();
  });
}
for (const example of definition["tool-examples.json"].examples) {
  test(`Commander example: ${example.name}`, () => {
    const parse = () => parseToolInput(example.tool as keyof typeof tools, example.payload);
    if (example.valid) expect(parse).not.toThrow();
    else expect(parse).toThrow();
  });
}
describe("contract boundary", () => {
  test("complete inventory and dispatcher-only advisory operations", () => {
    expect(Object.keys(schemas)).toHaveLength(194);
    expect(Object.keys(operations)).toHaveLength(66);
    expect(Object.keys(tools)).toHaveLength(8);
    expect(operations.createReportImageReview.roles).toEqual(["dispatcher"]);
    expect(operations.createReportImageReview.requiresRevision).toBe(false);
    expect(operations.getReportImageReview.roles).toEqual(["dispatcher"]);
    const input = { path: { session_id: "session_test0001", report_id: "report_test0001" },
      headers: { "Idempotency-Key": "key_test_000000000001" }, body: {} };
    expect(parseOperationInput("createReportImageReview", input).body).toEqual({});
    for (const body of [null, { model: "override" }, { quality_score: 100 }, { role: "dispatcher" },
      { image_url: "https://example.invalid/photo" }, { threshold: 0 }]) {
      expect(() => parseOperationInput("createReportImageReview", { ...input, body })).toThrow();
    }
    expect(() => parseOperationInput("createReportImageReview", { ...input, headers: {} })).toThrow();
    expect(() => parseOperationInput("createReportImageReview", { ...input, headers: { ...input.headers, "If-Match": formatEtag({ session_id: "session_test0001", generation: 1, revision: 2 }) } })).toThrow();
  });
  test("strict unknown keys, finite numbers, nullable and Unicode bounds", () => {
    expect(() => parseSchema("AdvanceInput", { target_sim_minute: NaN })).toThrow();
    expect(() => parseSchema("AdvanceInput", { target_sim_minute: Infinity })).toThrow();
    expect(() => parseSchema("AdvanceInput", { target_sim_minute: 1, execute: true })).toThrow();
    expect(() => parseSchema("AdvanceInput", null)).toThrow();
    expect(parseSchema("ImageReviewState", { report_id: "report_test0001", job: null }).job).toBeNull();
    expect(() => parseSchema("Timestamp", "2026-02-30T12:00:00Z")).toThrow();
    expect(parseSchema("Timestamp", "2024-02-29T12:00:00+07:00")).toBeString();
  });
  test("strong ETags bind session, generation and revision without unsafe integers", () => {
    const version = { session_id: "session_test0001", generation: 4, revision: 9 };
    expect(parseEtag(formatEtag(version))).toEqual(version);
    for (const tag of ['W/"s:session_test0001:g:4:r:9"', '"s:session_test0001:g:4:r:9007199254740992"', '"s:session_test0001:g:4:r:-1"']) {
      expect(() => parseEtag(tag)).toThrow();
    }
  });
  test("provider definitions resolve local refs, remain strict and fail closed by dialect", () => {
    const model = getImageReviewModelOutputSchema();
    expect(model.additionalProperties).toBe(false);
    expect(model.properties.quality_ratings.additionalProperties).toBe(false);
    const text = JSON.stringify(model);
    for (const forbidden of ['"$ref"', '"quality_score"', '"recommendation"', '"execute"']) expect(text).not.toContain(forbidden);
    expect(getToolDefinitions()).toHaveLength(8);
    expect(() => getImageReviewModelOutputSchema(new Set(["type"])) ).toThrow(UnsupportedToolSchemaError);
    model.required.length = 0;
    expect(getImageReviewModelOutputSchema().required).toHaveLength(5);
  });
});
