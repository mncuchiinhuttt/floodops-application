import { useEffect, useId, useState } from "react";
import type { ReactNode } from "react";
import type { PresentationState } from "@floodops/design-tokens";
import { Button } from "../primitives/button";
import { TextArea } from "../primitives/text-field";
import { StatusBadge } from "../primitives/badge";
import { Card } from "../primitives/content";
import { ErrorSummary, Form } from "./form";
import type { FormError } from "./form";
export function ReportForm({ caption, onCaptionChange, onSubmit, children, state, pending, disabledReason, error, captionRequired = false, errors = [], submissionKey = 0, captionId }: {
  caption: string; onCaptionChange: (caption: string) => void; onSubmit: () => void; children?: ReactNode;
  state: PresentationState; pending?: boolean; disabledReason?: string; error?: string; captionRequired?: boolean;
  errors?: readonly FormError[]; submissionKey?: number; captionId?: string;
}) {
  const generated = useId();
  const id = captionId ?? generated;
  const [attempt, setAttempt] = useState(0);
  const [localError, setLocalError] = useState<string>();
  useEffect(() => { if (submissionKey > 0) setAttempt(value => value + 1); }, [submissionKey]);
  const disabled = disabledReason ? { disabled: true as const, disabledReason } : { disabled: false as const };
  const fieldError = localError ?? error;
  const summary = [...new Map([...errors, ...(fieldError ? [{ fieldId: id, message: fieldError }] : [])].map(item => [item.fieldId, item])).values()];
  function submit() {
    const message = captionRequired && !caption.trim() ? "Enter a report caption." : undefined;
    setLocalError(message); setAttempt(value => value + 1);
    if (!message && !pending && !disabledReason) onSubmit();
  }
  return <Card title="Report"><StatusBadge {...state} /><Form onSubmit={submit} errors={summary} submissionKey={attempt}>
    <TextArea id={id} label="Report caption" value={caption} onChange={event => { setLocalError(undefined); onCaptionChange(event.target.value); }} required={captionRequired} error={fieldError} />
    {children}<Button {...disabled} type="submit" pending={pending} pendingLabel="Submitting report">Submit report</Button>
  </Form><p className="fo-hint">Report status does not grant points or approve a route.</p></Card>;
}
export function ReviewDecision({ reason, onReasonChange, onDecision, pending = false, disabledReason, reasonRequired = false }: {
  reason: string; onReasonChange: (reason: string) => void; onDecision: (decision: "accept" | "reject", reason: string) => void;
  pending?: boolean; disabledReason?: string; reasonRequired?: boolean;
}) {
  const [error, setError] = useState<string>();
  const [attempt, setAttempt] = useState(0);
  const id = useId();
  const disabled = disabledReason ? { disabled: true as const, disabledReason } : { disabled: false as const };
  function decide(decision: "accept" | "reject") {
    if (pending || disabledReason) return;
    setAttempt(value => value + 1);
    if (reasonRequired && !reason.trim()) { setError("Enter a decision reason."); return; }
    setError(undefined); onDecision(decision, reason);
  }
  return <Card title="Manual review"><p>Dispatcher decides; points and routing remain server-controlled.</p>
    <ErrorSummary errors={error ? [{ fieldId: id, message: error }] : []} submissionKey={attempt} />
    <TextArea id={id} label="Decision reason" value={reason} onChange={event => { setError(undefined); onReasonChange(event.target.value); }} required={reasonRequired} error={error} />
    <div className="fo-actions"><Button {...disabled} variant="secondary" pending={pending} pendingLabel="Accept pending" onClick={() => decide("accept")}>Accept</Button>
      <Button {...disabled} variant="danger" pending={pending} pendingLabel="Reject pending" onClick={() => decide("reject")}>Reject</Button></div>
  </Card>;
}
