import { useState } from "react";
import { Text } from "react-native";
import { Button } from "@floodops/ui-native";
import { useNativeRuntime } from "../../session/runtime/native-runtime";
import { useNativeQuery } from "../../../shared/native/use-native-query";
import { createFileDraftPort, retainedDrafts } from "../data/file-draft-store";
import { createNativePhotoPort } from "../data/native-photo-port";
import { newReportDraft, type ReportDraft } from "../report-draft";
import { ReportForm } from "../report-form";
import { nativeKey } from "../../../shared/native/random-key";
import { ResourceBoundary } from "../../../shared/native/runtime-resource";
import type { MobileContext } from "../../../shared/session-context";
function OwnedReportEditor({ context }: { context: MobileContext }) {
  const runtime = useNativeRuntime();
  const [retained, setRetained] = useState<ReportDraft[]>([]), [selected, setSelected] = useState<ReportDraft | null>(null);
  const port = createFileDraftPort({ session_id: context.session.session_id, generation: context.session.generation, participantId: context.participant.participant_id });
  // This private filesystem read remains available offline; it never dispatches a command.
  const draft = useNativeQuery({ ...context, online: true }, ["private-draft"], async () => ({ value: await port.load() ?? newReportDraft(context, new Date().toISOString()), session: context.session }));
  const photoPort = createNativePhotoPort(runtime.service.api, runtime.getContext, nativeKey);
  return <ResourceBoundary title="Private report draft" context={context} query={draft}>{value => <>
    <Button label="Review retained drafts for this principal" onPress={() => void retainedDrafts(context.participant.participant_id).then(setRetained).catch(() => setRetained([]))} />
    {retained.map((item, index) => <Button key={`${item.session_id}:${item.generation}`} label={`Review retained draft ${index + 1} · generation ${item.generation}`} onPress={() => setSelected(item)} />)}
    <Text>Drafts are app-private and principal-scoped. Retained captures never auto-send.</Text>
    <ReportForm key={`${context.participant.participant_id}:${selected?.session_id ?? value.session_id}:${selected?.generation ?? value.generation}`}
      context={context} initialDraft={selected ?? value} draftPort={port} photoPort={photoPort}
      onSubmit={async input => { if (!runtime.client) throw new Error("Rejoin required"); await runtime.client.submitReport(input, nativeKey()); await runtime.refresh(); }} />
  </>}</ResourceBoundary>;
}

export function ReportEditor({ context }: { context: MobileContext }) {
  return <OwnedReportEditor key={context.participant.participant_id} context={context} />;
}
