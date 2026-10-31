import { useId } from "react";
import type { SelectedImage } from "@floodops/design-tokens";
import { Button } from "./button";
export type ImagePickerFieldProps = {
  label: string; images: readonly SelectedImage[]; onFilesSelected: (files: File[]) => void; onRemove: (id: string) => void;
  hint?: string; error?: string; pending?: boolean; disabledReason?: string;
};
export function ImagePickerField({ label, images, onFilesSelected, onRemove, hint, error, pending, disabledReason }: ImagePickerFieldProps) {
  const id = useId();
  if (!label.trim()) throw new Error("Image pickers require a visible label.");
  const described = [`${id}-count`, hint && `${id}-hint`, error && `${id}-error`, disabledReason && `${id}-disabled`].filter(Boolean).join(" ");
  return <div className="fo-field"><label htmlFor={id}>{label}</label>
    {hint && <span id={`${id}-hint`} className="fo-hint">{hint}</span>}
    <input id={id} className="fo-input" type="file" accept="image/jpeg,image/png" multiple disabled={pending || Boolean(disabledReason)}
      aria-invalid={Boolean(error)} aria-busy={pending || undefined} aria-describedby={described}
      onChange={event => { onFilesSelected(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ""; }} />
    <span id={`${id}-count`}>{images.length} selected image{images.length === 1 ? "" : "s"}</span>
    {images.length > 0 && <ul>{images.map(image => <li key={image.id}>{image.label} <Button variant="secondary"
      pending={pending} pendingLabel={`Processing ${image.label}`} onClick={() => onRemove(image.id)}>Remove {image.label}</Button></li>)}</ul>}
    {disabledReason && <span id={`${id}-disabled`} className="fo-hint">{disabledReason}</span>}
    {error && <span id={`${id}-error`} className="fo-error">{error}</span>}
  </div>;
}
