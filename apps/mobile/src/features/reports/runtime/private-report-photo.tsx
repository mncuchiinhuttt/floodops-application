import { Image, Text } from "react-native";
import { File, Directory, Paths } from "expo-file-system";
import { IdSchema } from "@floodops/contracts";
import { useNativeRuntime } from "../../session/runtime/native-runtime";
import { useResource } from "../../../shared/native/runtime-resource";
import type { MobileContext } from "../../../shared/session-context";
export function PrivateReportPhoto({ context, mediaId }: { context: MobileContext; mediaId: string }) {
  const runtime = useNativeRuntime();
  const query = useResource(context, ["private-image", mediaId], async (api, options) => {
    IdSchema.parse(mediaId);
    const result = await api.request("getMedia", { path: { session_id: context.session.session_id, media_id: mediaId } }, options);
    if (options.signal?.aborted || runtime.context?.participant.participant_id !== context.participant.participant_id) throw new Error("Private media owner changed");
    const dir = new Directory(Paths.cache, "floodops-media", context.participant.participant_id, context.session.session_id, String(context.session.generation));
    dir.create({ intermediates: true, idempotent: true }); const file = new File(dir, `${mediaId}.image`); await file.write(result.body);
    return { value: file.uri, meta: { request_id: result.requestId ?? "native-media", session_id: context.session.session_id, generation: context.session.generation } };
  });
  return query.data && query.status !== "error" ? <Image source={{ uri: query.data }} style={{ width: "100%", height: 240 }} resizeMode="contain" accessibilityLabel="Private normalized road report photo for manual review" />
    : <Text>Private normalized image {query.status === "loading" ? "loading" : "unavailable"}. No placeholder evidence is shown.</Text>;
}
