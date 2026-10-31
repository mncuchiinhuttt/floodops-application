import { useState } from "react";
import { Text, View } from "react-native";
import { Button } from "./button";
import { styles } from "./styles";
/** Native help is reachable by a labelled press as well as keyboard focus. */
export function Tooltip({ label, description }: { label: string; description: string }) {
  const [open, setOpen] = useState(false);
  if (!label.trim() || !description.trim()) throw new Error("Help requires a label and description.");
  return <View style={styles.group}><Button variant="secondary" label={label} icon="help"
    accessibilityState={{ expanded: open }} onPress={() => setOpen(true)}
    onFocus={() => setOpen(true)} />
    {open && <><Text style={styles.hint} accessibilityLiveRegion="polite">{description}</Text>
      <Button variant="secondary" label={`Dismiss help for ${label}`} onPress={() => setOpen(false)} /></>}
  </View>;
}
