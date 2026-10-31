import { readFileSync } from "node:fs";
import manifest from "../src/assets/isometric/asset-manifest.json";

const files = new Map(manifest.assets.map(asset => [
  `/assets/${asset.file}`, readFileSync(new URL(`../src/assets/isometric/${asset.file}`, import.meta.url))
]));
const css = readFileSync(new URL("../../design-tokens/src/tokens.css", import.meta.url), "utf8");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>FloodOps original asset gallery</title>
<link rel="stylesheet" href="/tokens.css"><style>
*{box-sizing:border-box}body{margin:0;padding:var(--fo-space-4);color:var(--fo-semantic-text-primary);background:var(--fo-semantic-surface-canvas);font:var(--fo-type-size-body)/1.5 system-ui}
main{max-width:960px;margin:auto}h1{font-size:var(--fo-type-size-title-lg);line-height:1.2}ul{padding:0;display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:var(--fo-space-3);list-style:none}
li{padding:var(--fo-space-4);border:1px solid var(--fo-semantic-border-default);border-radius:var(--fo-radius-md);background:var(--fo-semantic-surface-panel);text-align:center}img{display:block;width:64px;height:64px;margin:auto}span{display:block;overflow-wrap:anywhere}
a{display:inline-flex;align-items:center;min-height:var(--fo-target-web);color:var(--fo-semantic-action-secondary-fg)}a:focus-visible{outline:var(--fo-stroke-focus) solid var(--fo-semantic-focus-ring);outline-offset:var(--fo-stroke-focus-offset)}
</style></head><body><main><h1>Original FloodOps vectors</h1><p>Simulation · artwork and token review only</p>
<a href="#assets">Skip to assets</a><ul id="assets">${manifest.assets.map(asset => `<li><img src="/assets/${asset.file}" alt="${asset.id} vector"><span>${asset.id}</span></li>`).join("")}</ul>
<p>Fourteen original SVGs. Internal project artwork; external distribution approval pending. This page does not render React or native adapters.</p>
</main></body></html>`;
Bun.serve({ hostname: "127.0.0.1", port: 6006, fetch(request) {
  const path = new URL(request.url).pathname;
  if (path === "/") return new Response(html, { headers: { "Content-Type": "text/html; charset=utf-8" } });
  if (path === "/tokens.css") return new Response(css, { headers: { "Content-Type": "text/css" } });
  const file = files.get(path);
  if (file) return new Response(file, { headers: { "Content-Type": "image/svg+xml", "X-Content-Type-Options": "nosniff" } });
  return new Response("Not found", { status: 404 });
} });
console.log("Original SVG/token gallery: http://127.0.0.1:6006");
