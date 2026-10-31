import { useId } from "react";
import type { ButtonHTMLAttributes, ReactNode, Ref } from "react";
import { Icon } from "@floodops/icons/web";
import type { IconName } from "@floodops/icons/web";
import { Button as ShadButton } from "../components/ui/button";
import { cn } from "../lib/utils";
import { requireControlName } from "./control-name";

type Disabled = { disabled?: false; disabledReason?: never } | { disabled: true; disabledReason: string };
type Variant = "primary" | "secondary" | "danger" | "ghost";
type ButtonBase = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "disabled" | "children"> & {
  ref?: Ref<HTMLButtonElement>; children: ReactNode; variant?: Variant; pending?: boolean; pendingLabel?: string;
};
export type ButtonProps = ButtonBase & Disabled;
/** Our four forms over shadcn variants: primary fill, outline (secondary), soft rose (danger), ghost. */
const shadVariant = { primary: "default", secondary: "outline", danger: "destructive", ghost: "ghost" } as const;
export function Button({ children, variant = "primary", pending = false, pendingLabel = "Working…",
  disabled, disabledReason, className = "", type = "button", ...props }: ButtonProps) {
  requireControlName(children, props["aria-label"]);
  if (disabled && !disabledReason?.trim()) throw new Error("Disabled controls require a visible disabled reason.");
  if (pending && !pendingLabel.trim()) throw new Error("Pending buttons require a visible status label.");
  const reasonId = useId();
  const describedBy = [props["aria-describedby"], disabledReason ? reasonId : ""].filter(Boolean).join(" ") || undefined;
  return <span className="inline-flex max-w-full flex-col gap-1.5">
    <ShadButton {...props} type={type} variant={shadVariant[variant]} data-fo-variant={variant}
      className={cn("h-auto min-h-11 whitespace-normal text-center [overflow-wrap:anywhere] md:min-h-10", className)}
      disabled={disabled || pending} aria-busy={pending || undefined} aria-describedby={describedBy}>
      {pending ? pendingLabel : children}
    </ShadButton>
    {disabledReason && <span id={reasonId} className="text-xs text-muted-foreground">{disabledReason}</span>}
    {pending && <span className="sr-only" role="status">{pendingLabel}</span>}
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
