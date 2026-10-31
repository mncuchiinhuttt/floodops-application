import type { AnchorHTMLAttributes } from "react";
import { requireControlName } from "./control-name";
export function LinkButton({ className = "", children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  requireControlName(children, props["aria-label"]);
  return <a {...props} className={`fo-button fo-link ${className}`} data-variant="secondary">{children}</a>;
}
