import { z } from "zod";
import { IdSchema } from "./id";
import { ProvenanceSchema } from "./provenance";

export const FixtureAssetSchema = z.strictObject({
  "asset_id": IdSchema,
  "fixture_photo_id": z.union([IdSchema, z.null()]),
  "content_type": z.literal(["image/jpeg","image/png"]),
  "sha256": z.string().regex(new RegExp("^[a-f0-9]{64}$")),
  "byte_length": z.number().finite().refine(Number.isInteger, "Expected integer").min(1),
  "width": z.number().finite().refine(Number.isInteger, "Expected integer").min(1),
  "height": z.number().finite().refine(Number.isInteger, "Expected integer").min(1),
  "provenance": ProvenanceSchema,
});
export type FixtureAsset = z.infer<typeof FixtureAssetSchema>;
