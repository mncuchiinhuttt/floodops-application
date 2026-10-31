import { useId } from "react";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Icon } from "@floodops/icons/web";
import type { IconName } from "@floodops/icons/web";

import { requireControlName } from "./control-name";

type Disabled = { disabled?: false; disabledReason?: never } | { disabled: true; disabledReason: string };
type ButtonBase = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "children"> & {
  ref?: Ref<HTMLButtonElement>; children: ReactNode; variant?: "primary" | "secondary" | "danger"; pending?: boolean; pendingLabel?: string;
};
export type ButtonProps = ButtonBase & Disabled;
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
export type IconButtonProps = Omit<ButtonBase, "children" | "aria-label"> & Disabled & { label: string; icon: IconName };
export function IconButton({ label, icon, ...props }: IconButtonProps) {
  if (!label.trim()) throw new Error("IconButton requires a text alternative.");
  const content = <Icon name={icon} decorative />;
  return props.disabled
    ? <Button {...props} disabled disabledReason={props.disabledReason} aria-label={label}>{content}</Button>
    : <Button {...props} disabled={false} aria-label={label}>{content}</Button>;
}
