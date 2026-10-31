import { fail } from "../../shared/index";
import { boundedBytes } from "./bounded-bytes";
import { MEDIA_LIMITS } from "./media-types";
import type { ImageShape } from "./media-types";
import { pngShape } from "./png-shape";
import { jpegOrientation } from "./jpeg-orientation";
import { jpegShape } from "./jpeg-shape";
export function imageShape(bytes: Uint8Array, declared?: string): ImageShape {
  let shape: ImageShape;
  if (bytes.length >= 8 && [137,80,78,71,13,10,26,10].every((value, i) => bytes[i] === value)) shape = pngShape(bytes);
  else if (bytes[0] === 0xff && bytes[1] === 0xd8) shape = jpegShape(bytes);
  else fail(422, "INVALID_IMAGE");
  if (declared && shape.contentType !== declared) fail(422, "INVALID_IMAGE");
  if (shape.width > MEDIA_LIMITS.dimension || shape.height > MEDIA_LIMITS.dimension) fail(413, "IMAGE_TOO_LARGE");
  return shape;
}
function stream(bytes: Uint8Array<ArrayBuffer>): ReadableStream<Uint8Array> {
  return new Blob([bytes]).stream();
}
export async function normalizeImage(images: ImagesBinding | undefined, bytes: Uint8Array<ArrayBuffer>, declared: string) {
  const before = imageShape(bytes, declared), orientation = jpegOrientation(bytes);
  const expected = [5,6,7,8].includes(orientation) ? { width: before.height, height: before.width } : before;
  if (!images) fail(503, "MEDIA_PROCESSING_UNAVAILABLE");
  try {
    const info = await images.info(stream(bytes));
    if (!("width" in info) || !((info.width === before.width && info.height === before.height) || (info.width === expected.width && info.height === expected.height))) fail(422, "INVALID_IMAGE");
    const output = await images.input(stream(bytes)).output({ format: before.contentType, anim: false });
    const normalized = await boundedBytes(output.image());
    const shape = imageShape(normalized, output.contentType());
    if (shape.width !== expected.width || shape.height !== expected.height) fail(422, "INVALID_IMAGE");
    return { bytes: normalized, ...shape };
  } catch (error) {
    if (error instanceof Error && error.name === "PlatformError") throw error;
    if (error && typeof error === "object" && "code" in error && error.code === 9412) fail(422, "INVALID_IMAGE");
    fail(503, "MEDIA_PROCESSING_UNAVAILABLE");
  }
}
