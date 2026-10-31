import { useEffect, useRef } from "react";
import type { FormEvent, FormHTMLAttributes } from "react";
export type FormError = { fieldId: string; message: string };
export function ErrorSummary({ errors, submissionKey = 0, title = "Check the form" }: {
  errors: readonly FormError[]; submissionKey?: number; title?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (submissionKey > 0) ref.current?.focus(); }, [submissionKey]);
  if (!errors.length) return null;
  return <div ref={ref} tabIndex={-1} className="fo-error-summary" role="alert" aria-label={title}>
    <strong>{title}</strong><ul>{errors.map(error => <li key={error.fieldId}>
      <a href={`#${error.fieldId}`} onClick={event => { event.preventDefault(); document.getElementById(error.fieldId)?.focus(); }}>{error.message}</a>
    </li>)}</ul>
  </div>;
}
export type FormProps = Omit<FormHTMLAttributes<HTMLFormElement>, "onSubmit"> & {
  errors?: readonly FormError[]; submissionKey?: number; onSubmit: (event: FormEvent<HTMLFormElement>) => void;
};
export function Form({ errors = [], submissionKey, onSubmit, children, className = "", ...props }: FormProps) {
  return <form {...props} noValidate className={`fo-form ${className}`} onSubmit={event => { event.preventDefault(); onSubmit(event); }}>
    <ErrorSummary errors={errors} submissionKey={submissionKey} />{children}
  </form>;
}
