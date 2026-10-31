import { expect, test } from "bun:test";
import { imageReviewConfigFromEnv } from "../../src/features/reports/review/image/environment-config";

const enabled = (apiKey: string, overrides: Record<string, string> = {}) => imageReviewConfigFromEnv({
  OPENAI_IMAGE_REVIEW_ENABLED: "true",
  OPENAI_API_KEY: apiKey,
  OPENAI_IMAGE_REVIEW_MODEL: "fixture-compatible-vision-model",
  ...overrides,
});

test("image review is disabled without explicit enablement, key, and model", () => {
  expect(imageReviewConfigFromEnv({})).toEqual({});
  expect(imageReviewConfigFromEnv({ OPENAI_IMAGE_REVIEW_ENABLED: "false", OPENAI_API_KEY: "fixture-key",
    OPENAI_IMAGE_REVIEW_MODEL: "fixture-model" })).toEqual({});
  expect(imageReviewConfigFromEnv({ OPENAI_IMAGE_REVIEW_ENABLED: "TRUE", OPENAI_API_KEY: "fixture-key",
    OPENAI_IMAGE_REVIEW_MODEL: "fixture-model" })).toEqual({});
  expect(imageReviewConfigFromEnv({ OPENAI_IMAGE_REVIEW_ENABLED: "true", OPENAI_IMAGE_REVIEW_MODEL: "fixture-model" })).toEqual({});
  expect(imageReviewConfigFromEnv({ OPENAI_IMAGE_REVIEW_ENABLED: "true", OPENAI_API_KEY: "fixture-key" })).toEqual({});
  expect(imageReviewConfigFromEnv({ OPENAI_IMAGE_REVIEW_ENABLED: "true", OPENAI_API_KEY: "   ",
    OPENAI_IMAGE_REVIEW_MODEL: "fixture-model" })).toEqual({});
});

test("valid settings default to 512 tokens and exclude credentials from the model config hash", () => {
  const settings = enabled("fixture-secret-key");
  expect(settings.providerConfig).toMatchObject({ enabled: true, apiKey: "fixture-secret-key", model: "fixture-compatible-vision-model",
    maxOutputTokens: 512 });
  expect(settings.imageConfig?.model_config_hash).toMatch(/^[a-f0-9]{64}$/);
  expect(settings.imageConfig?.model_config_hash).not.toContain("fixture-secret-key");
  expect(JSON.stringify(settings.imageConfig)).not.toContain("fixture-secret-key");
  expect(enabled("rotated-fixture-secret").imageConfig?.model_config_hash).toBe(settings.imageConfig?.model_config_hash);
});

test.each(["invalid", "0", "-1", "1.5", "1001", "9007199254740992"])("invalid output token count %s disables image review", value => {
  expect(enabled("fixture-secret-key", { OPENAI_IMAGE_REVIEW_MAX_OUTPUT_TOKENS: value })).toEqual({});
});

test.each(["1", "1000"])("accepts output token count %s within the adapter bound", value => {
  expect(enabled("fixture-secret-key", { OPENAI_IMAGE_REVIEW_MAX_OUTPUT_TOKENS: value }).providerConfig?.maxOutputTokens).toBe(Number(value));
});
