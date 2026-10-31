import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import { RequestScope, type ApiClient } from "@floodops/api-client";
import { commandReason, sameSession, type MobileContext } from "../../../shared/session-context";
import type { PhotoPort } from "../report-draft";
export function imageContentType(bytes: Uint8Array): "image/jpeg" | "image/png" {
  if (!bytes.length || bytes.length > 5_242_880) throw new Error("Image byte limit exceeded");
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return "image/jpeg";
  if ([137,80,78,71,13,10,26,10].every((byte, index) => bytes[index] === byte)) return "image/png";
  throw new Error("Only JPEG/PNG photos are supported");
}
export function createNativePhotoPort(api: ApiClient, context: () => MobileContext | null, key: () => string): PhotoPort {
  return {
    async pick() {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) return { kind: "denied" };
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ["images"], allowsMultipleSelection: false, exif: false, base64: false });
      if (result.canceled) return { kind: "cancelled" };
      const asset = result.assets[0];
      if (!asset || !asset.uri.startsWith("file://") || (asset.mimeType && !["image/jpeg", "image/png"].includes(asset.mimeType))) return { kind: "unavailable" };
      return { kind: "selected", photo: { handle: asset.uri, label: "Selected local photo" } };
    },
    async prepare(photo, captured) {
      const current = context();
      if (!current || !sameSession(current.session, captured.session) || current.participant.participant_id !== captured.participant.participant_id || commandReason(current, "media:write")) throw new Error("Refresh authorized media scope");
      if (!photo.handle.startsWith("file://")) throw new Error("Only local images are accepted");
      const file = new File(photo.handle);
      if (file.size > 5_242_880 || file.size < 1) throw new Error("Image byte limit exceeded");
      const bytes = await file.bytes(); const contentType = imageContentType(bytes);
      const scope = new RequestScope(current.session.session_id, current.session.generation);
      const path = { session_id: current.session.session_id };
      const check = () => { const next = context(); if (!next || !sameSession(next.session, current.session) || next.participant.participant_id !== current.participant.participant_id || commandReason(next, "media:write")) { scope.cancel(); throw new Error("Media owner changed"); } };
      try {
        check(); const reserve = await api.request("reserveMediaUpload", { path, headers: { "Idempotency-Key": key() }, body: { content_type: contentType, byte_length: bytes.byteLength, original_filename: contentType === "image/jpeg" ? "report.jpg" : "report.png" } }, { scope });
        check(); const uploadPath = { ...path, upload_id: reserve.body.data.upload_id };
        await api.request("uploadMediaContent", { path: uploadPath, headers: { "Idempotency-Key": key() }, body: bytes }, { scope });
        check(); const complete = await api.request("completeMediaUpload", { path: uploadPath, headers: { "Idempotency-Key": key() }, body: { confirm_uploaded: true } }, { scope });
        check(); return { mediaId: complete.body.data.media_id };
      } finally { scope.cancel(); }
    },
  };
}
