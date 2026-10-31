import { useId } from "react";
import { Label } from "../components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

export type SelectOption = { value: string; label: string; disabled?: boolean };
export type SelectFieldProps = {
  label: string; hint?: string; error?: string; options: readonly SelectOption[]; id?: string; name?: string;
  value?: string; defaultValue?: string; onValueChange?: (value: string) => void; placeholder?: string;
  required?: boolean; disabled?: boolean; "aria-describedby"?: string; className?: string;
};
/** Radix Select forbids an empty item value, so "" travels as a sentinel and is restored on change. */
const EMPTY = "__fo_empty__";
const encode = (value: string | undefined) => value === undefined ? undefined : value === "" ? EMPTY : value;
export function SelectField({ label, hint, error, options, id, name, value, defaultValue, onValueChange, placeholder,
  required, disabled, className, ...props }: SelectFieldProps) {
  const generated = useId();
  const fieldId = id ?? generated;
  if (!label.trim() || options.some(option => !option.label.trim())) throw new Error("Select fields and options require visible labels.");
  const describedBy = [props["aria-describedby"], hint && `${fieldId}-hint`, error && `${fieldId}-error`].filter(Boolean).join(" ") || undefined;
  return <div className="grid w-full min-w-0 gap-1.5">
    <Label htmlFor={fieldId}>{label}{required ? " (required)" : ""}</Label>
    {hint && <span id={`${fieldId}-hint`} className="text-xs text-muted-foreground [overflow-wrap:anywhere]">{hint}</span>}
    <Select name={name} value={encode(value)} defaultValue={encode(defaultValue)} required={required} disabled={disabled}
      onValueChange={next => onValueChange?.(next === EMPTY ? "" : next)}>
      <SelectTrigger id={fieldId} className={className} aria-invalid={Boolean(error)} aria-describedby={describedBy} aria-required={required}>
        <SelectValue placeholder={placeholder ?? "Chọn"} />
      </SelectTrigger>
      <SelectContent position="popper">
        {options.map(option => <SelectItem key={option.value} value={encode(option.value) ?? EMPTY} disabled={option.disabled}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
    {error && <span id={`${fieldId}-error`} className="text-xs font-medium text-destructive [overflow-wrap:anywhere]">{error}</span>}
  </div>;
}
