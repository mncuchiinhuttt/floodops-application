import { Text, View } from "react-native";
import type { SelectedImage } from "@floodops/design-tokens";
import { Button } from "./button";
import { styles } from "./styles";
export type ImagePickerFieldProps = {
  label: string; images: readonly SelectedImage[]; onPick: () => void; onRemove: (id: string) => void;
  hint?: string; error?: string; pending?: boolean; disabledReason?: string;
};
export function ImagePickerField({ label, images, onPick, onRemove, hint, error, pending, disabledReason }: ImagePickerFieldProps) {
  if (!label.trim()) throw new Error("Image pickers require a visible label.");
  const disabled = disabledReason ? { disabled: true as const, disabledReason } : { disabled: false as const };
  return <View style={styles.group}><Text style={styles.label}>{label}</Text>{hint && <Text style={styles.hint}>{hint}</Text>}
    <Button {...disabled} label={`Choose ${label}`} variant="secondary" pending={pending} pendingLabel="Processing images" onPress={onPick}
      accessibilityHint={[hint, error && `Error: ${error}`].filter(Boolean).join(". ") || undefined} />
    <Text style={styles.hint} accessibilityLiveRegion="polite">{images.length} selected image{images.length === 1 ? "" : "s"}</Text>
    {images.map(image => <View key={image.id} style={styles.group}><Text style={styles.label}>{image.label}</Text>
      <Button label={`Remove ${image.label}`} variant="secondary" pending={pending} pendingLabel={`Processing ${image.label}`} onPress={() => onRemove(image.id)} />
    </View>)}{error && <Text style={styles.error} accessibilityLiveRegion="polite">{error}</Text>}
  </View>;
}
