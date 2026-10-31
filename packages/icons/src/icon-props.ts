import type { IconName } from "./geometry";
export type IconAccessibility =
  | { decorative: true; label?: never }
  | { decorative?: false; label: string };
export type IconProps = IconAccessibility & { name: IconName; size?: number; color?: string };
export function iconLabel(props: IconAccessibility): string | undefined {
  if (props.decorative) return undefined;
  const label = props.label.trim();
  if (!label) throw new Error("Informative icons need a non-empty text alternative.");
  return label;
}
