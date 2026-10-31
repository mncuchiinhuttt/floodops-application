import { createElement } from "react";
import Svg, { Path } from "react-native-svg";
import { tokens } from "@floodops/design-tokens";
import { drawings } from "../geometry";
import type { IconDrawing } from "../geometry";
import { iconLabel } from "../icon-props";
import type { IconProps } from "../icon-props";
export type { IconName } from "../geometry";
export type { IconProps } from "../icon-props";

export function Icon(props: IconProps) {
  const label = iconLabel(props);
  const drawing: IconDrawing = drawings[props.name];
  const palette = { top: tokens.semantic.surface.canvas, side: tokens.semantic.action.primary.bg,
    front: tokens.semantic.action.primary.hover, accent: tokens.semantic.surface.panel, none: "none" };
  return createElement(Svg, {
    viewBox: drawing.viewBox, width: props.size ?? 24, height: props.size ?? 24,
    color: props.color ?? tokens.semantic.text.primary, accessible: Boolean(label),
    accessibilityRole: label ? "image" : undefined, accessibilityLabel: label,
    accessibilityElementsHidden: !label, importantForAccessibility: label ? "yes" : "no-hide-descendants"
  }, drawing.layers.map((layer, index) => createElement(Path, {
    key: index, d: layer.d, fill: palette[layer.fill],
    stroke: layer.stroke ? "currentColor" : undefined, strokeWidth: layer.stroke ? 2 : undefined,
    strokeLinecap: "round", strokeLinejoin: "round"
  })));
}
