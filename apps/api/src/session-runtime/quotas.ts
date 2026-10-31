import { PlatformError } from "../shared/platform-error";
import type { StoredParticipant } from "../shared/platform-types";
import { Store } from "./store";
export function rateLimit(store: Store, participant: StoredParticipant, now: number): void {
  if (!store.consume(`commands:${participant.participant.participant_id}`, String(Math.floor(now / 60000)), 120)) {
    throw new PlatformError(429, "RATE_LIMITED", "Participant command limit", undefined, Math.ceil((60000 - now % 60000) / 1000));
  }
}
