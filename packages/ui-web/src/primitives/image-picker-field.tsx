import { useId } from "react";
import type { SelectedImage } from "@floodops/design-tokens";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "./button";

export type ImagePickerFieldProps = {
  label: string; images: readonly SelectedImage[]; onFilesSelected: (files: File[]) => void; onRemove: (id: string) => void;
  hint?: string; error?: string; pending?: boolean; disabledReason?: string;
};
export function ImagePickerField({ label, images, onFilesSelected, onRemove, hint, error, pending, disabledReason }: ImagePickerFieldProps) {
  const id = useId();
  if (!label.trim()) throw new Error("Image pickers require a visible label.");
  const described = [`${id}-count`, hint && `${id}-hint`, error && `${id}-error`, disabledReason && `${id}-disabled`].filter(Boolean).join(" ");
  return <div className="grid w-full min-w-0 gap-1.5"><Label htmlFor={id}>{label}</Label>
    {hint && <span id={`${id}-hint`} className="text-xs text-muted-foreground">{hint}</span>}
    <Input id={id} type="file" accept="image/jpeg,image/png" multiple disabled={pending || Boolean(disabledReason)}
      aria-invalid={Boolean(error)} aria-busy={pending || undefined} aria-describedby={described}
      className="cursor-pointer file:mr-3 file:cursor-pointer"
      onChange={event => { onFilesSelected(Array.from(event.currentTarget.files ?? [])); event.currentTarget.value = ""; }} />
    <span id={`${id}-count`} className="text-xs text-muted-foreground">{images.length} selected image{images.length === 1 ? "" : "s"}</span>
    {images.length > 0 && <ul className="m-0 grid list-none gap-2 p-0">{images.map(image => <li key={image.id} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3 py-2">
      <span className="min-w-0 [overflow-wrap:anywhere]">{image.label}</span><Button variant="ghost"
        pending={pending} pendingLabel={`Processing ${image.label}`} onClick={() => onRemove(image.id)}>Remove {image.label}</Button></li>)}</ul>}
    {disabledReason && <span id={`${id}-disabled`} className="text-xs text-muted-foreground">{disabledReason}</span>}
    {error && <span id={`${id}-error`} className="text-xs font-medium text-destructive">{error}</span>}
  </div>;
}
