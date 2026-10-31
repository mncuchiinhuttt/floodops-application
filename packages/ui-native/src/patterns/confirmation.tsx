import { useRef, useState } from "react";
import type { ComponentRef } from "react";
import { Text, View } from "react-native";
import { Button } from "../primitives/button";
import { Dialog } from "../primitives/dialog";
import { styles } from "../primitives/styles";
export type ConfirmationProps = {
  label: string; title: string; description: string; onConfirm: () => void | Promise<void>;
  disabledReason?: string; pending?: boolean;
};
export function ConfirmationControl({ label, title, description, onConfirm, disabledReason, pending = false }: ConfirmationProps) {
  const [open, setOpen] = useState(false);
  const [working, setWorking] = useState(false);
  const [error, setError] = useState<string>();
  const busy = useRef(false);
  const trigger = useRef<ComponentRef<typeof View>>(null);
  const fallback = useRef<ComponentRef<typeof Text>>(null);
  const dismiss = useRef<ComponentRef<typeof View>>(null);
  const disabled = disabledReason ? { disabled: true as const, disabledReason } : { disabled: false as const };
  async function confirm() {
    if (busy.current || pending || disabledReason) return;
    busy.current = true; setWorking(true); setError(undefined);
    try { await onConfirm(); setOpen(false); }
    catch { setError("Action did not complete. Review the current session and try again."); }
    finally { busy.current = false; setWorking(false); }
  }
  return <View style={styles.group}>{disabledReason && <Text ref={fallback} accessible style={styles.label}>{label}: {disabledReason}</Text>}<Button {...disabled} ref={trigger} variant="danger" label={label} pending={pending || working}
    pendingLabel={`${label} pending`} onPress={() => { setError(undefined); setOpen(true); }} />
    <Dialog open={open} title={title} description={description} onClose={() => { if (!busy.current && !pending) setOpen(false); }} returnFocusRef={disabledReason ? fallback : trigger}
      initialFocusRef={dismiss} dismissRef={dismiss} dismissLabel="Cancel" dismissDisabledReason={working || pending ? `${label} is in progress. Wait for a result.` : undefined}>
      {error && <Text accessibilityRole="alert" style={styles.error}>{error}</Text>}
      <Button {...disabled} variant="danger" pending={working || pending} pendingLabel={`${label} pending`} onPress={confirm} label={`Confirm ${label}`} />
    </Dialog>
  </View>;
}
export function ResetControl(props: Omit<ConfirmationProps, "label" | "title" | "description">) {
  return <ConfirmationControl {...props} label="Reset" title="Reset simulation?"
    description="Start a new session. Previous assignments and points do not carry over. Rejoin is required." />;
}
