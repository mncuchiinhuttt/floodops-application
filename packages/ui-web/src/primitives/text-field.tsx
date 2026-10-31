import { useId } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";

type FieldDetails = { label: string; hint?: string; error?: string };
export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & FieldDetails;
export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldDetails;
function useField(details: FieldDetails & { id?: string; "aria-describedby"?: string }) {
  const generated = useId();
  const id = details.id ?? generated;
  return { id, hintId: `${id}-hint`, errorId: `${id}-error`,
    describedBy: [details["aria-describedby"], details.hint && `${id}-hint`, details.error && `${id}-error`].filter(Boolean).join(" ") || undefined };
}
export function TextField({ label, hint, error, className = "", ...props }: TextFieldProps) {
  const field = useField({ ...props, label, hint, error });
  return <div className="fo-field">
    <label htmlFor={field.id}>{label}{props.required ? " (required)" : ""}</label>
    {hint && <span id={field.hintId} className="fo-hint">{hint}</span>}
    <input {...props} id={field.id} className={`fo-input ${className}`} aria-invalid={Boolean(error)} aria-describedby={field.describedBy} />
    {error && <span id={field.errorId} className="fo-error">{error}</span>}
  </div>;
}
export function TextArea({ label, hint, error, className = "", ...props }: TextAreaProps) {
  const field = useField({ ...props, label, hint, error });
  return <div className="fo-field">
    <label htmlFor={field.id}>{label}{props.required ? " (required)" : ""}</label>
    {hint && <span id={field.hintId} className="fo-hint">{hint}</span>}
    <textarea {...props} id={field.id} className={`fo-input ${className}`} aria-invalid={Boolean(error)} aria-describedby={field.describedBy} />
    {error && <span id={field.errorId} className="fo-error">{error}</span>}
  </div>;
}
