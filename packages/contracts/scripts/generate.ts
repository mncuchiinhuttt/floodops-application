import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { imports, kebab, schemaCode, type Schema } from "./schema-codegen";
import { operationFiles } from "./operation-codegen";
import type { Definition } from "./definition-types";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const plan = resolve(root, "../../plans/20261030-2249-floodops-web-mobile-implementation/contracts");
const canonical = resolve(root, "definition/contract-definition.json");
const check = process.argv.includes("--check");
const json = (value: unknown) => JSON.stringify(value, null, 2) + "\n";
const sha = (text: string) => createHash("sha256").update(text).digest("hex");
function emit(path: string, text: string) {
  if (path.endsWith(".ts") && text.split("\n").length > 199) throw new Error(`Module too long: ${path}`);
  if (check) {
    if (!existsSync(path) || readFileSync(path, "utf8") !== text) throw new Error(`Generated drift: ${path}`);
  } else {
    mkdirSync(dirname(path), { recursive: true });
    writeFileSync(path, text);
  }
}
if (process.argv.includes("--bootstrap")) {
  if (existsSync(canonical)) throw new Error("Canonical definition already exists");
  const sources = ["openapi.json", "tool-contracts.json", "contract-examples.json", "tool-examples.json"];
  const expected = ["3fc2ec8d25dd68bcc5d6e9645ea2038c17222b7cefa443d200f1c42766a31e5a", "37337eccd24af36de29fd15fd336435d51c1dcb987b0f349f75b7b4f150a60b9", "b399258dbfabeb85b50f073e6d34e5597e0ee3a03c67688799e7a533e5728bf1", "9c04d6c5cf25611a54a960e867e8d5f8f36fc2e895d7e129aa9a8bc3906a809e"];
  const values = sources.map((f, i) => {
    const text = readFileSync(resolve(plan, f), "utf8");
    if (sha(text) !== expected[i]) throw new Error(`Unapproved bootstrap artifact: ${f}`);
    return JSON.parse(text);
  });
  emit(canonical, json(Object.fromEntries(sources.map((s, i) => [s, values[i]]))));
}
const sourceText = readFileSync(canonical, "utf8");
const definition = JSON.parse(sourceText) as Definition;
const api = definition["openapi.json"];
const tools = definition["tool-contracts.json"];
const schemas = api.components.schemas as Record<string, Schema>;
if (Object.keys(schemas).length !== 186 || tools.tools.length !== 8) throw new Error("Contract inventory changed");
for (const [name, schema] of Object.entries(schemas)) {
  const refs = new Set<string>();
  const code = schemaCode(schema, refs);
  for (const ref of refs) if (!(ref in schemas)) throw new Error(`Unknown schema ${ref}`);
  emit(resolve(root, `src/generated/schemas/${kebab(name)}.ts`), `${imports(refs, "./", code)}\n\nexport const ${name}Schema = ${code};\nexport type ${name} = z.infer<typeof ${name}Schema>;\n`);
}
emit(resolve(root, "src/generated/schemas.ts"), Object.keys(schemas).map(n => `export { ${n}Schema, type ${n} } from "./schemas/${kebab(n)}";`).join("\n") + "\n");
for (const [path, text] of operationFiles(api)) emit(resolve(root, path), text);
const toolExports: string[] = [];
const providerTools: unknown[] = [];
function dereference(schema: Schema, ancestors: string[] = []): Schema {
  if (schema.$ref) {
    const ref = String(schema.$ref);
    if (!/^(?:openapi\.json)?#\/components\/schemas\/[A-Za-z0-9]+$/.test(ref)) throw new Error(`External ref ${ref}`);
    const name = ref.split("/").at(-1)!;
    if (!schemas[name] || ancestors.includes(name)) throw new Error(`Unknown/cyclic tool ref ${name}`);
    return dereference(schemas[name], [...ancestors, name]);
  }
  const result = { ...schema };
  if (schema.properties) result.properties = Object.fromEntries(Object.entries(schema.properties as Record<string, Schema>).map(([k, s]) => [k, dereference(s, ancestors)]));
  if (schema.items) result.items = dereference(schema.items as Schema, ancestors);
  for (const key of ["anyOf", "oneOf", "prefixItems"]) if (schema[key]) result[key] = (schema[key] as Schema[]).map(s => dereference(s, ancestors));
  return result;
}
for (const tool of tools.tools) {
  const refs = new Set<string>();
  const input = schemaCode(tool.parameters, refs);
  const output = schemaCode(tool.output_schema, refs);
  const id = tool.name.replace(/_([a-z])/g, (_: string, ch: string) => ch.toUpperCase());
  toolExports.push(`export { ${id} } from "./tools/${tool.name.replaceAll("_", "-")}";`);
  providerTools.push({ type: "function", name: tool.name, description: tool.description, strict: true, parameters: dereference(tool.parameters) });
  emit(resolve(root, `src/generated/tools/${tool.name.replaceAll("_", "-")}.ts`), `${imports(refs, "../schemas/", input + output)}\n\nexport const ${id} = {\n  name: ${JSON.stringify(tool.name)},\n  input: ${input},\n  output: ${output},\n  sideEffect: ${JSON.stringify(tool.side_effect)},\n} as const;\n`);
}
emit(resolve(root, "src/generated/tools.ts"), toolExports.join("\n") + "\n");
emit(resolve(root, "src/generated/provider-tools.json"), json(providerTools));
const parameterRefs = new Set<string>();
const parameterCode = Object.entries(api.components.parameters).map(([name, p]) => `export const ${name}ParameterSchema = ${schemaCode(p.schema, parameterRefs)};`).join("\n");
// Parameter module is one directory above the individual schema modules.
emit(resolve(root, "src/generated/parameters.ts"), imports(parameterRefs, "./schemas/", parameterCode).replaceAll('from "../../schema-helpers"', 'from "../schema-helpers"') + "\n" + parameterCode + "\n");
for (const [file, value] of Object.entries(definition)) emit(resolve(plan, file), json(value));
emit(resolve(root, "src/generated/version.ts"), `export const CONTRACT_VERSION = ${JSON.stringify(api.info.version)};\nexport const CONTRACT_SOURCE_SHA256 = ${JSON.stringify(sha(sourceText))};\n`);
console.log(`${check ? "Verified" : "Generated"} 186 schemas, 64 operations, 8 tools; source sha256=${sha(sourceText)}`);
