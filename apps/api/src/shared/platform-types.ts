import type { Context } from "hono";
import type { SessionMeta, Participant, Permission, Role, Event, ImageReviewJob } from "@floodops/contracts";
import type { SessionDO } from "../session-runtime/session-object";
export interface PlatformBindings {
  SESSIONS: DurableObjectNamespace<SessionDO>;
  REPORT_MEDIA?: R2Bucket;
  WEB_ORIGIN: string;
  APP_ENV: string;
  /** Sessions one client address may create per hour. Integer 1..1000, default 10; raise it for demos. */
  CREATE_LIMIT_PER_HOUR?: string;
  OPENAI_API_KEY?: string;
  OPENAI_IMAGE_REVIEW_MODEL?: string;
  OPENAI_IMAGE_REVIEW_ENABLED?: string;
  OPENAI_IMAGE_REVIEW_MAX_OUTPUT_TOKENS?: string;
  SESSION_LOCATOR_KEY: string;
  CAPABILITY_SEAL_KEY_ACTIVE: string;
  CAPABILITY_SEAL_KEY_ID: string;
  CAPABILITY_SEAL_KEYS?: string;
}
export type AppEnv = { Bindings: PlatformBindings; Variables: { requestId: string } };
export type AppContext = Context<AppEnv>;
export interface AuthProof { token: string; transport: "cookie" | "bearer"; origin: string | null; csrf: string | null }
export interface Proof extends AuthProof { tokenDigest: string; csrfDigest: string | null; derivedCsrf: string | null }
export interface Call {
  kind: string; sessionId: string; requestId: string; auth?: AuthProof;
  key?: string; ifMatch?: string | null; name?: string; path?: string;
  payload?: unknown; expectedPointers?: Record<string, string | null>; fence?: { lease_id: string; nonce: string }; after?: number; limit?: number; streamId?: string;
}
export interface Envelope { success: boolean; data: unknown; error: unknown; meta: Record<string, unknown> }
export interface Reply {
  status: number; body: Envelope; credential?: { box: string; aad: string; type: "web" | "native" | "invite" };
  clearCookie?: boolean; effect?: { job_id: string; lease: string }; retryAfter?: number;
}
export type BackgroundDriverKind = "planning" | "evaluation";
export type BackgroundDriver = (dispatch: (call: Call) => Promise<Reply>, call: Call, reply: Reply) => Promise<void>;
export type BackgroundDrivers = Partial<Record<BackgroundDriverKind, BackgroundDriver>>;

export interface StoredParticipant { participant: Participant; digest: string; csrfDigest: string | null; transport: "web" | "native"; revoked: boolean }
export interface SessionSeed {
  scenario_id: string; scenario_version: string; horizon_minute: number;
  calibration_status: SessionMeta["calibration_status"];
  entities: { driver: string[]; contributor: string[] }; values: Record<string, unknown>;
}
export interface DurableLease { lease_id: string; job_id: string; kind: "planning" | "advance"; generation: number; revision: number; bind_revision: boolean; nonce_digest: string; expires_at: number; status: "active" | "completed" | "failed" | "superseded"; error_code: string | null }
export interface Snapshot { meta: SessionMeta; values: Record<string, unknown>; seed: SessionSeed; absoluteExpiry: number; pointers: Record<string, string | null>; leases: Record<string, DurableLease> }
export interface Actor { participant: Participant }
export interface TransitionContext { snapshot: Snapshot; actor: Actor; now: number }
export interface EventInput { type: Event["type"]; resource_ids?: string[]; reason_code?: string | null; audience?: Role[]; participantIds?: string[]; replacement_session_id?: string }
export interface Transition { pointers?: Record<string, string | null>; leases?: DurableLease[]; data: unknown; values?: Record<string, unknown>; events?: EventInput[]; mediaKeys?: string[]; cleanupKeys?: string[]; status?: SessionMeta["status"]; simMinute?: number }
export interface ReducerDefinition {
  permission: Permission; operational: boolean; requireCas?: boolean; validate: (value: unknown) => unknown;
  reduce: (context: TransitionContext, input: unknown) => Transition;
}
export interface ViewDefinition { permission: Permission; roles: Role[]; project: (context: TransitionContext) => unknown }
export interface ImageBinding { report_id: string; input_digest: string; model: string; model_config_hash: string; rubric_version: "image-quality-v1"; pending: boolean }
export interface RuntimeRegistry {
  serialization?: string; seedForReset?: (previous: SessionSeed) => SessionSeed;
  commands?: Record<string, ReducerDefinition>; views?: Record<string, ViewDefinition>;
  drivers?: BackgroundDrivers;
  onLeaseExpired?: (snapshot: Snapshot, lease: DurableLease, now: number) => Record<string, unknown>;
  imageBinding?: (snapshot: Snapshot, reportId: string) => ImageBinding | null;
}
export interface ImageRecord { job: ImageReviewJob; leaseDigest: string; leaseExpires: number; started: boolean }
export interface PlatformPorts {
  loadScenario: (id: string, version: string) => Promise<SessionSeed>;
  clientAddress?: (request: Request) => string | null;
}
