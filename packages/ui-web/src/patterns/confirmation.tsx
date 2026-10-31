import { useRef, useState } from "react";
import { Button } from "../primitives/button";
import { Dialog } from "../primitives/dialog";
export type ConfirmationProps = {
  label: string; title: string; description: string; onConfirm: () => void | Promise<void>;
  disabledReason?: string; pending?: boolean;
};
export function ConfirmationControl({ label, title, description, onConfirm, disabledReason, pending = false }: ConfirmationProps) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string>();
  const busy = useRef(false);
  const trigger = useRef<HTMLButtonElement>(null);
  const dismiss = useRef<HTMLButtonElement>(null);
  const disabled = disabledReason ? { disabled: true as const, disabledReason } : { disabled: false as const };
  async function confirm() {
    if (busy.current || pending || disabledReason) return;
    busy.current = true; setWorking(true); setError(undefined);
    try { await onConfirm(); setOpen(false); }
    catch { setError("Action did not complete. Review the current session and try again."); }
    finally { busy.current = false; setWorking(false); }
  }
  return <><Button {...disabled} ref={trigger} variant="danger" pending={pending || working} pendingLabel={`${label} pending`}
    onClick={() => { setError(undefined); setOpen(true); }}>{label}</Button>
    <Dialog open={open} title={title} description={description} onClose={() => { if (!busy.current && !pending) setOpen(false); }} returnFocusRef={trigger}
      initialFocusRef={dismiss} dismissRef={dismiss} dismissLabel="Cancel" dismissDisabledReason={working || pending ? `${label} is in progress. Wait for a result.` : undefined}>
      {error && <p role="alert" className="fo-error">{error}</p>}
      <Button {...disabled} variant="danger" pending={working || pending} pendingLabel={`${label} pending`} onClick={confirm}>Confirm {label}</Button>
    </Dialog></>;
}
export function ResetControl(props: Omit<ConfirmationProps, "label" | "title" | "description">) {
  return <ConfirmationControl {...props} label="Reset" title="Reset simulation?"
    description="Start a new session. Previous assignments and points do not carry over. Rejoin is required." />;
}
