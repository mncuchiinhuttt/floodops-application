import { useId, useState } from "react";
import { Text, TextInput, View } from "react-native";
import type { TextInputProps } from "react-native";
import { styles } from "./styles";

export type TextFieldProps = TextInputProps & { label: string; hint?: string; error?: string; required?: boolean };
export function TextField({ label, hint, error, required, onFocus, onBlur, accessibilityHint, ...props }: TextFieldProps) {
  if (!label.trim()) throw new Error("Fields require a non-empty visible label.");
  const id = useId();
  const [focused, setFocused] = useState(false);
  return <View style={styles.group}>
    <Text nativeID={`${id}-label`} style={styles.label}>{label}{required ? " (required)" : ""}</Text>
    {hint && <Text style={styles.hint}>{hint}</Text>}
    <TextInput {...props} accessibilityLabel={`${label}${required ? ", required" : ""}`}
      accessibilityLabelledBy={`${id}-label`} accessibilityHint={[accessibilityHint, hint, error && `Error: ${error}`].filter(Boolean).join(". ") || undefined}
      accessibilityState={{ ...props.accessibilityState, disabled: props.editable === false }}
      onFocus={event => { setFocused(true); onFocus?.(event); }} onBlur={event => { setFocused(false); onBlur?.(event); }}
      style={[styles.input, props.multiline && styles.textArea, error ? styles.invalid : undefined, focused && styles.focus, props.style]} />
    {error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
  </View>;
}
export function TextArea(props: TextFieldProps) { return <TextField {...props} multiline />; }
