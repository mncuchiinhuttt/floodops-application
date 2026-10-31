import { readdirSync, realpathSync } from "node:fs";
import { join } from "node:path";
const root = realpathSync(new URL("../dist/storybook", import.meta.url).pathname);
const files = new Map<string, string>();
function index(directory: string, relative = "") {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    if (entry.isSymbolicLink()) throw new Error("Preview does not follow symlinks.");
    const path = join(directory, entry.name);
    const key = `${relative}/${entry.name}`;
    if (entry.isDirectory()) index(path, key);
    else if (entry.isFile()) {
      const actual = realpathSync(path);
      if (!actual.startsWith(`${root}/`)) throw new Error("Preview path escaped build output.");
      files.set(key, actual);
    }
  }
}
index(root);
Bun.serve({ hostname: "127.0.0.1", port: 6006, fetch(request) {
  const pathname = new URL(request.url).pathname;
  const path = files.get(pathname === "/" ? "/index.html" : pathname);
  if (!path) return new Response("Not found", { status: 404 });
  const file = Bun.file(path);
  return new Response(file, { headers: { "Content-Type": file.type, "X-Content-Type-Options": "nosniff" } });
} });
console.log("Built Storybook preview: http://127.0.0.1:6006");
