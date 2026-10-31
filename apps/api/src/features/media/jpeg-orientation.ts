/** Only orientation is used for pixel geometry; EXIF/GPS is stripped by the decoder, never used as evidence. */
export function jpegOrientation(bytes: Uint8Array): number {
  if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return 1;
  const data = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  let offset = 2;
  while (offset + 4 <= bytes.length && bytes[offset] === 0xff) {
    const marker = bytes[offset + 1], size = data.getUint16(offset + 2);
    if (!marker || marker === 0xda || marker === 0xd9 || size < 2 || offset + size + 2 > bytes.length) break;
    const base = offset + 10;
    if (marker === 0xe1 && String.fromCharCode(...bytes.subarray(offset + 4, offset + 10)) === "Exif\0\0" && base + 8 <= bytes.length) {
      const little = bytes[base] === 0x49 && bytes[base + 1] === 0x49;
      if (!little && !(bytes[base] === 0x4d && bytes[base + 1] === 0x4d)) return 1;
      const directory = base + data.getUint32(base + 4, little), end = offset + 2 + size;
      if (directory < base + 8 || directory + 2 > end) return 1;
      const count = data.getUint16(directory, little);
      for (let i = 0; i < count; i++) {
        const entry = directory + 2 + 12 * i; if (entry + 12 > end) return 1;
        if (data.getUint16(entry, little) === 0x0112 && data.getUint16(entry + 2, little) === 3 && data.getUint32(entry + 4, little) === 1) {
          const orientation = data.getUint16(entry + 8, little); return orientation >= 1 && orientation <= 8 ? orientation : 1;
        }
      }
    }
    offset += size + 2;
  }
  return 1;
}
