import { fail } from "../../shared/index";
import { MEDIA_LIMITS } from "./media-types";
export async function boundedBytes(stream: ReadableStream<Uint8Array> | null, maximum = MEDIA_LIMITS.uploadBytes): Promise<Uint8Array<ArrayBuffer>> {
  if (!stream) fail(422, "INVALID_IMAGE");
  const reader = stream.getReader(), chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read(); if (next.done) break;
      size += next.value.byteLength;
      if (size > maximum) { await reader.cancel(); fail(413, "IMAGE_TOO_LARGE"); }
      chunks.push(next.value);
    }
  } finally { reader.releaseLock(); }
  if (!size) fail(422, "INVALID_IMAGE");
  const bytes = new Uint8Array(size); let offset = 0;
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
  return bytes;
}
