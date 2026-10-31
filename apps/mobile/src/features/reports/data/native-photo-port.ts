import { currentMediaContext, uploadReportImage } from "./media-upload";
export { imageContentType } from "./media-upload";
import * as ImagePicker from "expo-image-picker";
import { File } from "expo-file-system";
import type { ApiClient } from "@floodops/api-client";
import type { MobileContext } from "../../../shared/session-context";
import type { PhotoPort } from "../report-draft";
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
      currentMediaContext(context, captured);
      if (!photo.handle.startsWith("file://")) throw new Error("Only local images are accepted");
      const file = new File(photo.handle);
      if (file.size > 5_242_880 || file.size < 1) throw new Error("Image byte limit exceeded");
      const bytes = await file.bytes();
      // Recheck after file IO before issuing any request for the captured principal.
      const latest = context();
      if (!latest || latest.participant.participant_id !== captured.participant.participant_id) throw new Error("Media owner changed");
      return uploadReportImage(api, bytes, context, captured, key);
    },
  };
}
