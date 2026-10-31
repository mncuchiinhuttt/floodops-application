import { useId } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { Icon } from "@floodops/icons/web";
import type { IconName } from "@floodops/icons/web";

import { requireControlName } from "./control-name";

type Disabled = { disabled?: false; disabledReason?: never } | { disabled: true; disabledReason: string };
export type ButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "children"> & Disabled & {
  children: ReactNode; variant?: "primary" | "secondary" | "danger"; pending?: boolean; pendingLabel?: string;
};
export function Button({ children, variant = "primary", pending = false, pendingLabel = "Working…",
  disabled, disabledReason, className = "", type = "button", ...props }: ButtonProps) {
  requireControlName(children, props["aria-label"]);
  if (pending && !pendingLabel.trim()) throw new Error("Pending buttons require a visible status label.");
  const reasonId = useId();
  const describedBy = [props["aria-describedby"], disabledReason ? reasonId : ""].filter(Boolean).join(" ") || undefined;
  return <span className="fo-control-group">
    <button {...props} type={type} className={`fo-button ${className}`} data-variant={variant}
      disabled={disabled || pending} aria-busy={pending || undefined} aria-describedby={describedBy}>
      {pending ? pendingLabel : children}
    </button>
    {disabledReason && <span id={reasonId} className="fo-hint">{disabledReason}</span>}
    {pending && <span className="fo-sr-only" role="status">{pendingLabel}</span>}
  </span>;
}
export type IconButtonProps = Omit<ButtonProps, "children" | "aria-label"> & { label: string; icon: IconName };
export function IconButton({ label, icon, ...props }: IconButtonProps) {
  if (!label.trim()) throw new Error("IconButton requires a text alternative.");
  return <Button {...props} aria-label={label}><Icon name={icon} decorative /></Button>;
}
