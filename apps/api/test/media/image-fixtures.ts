import { bindings, png } from "./helpers";
function crc32(bytes: Uint8Array) { let crc = 0xffffffff; for (const byte of bytes) { crc ^= byte; for (let bit=0;bit<8;bit++) crc = (crc>>>1)^((crc&1)?0xedb88320:0); } return (crc^0xffffffff)>>>0; }
function chunk(name: string, value: Uint8Array): Uint8Array<ArrayBuffer> {
  const bytes = new Uint8Array(value.length + 12), view = new DataView(bytes.buffer);
  view.setUint32(0, value.length); bytes.set(new TextEncoder().encode(name), 4); bytes.set(value, 8);
  view.setUint32(bytes.length - 4, crc32(bytes.subarray(4,-4))); return bytes;
}
export function metadataPng(): Uint8Array<ArrayBuffer> {
  const original = png(), text = chunk("tEXt", new TextEncoder().encode("Comment\0synthetic-GPS-metadata-never-real-location"));
  const out = new Uint8Array(original.length + text.length); out.set(original.subarray(0,-12)); out.set(text, original.length-12); out.set(original.subarray(-12), original.length-12+text.length); return out;
}
export function animatedPng(): Uint8Array<ArrayBuffer> {
  const original = png(), animation = chunk("acTL", new Uint8Array([0,0,0,2,0,0,0,0]));
  const out = new Uint8Array(original.length + animation.length); out.set(original.subarray(0,33)); out.set(animation,33); out.set(original.subarray(33),33+animation.length); return out;
}
export function dimensionPng(width: number): Uint8Array<ArrayBuffer> {
  const bytes = png(), view = new DataView(bytes.buffer); view.setUint32(16,width); view.setUint32(29,crc32(bytes.subarray(12,29))); return bytes;
}
export async function orientedJpeg(orientation = 6): Promise<Uint8Array<ArrayBuffer>> {
  const output = await bindings.IMAGES!.input(new Blob([png()]).stream()).output({ format: "image/jpeg" });
  const jpeg = new Uint8Array(await new Response(output.image()).arrayBuffer());
  const exif = new Uint8Array(32); exif.set(new TextEncoder().encode("Exif\0\0II"));
  const view = new DataView(exif.buffer); view.setUint16(8,42,true); view.setUint32(10,8,true); view.setUint16(14,1,true);
  view.setUint16(16,0x0112,true); view.setUint16(18,3,true); view.setUint32(20,1,true); view.setUint16(24,orientation,true);
  const segment = new Uint8Array(exif.length + 4); segment.set([0xff,0xe1]); new DataView(segment.buffer).setUint16(2,exif.length+2); segment.set(exif,4);
  const result = new Uint8Array(jpeg.length+segment.length); result.set(jpeg.subarray(0,2)); result.set(segment,2); result.set(jpeg.subarray(2),2+segment.length); return result;
}
