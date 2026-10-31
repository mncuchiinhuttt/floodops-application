import { fail } from "../../shared/index";
import type { ImageShape } from "./media-types";
export function jpegShape(bytes: Uint8Array): ImageShape {
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2, width = 0, height = 0, scan = false, ended = false;
  while (offset < bytes.length) {
    if (scan) {
      while (offset < bytes.length && bytes[offset] !== 0xff) offset++;
      if (offset + 1 >= bytes.length) fail(422, "INVALID_IMAGE");
      if (bytes[offset + 1] === 0 || (bytes[offset + 1]! >= 0xd0 && bytes[offset + 1]! <= 0xd7)) { offset += 2; continue; }
    }
    if (bytes[offset++] !== 0xff) fail(422, "INVALID_IMAGE");
    while (bytes[offset] === 0xff) offset++;
    const marker = bytes[offset++];
    if (marker === 0xd9) { ended = offset === bytes.length; break; }
    if (marker === undefined || marker === 0xd8 || marker === 0 || offset + 2 > bytes.length) fail(422, "INVALID_IMAGE");
    const size = view.getUint16(offset);
    if (size < 2 || offset + size > bytes.length) fail(422, "INVALID_IMAGE");
    if (marker === 0xe2 && String.fromCharCode(...bytes.subarray(offset + 2, offset + 6)) === "MPF\0") fail(422, "INVALID_IMAGE");
    if ([0xc0, 0xc1, 0xc2].includes(marker)) {
      if (width || size < 8) fail(422, "INVALID_IMAGE");
      height = view.getUint16(offset + 3); width = view.getUint16(offset + 5);
    } else if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) fail(422, "INVALID_IMAGE");
    scan = marker === 0xda;
    offset += size;
  }
  if (!ended || !width || !height) fail(422, "INVALID_IMAGE");
  return { contentType: "image/jpeg", width, height };
}
