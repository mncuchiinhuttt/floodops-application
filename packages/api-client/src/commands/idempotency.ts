export type EntropySource = (buffer: Uint8Array<ArrayBuffer>) => void;
/** At least 128 bits of CSPRNG entropy; keep the returned key with the exact command. */
export function createIdempotencyKey(entropy: EntropySource = bytes => crypto.getRandomValues(bytes)): string {
  const bytes = new Uint8Array(16);
  entropy(bytes);
  return [...bytes].map(byte => byte.toString(16).padStart(2, "0")).join("");
}
export function createClientRequestScope(entropy?: EntropySource): string {
  return createIdempotencyKey(entropy);
}
