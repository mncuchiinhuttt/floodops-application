import { readFileSync, realpathSync } from "node:fs";

// Run only after Lead has installed reviewed workspace dependencies and exports.
// Do not resolve product dependencies from an ancestor/user node_modules folder.
const required = ["react", "react-dom", "@floodops/design-tokens", "@floodops/icons/web"];
for (const name of required) {
  const path = realpathSync(Bun.resolveSync(name, new URL("..", import.meta.url).pathname));
  if (!path.startsWith(new URL("../../../node_modules/", import.meta.url).pathname)
    && !path.startsWith(new URL("../../../packages/", import.meta.url).pathname)) {
    throw new Error(`Workspace-local dependency unavailable: ${name}. Ask Lead for frozen dependencies/exports.`);
  }
}
const output = await Bun.build({ entrypoints: [new URL("./main.tsx", import.meta.url).pathname], target: "browser" });
if (!output.success || !output.outputs[0]) throw new Error(`Gallery build failed: ${output.logs.join("\\n")}`);
const script = await output.outputs[0].text();
const css = readFileSync(new URL("../../design-tokens/src/tokens.css", import.meta.url), "utf8")
  + readFileSync(new URL("../src/styles.css", import.meta.url), "utf8");
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>FloodOps foundations gallery</title><link rel="stylesheet" href="/styles.css"><style>body{margin:0;font:var(--fo-type-size-body)/var(--fo-type-line-height-body) system-ui;color:var(--fo-semantic-text-primary);background:var(--fo-semantic-surface-canvas)}</style>
</head><body><div id="root"></div><script type="module" src="/gallery.js"></script></body></html>`;
const responses = new Map([
  ["/", [html, "text/html; charset=utf-8"]], ["/styles.css", [css, "text/css"]], ["/gallery.js", [script, "text/javascript"]]
]);
Bun.serve({ hostname: "127.0.0.1", port: 6006, fetch(request) {
  const result = responses.get(new URL(request.url).pathname);
  return result ? new Response(result[0], { headers: { "Content-Type": result[1]!, "X-Content-Type-Options": "nosniff" } })
    : new Response("Not found", { status: 404 });
} });
console.log("React foundations gallery: http://127.0.0.1:6006");
