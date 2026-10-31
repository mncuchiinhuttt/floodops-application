import { useId } from "react";
import type { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";

type FieldDetails = { label: string; hint?: string; error?: string };
export type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & FieldDetails;
export type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & FieldDetails;
/** Ids shared by the label, hint, control and error of one field. */
interface FieldIds { id: string; hintId: string; errorId: string; describedBy: string | undefined }
function useField(details: FieldDetails & { id?: string; "aria-describedby"?: string }): FieldIds {
  if (!details.label.trim()) throw new Error("Fields require a non-empty visible label.");
  const generated = useId();
  const id = details.id ?? generated;
  return { id, hintId: `${id}-hint`, errorId: `${id}-error`,
    describedBy: [details["aria-describedby"], details.hint && `${id}-hint`, details.error && `${id}-error`].filter(Boolean).join(" ") || undefined };
}
function Frame({ field, label, required, hint, error, children }: {
  field: FieldIds; label: string; required?: boolean; hint?: string; error?: string; children: React.ReactNode;
}) {
  return <div className="grid w-full min-w-0 gap-1.5">
    <Label htmlFor={field.id}>{label}{required ? " (required)" : ""}</Label>
    {hint && <span id={field.hintId} className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{hint}</span>}
    {children}
    {error && <span id={field.errorId} className="text-xs font-medium text-destructive [overflow-wrap:anywhere]">{error}</span>}
  </div>;
}
export function TextField({ label, hint, error, className, ...props }: TextFieldProps) {
  const field = useField({ ...props, label, hint, error });
  return <Frame field={field} label={label} required={props.required} hint={hint} error={error}>
    <Input {...props} id={field.id} className={className} aria-invalid={Boolean(error)} aria-describedby={field.describedBy} />
  </Frame>;
}
export function TextArea({ label, hint, error, className, ...props }: TextAreaProps) {
  const field = useField({ ...props, label, hint, error });
  return <Frame field={field} label={label} required={props.required} hint={hint} error={error}>
    <Textarea {...props} id={field.id} className={className} aria-invalid={Boolean(error)} aria-describedby={field.describedBy} />
  </Frame>;
}
