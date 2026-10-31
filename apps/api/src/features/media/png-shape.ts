import { fail } from "../../shared/index";
import type { ImageShape } from "./media-types";
function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const value of bytes) { crc ^= value; for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0); }
  return (crc ^ 0xffffffff) >>> 0;
}
export function pngShape(bytes: Uint8Array): ImageShape {
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 8, width = 0, height = 0, sawData = false, ended = false;
  while (offset < bytes.length) {
    if (offset + 12 > bytes.length) fail(422, "INVALID_IMAGE");
    const size = data.getUint32(offset), end = offset + 12 + size;
    if (end > bytes.length) fail(422, "INVALID_IMAGE");
    const name = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (!/^[A-Za-z]{4}$/.test(name) || ["acTL", "fcTL", "fdAT"].includes(name)) fail(422, "INVALID_IMAGE");
    if (crc32(bytes.subarray(offset + 4, end - 4)) !== data.getUint32(end - 4)) fail(422, "INVALID_IMAGE");
    if (offset === 8 && (name !== "IHDR" || size !== 13)) fail(422, "INVALID_IMAGE");
    if (name === "IHDR") {
      if (width || size !== 13) fail(422, "INVALID_IMAGE");
      width = data.getUint32(offset + 8); height = data.getUint32(offset + 12);
    }
    if (name === "IDAT") sawData = true;
    if (name === "IEND") { if (size !== 0 || end !== bytes.length || !sawData) fail(422, "INVALID_IMAGE"); ended = true; }
    offset = end;
  }
  if (!ended || !width || !height) fail(422, "INVALID_IMAGE");
  return { contentType: "image/png", width, height };
}
