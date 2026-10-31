import { IdentitySchema, type Identity, type Permission, type ProvenanceLabel, type Role, type SessionMeta } from "@floodops/contracts";

export interface AccessContext { identity: Identity; online: boolean; now: number; provenance?: ProvenanceLabel }
export function accessReason(context: AccessContext, permission: Permission, role?: Role, command = false): string | null {
  const parsed = IdentitySchema.safeParse(context.identity);
  if (!parsed.success) return "Cần ghép nối lại phiên.";
  const { participant, session } = parsed.data;
  if (!Number.isFinite(context.now) || Date.parse(participant.expires_at) <= context.now ||
      Date.parse(session.expires_at) <= context.now || session.status !== "active") return "Phiên không còn khả dụng. Cần ghép nối lại.";
  if ((role && participant.role !== role) || !participant.permissions.includes(permission)) return "Capability hiện tại không cấp quyền này.";
  if (command && !context.online) return "Đang offline. Kết nối lại và xem lại trước khi gửi.";
  return null;
}
export function sameSession(left: SessionMeta, right: SessionMeta): boolean {
  return left.session_id === right.session_id && left.generation === right.generation;
}
export function sameVersion(left: SessionMeta, right: SessionMeta): boolean {
  return sameSession(left, right) && left.revision === right.revision;
}
export function ownDataReason(context: AccessContext, session: SessionMeta, entityId: string): string | null {
  if (!sameVersion(context.identity.session, session)) return "Dữ liệu cũ. Cần làm mới phiên.";
  if (context.identity.participant.bound_entity_id !== entityId) return "Dữ liệu không thuộc capability hiện tại.";
  return null;
}
