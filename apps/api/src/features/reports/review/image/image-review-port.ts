import type { ImageReviewJob, ImageReviewModelOutput } from "@floodops/contracts";
import type { SessionRequestContext } from "../../../../shared/index.ts";

/** Private server-owned media input, never a public URL or client-supplied digest. */
export interface NormalizedReviewImage {
  readonly input_digest: string;
  readonly normalized_hash: string;
  readonly content_type: "image/jpeg" | "image/png";
  readonly bytes: Uint8Array;
  readonly description: string;
}
/** Sources integration must authorize and verify normalized ownership/readiness. */
export interface ImageReviewMediaPort {
  read(context: SessionRequestContext, expected: ImageReviewJob, signal: AbortSignal): Promise<NormalizedReviewImage>;
}
export type ImageReviewFailure = NonNullable<ImageReviewJob["error_code"]>;
export type ImageReviewOutcome = { output: ImageReviewModelOutput } | { error_code: ImageReviewFailure };
export interface ImageReviewPort {
  review(input: { readonly model: string; readonly image: NormalizedReviewImage }, signal: AbortSignal): Promise<ImageReviewOutcome>;
}
/** Every effective value belongs in the service's model-config hash. */
export interface ResponsesImageReviewConfig {
  readonly enabled: boolean;
  readonly apiKey: string | null;
  readonly model: string | null;
  readonly maxOutputTokens: number;
  readonly maxImageBytes: number;
  readonly maxResponseBytes: number;
  readonly timeoutMs: number;
}

export type ImageReviewFetch = (input: string | URL | Request, init?: RequestInit) => Promise<Response>;
