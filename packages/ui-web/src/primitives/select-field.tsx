import { useId } from "react";
import type { SelectHTMLAttributes } from "react";
export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectFieldProps = Omit<SelectHTMLAttributes<HTMLSelectElement>, "children"> & {
  label: string; hint?: string; error?: string; options: readonly SelectOption[];
};
export function SelectField({ label, hint, error, options, id, className = "", ...props }: SelectFieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  if (!label.trim() || options.some(option => !option.label.trim())) throw new Error("Select fields and options require visible labels.");
  const describedBy = [props["aria-describedby"], hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(" ") || undefined;
  return <div className="fo-field"><label htmlFor={fieldId}>{label}{props.required ? " (required)" : ""}</label>
    {hint && <span id={`${fieldId}-hint`} className="fo-hint">{hint}</span>}
    <select {...props} id={fieldId} className={`fo-input ${className}`} aria-invalid={Boolean(error)} aria-describedby={describedBy}>
      {options.map(option => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
    </select>{error && <span id={`${fieldId}-error`} className="fo-error">{error}</span>}
  </div>;
}
