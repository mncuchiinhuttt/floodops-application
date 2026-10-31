import { captureTime } from "../capture-time";
import { ScreenFrame } from "../../../shared/screen-frame";
import { useState } from "react";
import { Text } from "react-native";
import { Alert, Button, Skeleton } from "@floodops/ui-native";
import { useNativeRuntime } from "../../session/runtime/native-runtime";
import { usePrivateDraft } from "../data/use-private-draft";
import { createFileDraftPort, retainedDrafts } from "../data/file-draft-store";
import { createNativePhotoPort } from "../data/native-photo-port";
import { newReportDraft, type ReportDraft } from "../report-draft";
import { ReportForm } from "../report-form";
import { nativeKey } from "../../../shared/native/random-key";
import { useResource } from "../../../shared/native/runtime-resource";
import type { MobileContext } from "../../../shared/session-context";
function OwnedReportEditor({ context }: { context: MobileContext }) {
  const runtime = useNativeRuntime();
  const [retained, setRetained] = useState<ReportDraft[]>([]), [selected, setSelected] = useState<ReportDraft | null>(null);
  const owner = { session_id: context.session.session_id, generation: context.session.generation, participantId: context.participant.participant_id };
  const { query: draft, port } = usePrivateDraft(owner, createFileDraftPort(owner));
  const config = useResource(context, ["report-configuration"], async (api, options) => {
    const result = await api.request("getSessionConfiguration", { path: { session_id: context.session.session_id } }, options);
    return { value: result.body.data, meta: result.body.meta };
  });
  const freshDraft = () => {
    if (!config.data) throw new Error("Scenario capture configuration unavailable");
    return newReportDraft(context, captureTime(config.data.t0, context.session.sim_minute));
  };
  const initial = selected ?? (draft.isSuccess ? draft.data ?? (config.data ? freshDraft() : null) : null);
  const photoPort = createNativePhotoPort(runtime.service.api, runtime.getContext, nativeKey);
  return <>
    <Button label="Review retained drafts for this principal" onPress={() => void retainedDrafts(context.participant.participant_id).then(setRetained).catch(() => setRetained([]))} />
    {retained.map((item, index) => <Button key={`${item.session_id}:${item.generation}`} label={`Review retained draft ${index + 1} · generation ${item.generation}`} onPress={() => setSelected(item)} />)}
    <Text>Drafts are app-private and principal-scoped. Retained captures never auto-send.</Text>
    {initial ? <ReportForm key={`${context.participant.participant_id}:${initial.session_id}:${initial.generation}`}
      context={context} initialDraft={initial} createNewDraft={config.data ? freshDraft : undefined} draftPort={port} photoPort={photoPort}
      onSubmit={async input => { if (!runtime.client) throw new Error("Rejoin required"); const result = await runtime.client.submitReport(input, nativeKey()); void runtime.refresh().catch(() => undefined); return result.body.data; }} />
      : <ScreenFrame title="Report capture configuration" context={context}>
        {draft.isPending || (draft.isSuccess && draft.data === null && config.status === "loading") ? <Skeleton label="Loading private draft and authorized scenario clock" />
          : <Alert title="Capture defaults unavailable">{draft.isError ? "Private draft storage unavailable. Existing captures were not replaced." : config.message ?? "Reconnect to load the authorized scenario clock, or explicitly review a retained private draft."}</Alert>}
      </ScreenFrame>}
  </>;
}

export function ReportEditor({ context }: { context: MobileContext }) {
  return <OwnedReportEditor key={context.participant.participant_id} context={context} />;
}
