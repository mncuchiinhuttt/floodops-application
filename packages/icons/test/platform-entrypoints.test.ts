import { expect, test } from "bun:test";
import { existsSync, readFileSync } from "node:fs";
import { drawings } from "../src/geometry";
import { iconLabel } from "../src/icon-props";
import { tokens } from "../../design-tokens/src/index";
import manifest from "../src/assets/isometric/asset-manifest.json";

test("every original drawing has a bounded SVG and complete provenance", () => {
  expect(manifest.assets.map(asset => asset.id).sort()).toEqual(Object.keys(drawings).sort());
  let bytes = 0;
  for (const asset of manifest.assets) {
    const svg = readFileSync(new URL(`../src/assets/isometric/${asset.file}`, import.meta.url), "utf8");
    expect(svg).toContain(`viewBox="${asset.viewBox}"`);
    const paths = [...svg.matchAll(/<path ([^>]+)\/>/g)].map(match => match[1]!);
    const drawing = drawings[asset.id as keyof typeof drawings];
    expect(paths.length).toBe(drawing.layers.length);
    const colors = { top: tokens.semantic.surface.canvas, side: tokens.semantic.action.primary.bg,
      front: tokens.semantic.action.primary.hover, accent: tokens.semantic.surface.panel, none: "none" };
    drawing.layers.forEach((layer, index) => {
      expect(paths[index]).toContain(`d="${layer.d}"`);
      expect(paths[index]).toContain(`fill="${colors[layer.fill]}"`);
      if ("stroke" in layer && layer.stroke) expect(paths[index]).toContain('stroke="currentColor" stroke-width="2"');
      else expect(paths[index]).not.toContain("stroke=");
    });
    expect(svg).not.toMatch(/<(script|image|foreignObject)|href=|onload=|style=|https?:\/\/(?!www.w3.org)/i);
    expect(asset.license).toBe("LicenseRef-FloodOps-Internal");
    expect(asset.source).toContain("original");
    expect(asset.altPolicy).toContain("non-empty label");
    bytes += new TextEncoder().encode(svg).byteLength;
  }
  expect(bytes).toBeLessThan(16000);
});
test("decorative assets are hidden and informative assets reject blank alternatives", () => {
  expect(iconLabel({ decorative: true })).toBeUndefined();
  expect(iconLabel({ label: " Hub " })).toBe("Hub");
  expect(() => iconLabel({ label: "  " })).toThrow("non-empty");
});

test("manifest licensing reference resolves to the actual artwork notice", () => {
  const license = new URL(`../src/assets/isometric/${manifest.licenseFile}`, import.meta.url);
  expect(existsSync(license)).toBe(true);
  const notice = readFileSync(license, "utf8");
  for (const asset of manifest.assets) expect(notice).toContain(asset.license);
  expect(manifest.externalArtwork).toBe(false);
});
