import { useRef } from "react";
import type { ReactNode, RefObject } from "react";
import * as Primitive from "@radix-ui/react-dialog";
import { Button } from "./button";
export type DialogProps = {
  open: boolean; title: string; description?: string; children: ReactNode; onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>; initialFocusRef?: RefObject<HTMLElement | null>;
  dismissRef?: RefObject<HTMLButtonElement | null>; dismissLabel?: string; dismissDisabledReason?: string;
};
/** Radix supplies modal isolation, focus trapping, Escape and dismissal semantics. */
export function Dialog({ open, title, description, children, onClose, returnFocusRef, initialFocusRef, dismissRef, dismissLabel = "Close", dismissDisabledReason, sheet = false }: DialogProps & { sheet?: boolean }) {
  const restore = useRef<HTMLElement | null>(null);
  if (!title.trim()) throw new Error("Dialogs require a visible title.");
  return <Primitive.Root open={open} onOpenChange={next => { if (!next && !dismissDisabledReason) onClose(); }}>
    <Primitive.Portal><Primitive.Overlay className="fo-modal-overlay" />
      <Primitive.Content onEscapeKeyDown={event => { if (dismissDisabledReason) event.preventDefault(); }}
        onPointerDownOutside={event => { if (dismissDisabledReason) event.preventDefault(); }} className={`fo-modal-panel${sheet ? " fo-sheet" : ""}`}
        onOpenAutoFocus={event => {
          restore.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
          if (initialFocusRef?.current) { event.preventDefault(); initialFocusRef.current.focus(); }
        }}
        onCloseAutoFocus={event => {
          event.preventDefault(); (returnFocusRef?.current ?? restore.current)?.focus();
        }}>
        <Primitive.Title className="fo-modal-title">{title}</Primitive.Title>
        <Primitive.Description className="fo-hint">{description ?? "Review the details before continuing."}</Primitive.Description>
        <div className="fo-modal-body">{children}</div>
        <Primitive.Close asChild><Button {...(dismissDisabledReason ? { disabled: true as const, disabledReason: dismissDisabledReason } : { disabled: false as const })} ref={dismissRef} variant="secondary">{dismissLabel}</Button></Primitive.Close>
      </Primitive.Content>
    </Primitive.Portal>
  </Primitive.Root>;
}
export function Sheet(props: DialogProps) { return <Dialog {...props} sheet />; }
