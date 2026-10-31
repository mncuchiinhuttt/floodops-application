import type { AnchorHTMLAttributes } from "react";
import { buttonVariants } from "../components/ui/button";
import { cn } from "../lib/utils";
import { requireControlName } from "./control-name";

export function LinkButton({ className = "", children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { href: string }) {
  requireControlName(children, props["aria-label"]);
  return <a {...props} data-fo-variant="secondary" className={cn(buttonVariants({ variant: "outline" }), "h-auto min-h-11 md:min-h-10", className)}>{children}</a>;
}
