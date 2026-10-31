import { writeFileSync, mkdirSync } from "node:fs";
import { drawings } from "../src/geometry";
import type { IconDrawing } from "../src/geometry";
import { tokens } from "../../design-tokens/src/index";

const colors = { top: tokens.semantic.surface.canvas, side: tokens.semantic.action.primary.bg,
  front: tokens.semantic.action.primary.hover, accent: tokens.semantic.surface.panel, none: "none" };
const directory = new URL("../src/assets/isometric/", import.meta.url);
mkdirSync(directory, { recursive: true });
const assets = Object.entries(drawings).map(([name, value]) => {
  const drawing: IconDrawing = value;
  const paths = drawing.layers.map(layer => `<path d="${layer.d}" fill="${colors[layer.fill]}"${layer.stroke ? ' stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"' : ""}/>`).join("");
  writeFileSync(new URL(`${name}.svg`, directory), `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${drawing.viewBox}" color="${tokens.semantic.text.primary}">${paths}</svg>\n`);
  return { id: name, file: `${name}.svg`, viewBox: drawing.viewBox, source: "FloodOps original vector geometry",
    author: "FloodOps project", license: "LicenseRef-FloodOps-Internal", attribution: "FloodOps original artwork",
    altPolicy: "Decorative: hidden from accessibility tree. Informative: caller supplies localized non-empty label.",
    kind: drawing.viewBox.endsWith("64 64") ? "isometric" : "control" };
});
writeFileSync(new URL("asset-manifest.json", directory), JSON.stringify({ version: 1, externalArtwork: false,
  licenseFile: "../../../LICENSE.assets", distributionApproval: "Internal project use only; external licensing requires project-owner approval.", assets }, null, 2) + "\n");
