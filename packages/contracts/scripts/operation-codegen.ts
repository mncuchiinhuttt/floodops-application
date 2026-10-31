import { imports, kebab, pascal, schemaCode, type Schema } from "./schema-codegen";
import type { ApiDefinition } from "./definition-types";

const strict = (properties: Record<string, Schema>, required: string[]): Schema =>
  ({ type: "object", properties, required, additionalProperties: false });

export function operationFiles(api: ApiDefinition): Map<string, string> {
  const files = new Map<string, string>();
  const ids: string[] = [];
  for (const [path, methods] of Object.entries(api.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      const id = operation.operationId;
      if (!id) continue;
      if (ids.includes(id)) throw new Error(`Duplicate operationId ${id}`);
      ids.push(id);
      const groups = { path: {} as Record<string, Schema>, query: {} as Record<string, Schema>, headers: {} as Record<string, Schema> };
      const required = { path: [] as string[], query: [] as string[], headers: [] as string[] };
      for (const param of operation.parameters ?? []) {
        const p = param.$ref ? api.components.parameters[param.$ref.split("/").at(-1)!]! : param;
        const group = p.in === "header" ? "headers" : p.in as "path" | "query";
        if (!(group in groups)) throw new Error("Unknown parameter location");
        groups[group][p.name] = p.schema;
        if (p.required) required[group].push(p.name);
      }
      const fields: Record<string, Schema> = {};
      const requiredFields: string[] = [];
      for (const name of ["path", "query", "headers"] as const) {
        fields[name] = strict(groups[name], required[name]);
        if (required[name].length) requiredFields.push(name);
      }
      const refs = new Set<string>();
      const content = operation.requestBody?.content;
      const binary = !!content?.["application/octet-stream"];
      if (content?.["application/json"]) {
        fields.body = content["application/json"].schema;
        if (operation.requestBody.required) requiredFields.push("body");
      }
      let input = schemaCode(strict(fields, requiredFields), refs);
      if (binary) input = input.replace(/\n\}\)$/, '\n  body: z.instanceof(Uint8Array).refine(v => v.byteLength > 0 && v.byteLength <= 5242880, "Invalid upload byte length"),\n})');
      const outputs: string[] = [];
      const statuses: number[] = [];
      let kind = "empty";
      let responseType = "undefined";
      const mediaTypes = new Set<string>();
      for (const [status, response] of Object.entries(operation.responses)) {
        if (!status.startsWith("2")) continue;
        statuses.push(Number(status));
        const responseContent = response.content ?? {};
        Object.keys(responseContent).forEach((t) => mediaTypes.add(t));
        if (responseContent["application/json"]) {
          kind = "json";
          const code = schemaCode(responseContent["application/json"].schema, refs);
          outputs.push(`${status}: ${code}`);
          responseType = `z.infer<typeof ${id}.responses[${status}]>`;
        } else if (responseContent["text/event-stream"]) {
          kind = "stream"; responseType = "ReadableStream<Uint8Array>";
        } else if (Object.keys(responseContent).length) {
          kind = "binary"; responseType = "Uint8Array";
        }
      }
      const text = `${imports(refs, "../schemas/", input + outputs.join(" "))}\n\n` +
        `export const ${id} = {\n  id: ${JSON.stringify(id)}, method: ${JSON.stringify(method.toUpperCase())},\n` +
        `  path: ${JSON.stringify(path)}, roles: ${JSON.stringify(operation["x-roles"])},\n` +
        `  requiresRevision: ${!!operation["x-requires-operational-revision"]}, idempotent: ${!!operation["x-idempotent-command"]},\n` +
        `  input: ${input},\n  responses: { ${outputs.join(", ")} },\n` +
        `  statuses: ${JSON.stringify(statuses)}, errorStatuses: ${JSON.stringify(Object.keys(operation.responses).filter(s => !s.startsWith("2")).map(Number))},\n` +
        `  responseKind: ${JSON.stringify(kind)}, mediaTypes: ${JSON.stringify([...mediaTypes])},\n} as const;\n` +
        `export type ${pascal(id)}Input = z.infer<typeof ${id}.input>;\n` +
        `export type ${pascal(id)}Output = ${responseType};\n`;
      files.set(`src/generated/operations/${kebab(id)}.ts`, text);
    }
  }
  if (ids.length !== 64) throw new Error(`Expected 64 operations; received ${ids.length}`);
  files.set("src/generated/operations.ts", ids.map(id => `export { ${id} } from "./operations/${kebab(id)}";`).join("\n") + "\n");
  files.set("src/generated/operation-types.ts", ids.map(id => `import type { ${pascal(id)}Input, ${pascal(id)}Output } from "./operations/${kebab(id)}";`).join("\n") +
    "\nexport interface OperationInputs {\n" + ids.map(id => `  ${id}: ${pascal(id)}Input;`).join("\n") + "\n}\n" +
    "export interface OperationOutputs {\n" + ids.map(id => `  ${id}: ${pascal(id)}Output;`).join("\n") + "\n}\n");
  return files;
}
