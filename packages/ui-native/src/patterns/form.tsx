import { useEffect, useRef } from "react";
import type { ComponentRef, ReactNode } from "react";
import { AccessibilityInfo, findNodeHandle, Text, View } from "react-native";
import { Button } from "../primitives/button";
import { styles } from "../primitives/styles";
export type FormError = { key: string; message: string; focus?: () => void };
export function ErrorSummary({ errors, submissionKey = 0, title = "Check the form" }: {
  errors: readonly FormError[]; submissionKey?: number; title?: string;
}) {
  const ref = useRef<ComponentRef<typeof Text>>(null);
  useEffect(() => {
    if (submissionKey > 0 && ref.current) {
      const handle = findNodeHandle(ref.current);
      if (typeof handle === "number") AccessibilityInfo.setAccessibilityFocus(handle);
    }
  }, [submissionKey]);
  if (!errors.length) return null;
  return <View style={styles.group}><Text ref={ref} accessibilityRole="header" accessibilityLiveRegion="assertive" style={styles.error}>{title}</Text>
    {errors.map(error => error.focus ? <Button key={error.key} variant="secondary" label={error.message} onPress={error.focus} />
      : <Text key={error.key} style={styles.error}>{error.message}</Text>)}
  </View>;
}
export function Form({ children, errors = [], submissionKey }: { children: ReactNode; errors?: readonly FormError[]; submissionKey?: number }) {
  return <View style={styles.group}><ErrorSummary errors={errors} submissionKey={submissionKey} />{children}</View>;
}
