import { useRef, useState } from "react";
import { Text, View } from "react-native";
import { Alert, Button, Form, TextArea, TextField } from "@floodops/ui-native";
import type { CitizenReportInput, DriverReportInput, VehicleType } from "@floodops/contracts";
import { commandReason, sameSession, type MobileContext } from "../../shared/session-context";
import { CommandButton, ScreenFrame, screenStyles } from "../../shared/screen-frame";
import { buildReportInput, draftNeedsRelink, relinkDraft, type DraftPort, type PhotoPort, type ReportDraft } from "./report-draft";
export interface ReportFormProps {
  context: MobileContext; initialDraft: ReportDraft; photoPort?: PhotoPort; draftPort?: DraftPort;
  onSubmit?: (input: CitizenReportInput | DriverReportInput) => Promise<void>;
}
export function ReportForm({ context, initialDraft, photoPort, draftPort, onSubmit }: ReportFormProps) {
  const [draft, setDraft] = useState(initialDraft);
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const lock = useRef(false);
  const current = useRef(context); current.current = context;
  const stale = draftNeedsRelink(draft, context);
  const baseReason = commandReason(context, "reports:submit", ["driver", "contributor"]);
  const reason = baseReason ?? (stale ? "Stale session—review before re-link." : !onSubmit ? "Report submission adapter unavailable." : null);
  function field(key: "segment" | "longitude" | "latitude" | "capturedAt" | "simMinute" | "description", value: string) {
    setDraft(valueDraft => ({ ...valueDraft, [key]: value })); setMessage(null);
  }
  async function run(action: () => Promise<void>) {
    if (lock.current) return;
    lock.current = true; setBusy(true);
    try { await action(); } catch { setMessage("Action unavailable or rejected. Your draft is preserved; review and try again explicitly."); }
    finally { lock.current = false; setBusy(false); }
  }
  function stillCurrent(start: MobileContext) {
    return sameSession(start.session, current.current.session) && start.participant.participant_id === current.current.participant.participant_id &&
      start.session.revision === current.current.session.revision;
  }
  async function pickPhoto() {
    const start = context;
    if (!photoPort) { setMessage("Photo selection unavailable. Your draft is preserved."); return; }
    const result = await photoPort.pick();
    if (!stillCurrent(start)) { setMessage("Session changed. Your original draft is preserved for review."); return; }
    if (result.kind === "selected") { setDraft(value => ({ ...value, photo: result.photo, fixturePhotoId: null })); setMessage("Photo selected locally. It has not been submitted."); }
    else setMessage(`Photo ${result.kind}. Your draft is preserved.`);
  }
  async function submit() {
    if (reason || !onSubmit) return;
    const start = context;
    let input: CitizenReportInput | DriverReportInput;
    try {
      let mediaId: string | null = null;
      if (draft.photo) {
        if (!photoPort?.prepare) { setMessage("Photo upload adapter unavailable. Your draft is preserved."); return; }
        mediaId = (await photoPort.prepare(draft.photo, start)).mediaId;
      }
      if (!stillCurrent(start) || commandReason(current.current, "reports:submit", ["driver", "contributor"])) {
        setMessage("Session changed. Refresh and review before sending this draft."); return;
      }
      input = buildReportInput(draft, current.current, mediaId);
    } catch (error) { setMessage(error instanceof Error && error.name !== "ZodError" ? error.message : "Check location, capture time, vehicle and report fields."); return; }
    await onSubmit(input);
    if (!stillCurrent(start) || commandReason(current.current, "reports:submit", ["driver", "contributor"])) {
      setMessage("Session changed during submission. Inspect the original server report; this draft requires review before reuse."); return;
    }
    setMessage("Report submitted to the server. Review status and any award come from a refreshed authorized view.");
  }
  function vehicle(type: VehicleType) {
    if (lock.current) return;
    setDraft(value => ({ ...value, vehicles: value.vehicles.includes(type) ? value.vehicles.filter(v => v !== type) : [...value.vehicles, type] }));
  }
  return <ScreenFrame title={draft.kind === "driver" ? "Driver road report" : "Community photo report"} context={context}>
    {stale && <><Alert title="Stale session—review before re-link">Capture metadata is preserved. Review it before explicitly linking this draft to the current session.</Alert>
      <CommandButton label="Re-link reviewed draft" reason={baseReason} onPress={() => {
        try { setDraft(relinkDraft(draft, context)); setMessage("Draft re-linked. Review the capture fields, then send explicitly."); }
        catch { setMessage("This draft belongs to a different workspace."); }
      }} /></>}
    <Form><TextField label="Road segment" value={draft.segment} editable={!busy} onChangeText={value => field("segment", value)} hint="Manual segment selection; no GPS tracking." />
      <TextField label="Longitude" value={draft.longitude} editable={!busy} onChangeText={value => field("longitude", value)} keyboardType="decimal-pad" />
      <TextField label="Latitude" value={draft.latitude} editable={!busy} onChangeText={value => field("latitude", value)} keyboardType="decimal-pad" />
      <TextField label="Capture time" value={draft.capturedAt} editable={!busy} onChangeText={value => field("capturedAt", value)} hint="RFC3339 timestamp" />
      <TextField label="Capture simulation minute" value={draft.simMinute} editable={!busy} onChangeText={value => field("simMinute", value)} keyboardType="decimal-pad" />
      <TextArea label="Description" value={draft.description} editable={!busy} onChangeText={value => field("description", value)} maxLength={2000} />
      <View style={screenStyles.group}><Text>Vehicle scope: {draft.vehicles.join(", ") || "Unknown"}</Text>
        {(["motorbike", "car"] as const).map(type => <Button key={type} label={`Toggle ${type}`} {...(busy ? { disabled: true, disabledReason: "Wait for the current action." } : { disabled: false })} accessibilityState={{ selected: draft.vehicles.includes(type) }} onPress={() => vehicle(type)} />)}
      </View>
      {draft.kind === "driver" && <View style={screenStyles.group}>
        <Text>Quick condition: {draft.quick ?? "Text report"}</Text>
        <Button label="Dry road" {...(busy ? { disabled: true, disabledReason: "Wait for the current action." } : { disabled: false })} onPress={() => setDraft(value => ({ ...value, quick: "normal" }))} />
        <Button label="Passable with caution" {...(busy ? { disabled: true, disabledReason: "Wait for the current action." } : { disabled: false })} onPress={() => setDraft(value => ({ ...value, quick: "caution" }))} />
        <Button label="Deep water / impassable" {...(busy ? { disabled: true, disabledReason: "Wait for the current action." } : { disabled: false })} onPress={() => setDraft(value => ({ ...value, quick: "impassable" }))} />
        <Button label="Use text report" {...(busy ? { disabled: true, disabledReason: "Wait for the current action." } : { disabled: false })} onPress={() => setDraft(value => ({ ...value, quick: null }))} />
      </View>}
      {draft.kind === "citizen" && <><CommandButton label="Choose photo" reason={busy ? "Wait for the current action." : null} onPress={() => void run(pickPhoto)} />
        <Text>{draft.photo ? `Local photo: ${draft.photo.label}` : draft.fixturePhotoId ? `Permitted fixture: ${draft.fixturePhotoId}` : "No photo selected"}</Text></>}
      <CommandButton label="Save draft" reason={!draftPort ? "App-private draft storage adapter unavailable." : busy ? "Wait for the current action." : null}
        onPress={() => void run(async () => { if (draftPort) { const start = context; await draftPort.save(draft); if (stillCurrent(start)) setMessage("Draft saved privately. It will never send automatically."); } })} />
      <CommandButton label="Send report" reason={reason} pending={busy} onPress={() => void run(submit)} />
      {message && <Alert title="Report status">{message}</Alert>}
    </Form>
  </ScreenFrame>;
}
