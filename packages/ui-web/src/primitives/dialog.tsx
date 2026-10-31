import { useRef } from "react";
import type { ReactNode, RefObject } from "react";
import { Dialog as DialogRoot, DialogContent, DialogDescription, DialogTitle, DialogClose } from "../components/ui/dialog";
import { cn } from "../lib/utils";
import { Button } from "./button";

export type DialogProps = {
  open: boolean; title: string; description?: string; children: ReactNode; onClose: () => void;
  returnFocusRef?: RefObject<HTMLElement | null>; initialFocusRef?: RefObject<HTMLElement | null>;
  dismissRef?: RefObject<HTMLButtonElement | null>; dismissLabel?: string; dismissDisabledReason?: string;
};
/** Radix (via shadcn) supplies modal isolation, focus trapping, Escape and dismissal semantics. */
export function Dialog({ open, title, description, children, onClose, returnFocusRef, initialFocusRef, dismissRef, dismissLabel = "Close", dismissDisabledReason, sheet = false }: DialogProps & { sheet?: boolean }) {
  const restore = useRef<HTMLElement | null>(null);
  if (!title.trim()) throw new Error("Dialogs require a visible title.");
  return <DialogRoot open={open} onOpenChange={next => { if (!next && !dismissDisabledReason) onClose(); }}>
    <DialogContent showCloseButton={false}
      className={cn("max-h-[calc(100dvh-2rem)] gap-4 overflow-y-auto rounded-xl bg-popover p-5 sm:max-w-md",
        sheet && "top-auto bottom-0 translate-y-0 rounded-b-none data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom")}
      onEscapeKeyDown={event => { if (dismissDisabledReason) event.preventDefault(); }}
      onPointerDownOutside={event => { if (dismissDisabledReason) event.preventDefault(); }}
      onOpenAutoFocus={event => {
        restore.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
        if (initialFocusRef?.current) { event.preventDefault(); initialFocusRef.current.focus(); }
      }}
      onCloseAutoFocus={event => { event.preventDefault(); (returnFocusRef?.current ?? restore.current)?.focus(); }}>
      <DialogTitle className="text-lg font-semibold tracking-tight">{title}</DialogTitle>
      <DialogDescription>{description ?? "Review the details before continuing."}</DialogDescription>
      <div className="grid min-w-0 gap-3 [overflow-wrap:anywhere]">{children}</div>
      <DialogClose asChild><Button {...(dismissDisabledReason ? { disabled: true as const, disabledReason: dismissDisabledReason } : { disabled: false as const })} ref={dismissRef} variant="secondary">{dismissLabel}</Button></DialogClose>
    </DialogContent>
  </DialogRoot>;
}
export function Sheet(props: DialogProps) { return <Dialog {...props} sheet />; }
