import * as Crypto from "expo-crypto";
import { createIdempotencyKey } from "@floodops/api-client";
export function nativeKey(): string {
  return createIdempotencyKey(bytes => { Crypto.getRandomValues(bytes); });
}
