import { useEffect, useRef, useState } from "react";
import type { ComponentRef, ReactNode } from "react";
import { Text, TextInput } from "react-native";
import type { PresentationState } from "@floodops/design-tokens";
import { Button } from "../primitives/button";
import { TextArea } from "../primitives/text-field";
import { StatusBadge } from "../primitives/badge";
import { Card } from "../primitives/content";
import { styles } from "../primitives/styles";
import { ErrorSummary, Form } from "./form";
import type { FormError } from "./form";
export function ReportForm({ caption, onCaptionChange, onSubmit, children, state, pending, disabledReason, error, captionRequired = false, errors = [], submissionKey = 0 }: {
  caption: string; onCaptionChange: (caption: string) => void; onSubmit: () => void; children?: ReactNode;
  state: PresentationState; pending?: boolean; disabledReason?: string; error?: string; captionRequired?: boolean;
  errors?: readonly FormError[]; submissionKey?: number;
}) {
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const [attempt, setAttempt] = useState(0);
  const [localError, setLocalError] = useState<string>();
  useEffect(() => { if (submissionKey > 0) setAttempt(value => value + 1); }, [submissionKey]);
  const disabled = disabledReason ? { disabled: true as const, disabledReason } : { disabled: false as const };
  const fieldError = localError ?? error;
  const summary = [...new Map([...errors, ...(fieldError ? [{ key: "report-caption", message: fieldError, focus: () => input.current?.focus() }] : [])].map(item => [item.key, item])).values()];
  function submit() {
    const message = captionRequired && !caption.trim() ? "Enter a report caption." : undefined;
    setLocalError(message); setAttempt(value => value + 1);
    if (!message && !pending && !disabledReason) onSubmit();
  }
  return <Card title="Report"><StatusBadge {...state} /><Form errors={summary} submissionKey={attempt}>
    <TextArea ref={input} label="Report caption" value={caption} onChangeText={value => { setLocalError(undefined); onCaptionChange(value); }} required={captionRequired} error={fieldError} />
    {children}<Button {...disabled} label="Submit report" pending={pending} pendingLabel="Submitting report" onPress={submit} />
  </Form><Text style={styles.hint}>Report status does not grant points or approve a route.</Text></Card>;
}
export function ReviewDecision({ reason, onReasonChange, onDecision, pending = false, disabledReason, reasonRequired = false }: {
  reason: string; onReasonChange: (reason: string) => void; onDecision: (decision: "accept" | "reject", reason: string) => void;
  pending?: boolean; disabledReason?: string; reasonRequired?: boolean;
}) {
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const input = useRef<ComponentRef<typeof TextInput>>(null);
  const disabled = disabledReason ? { disabled: true as const, disabledReason } : { disabled: false as const };
  function decide(decision: "accept" | "reject") {
    if (pending || disabledReason) return;
    setAttempt(value => value + 1);
    if (reasonRequired && !reason.trim()) { setError("Enter a decision reason."); return; }
    setError(undefined); onDecision(decision, reason);
  }
  return <Card title="Manual review"><Text style={styles.hint}>Dispatcher decides; points and routing remain server-controlled.</Text>
    <ErrorSummary errors={error ? [{ key: "decision-reason", message: error, focus: () => input.current?.focus() }] : []} submissionKey={attempt} />
    <TextArea ref={input} label="Decision reason" value={reason} onChangeText={value => { setError(undefined); onReasonChange(value); }} required={reasonRequired} error={error} />
    <Button {...disabled} label="Accept" variant="secondary" pending={pending} pendingLabel="Accept pending" onPress={() => decide("accept")} />
    <Button {...disabled} label="Reject" variant="danger" pending={pending} pendingLabel="Reject pending" onPress={() => decide("reject")} />
  </Card>;
}
