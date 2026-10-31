import type { AnchorHTMLAttributes } from "react";
export function LinkButton({ className = "", children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  return <a {...props} className={`fo-button fo-link ${className}`} data-variant="secondary">{children}</a>;
}
