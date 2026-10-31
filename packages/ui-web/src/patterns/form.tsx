import { useEffect, useRef } from "react";
import type { FormEvent, FormHTMLAttributes } from "react";
import { tokens } from "@floodops/design-tokens";
import { cn } from "../lib/utils";

export type FormError = { fieldId: string; message: string };
export function ErrorSummary({ errors, submissionKey = 0, title = "Check the form" }: {
  errors: readonly FormError[]; submissionKey?: number; title?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (submissionKey > 0) ref.current?.focus(); }, [submissionKey]);
  if (!errors.length) return null;
  const pair = tokens.semantic.status.blocked;
  return <div ref={ref} tabIndex={-1} role="alert" aria-label={title} className="rounded-lg border p-4 text-sm outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50"
    style={{ color: pair.fg, backgroundColor: pair.bg, borderColor: pair.border }}>
    <strong className="font-semibold">{title}</strong><ul className="m-0 mt-2 grid list-none gap-1 p-0">{errors.map(error => <li key={error.fieldId}>
      <a className="inline-flex min-h-6 items-center underline underline-offset-2" href={`#${error.fieldId}`}
        onClick={event => { event.preventDefault(); document.getElementById(error.fieldId)?.focus(); }}>{error.message}</a>
    </li>)}</ul>
  </div>;
}
export type FormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  errors?: readonly FormError[]; submissionKey?: number; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};
export function Form({ errors = [], submissionKey, onSubmit, children, className, ...props }: FormProps) {
  return <form {...props} noValidate className={cn("grid min-w-0 gap-4", className)} onSubmit={event => { event.preventDefault(); onSubmit(event); }}>
    <ErrorSummary errors={errors} submissionKey={submissionKey} />{children}
  </form>;
}
