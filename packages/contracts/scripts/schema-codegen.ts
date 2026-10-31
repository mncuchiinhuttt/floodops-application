type Schema = Record<string, unknown>;
const quote = JSON.stringify;
const supported = new Set([
  "$ref", "type", "properties", "required", "additionalProperties", "items",
  "prefixItems", "anyOf", "oneOf", "const", "enum", "minimum", "maximum",
  "exclusiveMinimum", "minLength", "maxLength", "minItems", "maxItems",
  "uniqueItems", "pattern", "format", "description", "discriminator", "default",
]);

export const kebab = (name: string) => name.replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
export const pascal = (name: string) => name[0]!.toUpperCase() + name.slice(1);

export function schemaCode(schema: Schema, refs: Set<string>): string {
  for (const key of Object.keys(schema)) {
    if (!supported.has(key)) throw new Error(`Unsupported schema keyword: ${key}`);
  }
  if (schema.$ref) {
    const name = String(schema.$ref).split("/").at(-1)!;
    if (!/^[A-Za-z][A-Za-z0-9]*$/.test(name)) throw new Error("Invalid schema reference");
    refs.add(name);
    return `${name}Schema`;
  }
  if (schema.anyOf || schema.oneOf) {
    const variants = (schema.anyOf ?? schema.oneOf) as Schema[];
    const codes = variants.map((s) => schemaCode(s, refs));
    return schema.oneOf ? `exactlyOne([${codes.join(", ")}])` : `z.union([${codes.join(", ")}])`;
  }
  if ("const" in schema) return `z.literal(${quote(schema.const)})`;
  if (schema.enum) return `z.literal(${quote(schema.enum)})`;
  let code: string;
  switch (schema.type) {
    case "object": {
      if (schema.additionalProperties !== false) throw new Error("Object must be strict");
      const required = schema.required as string[];
      const properties = schema.properties as Record<string, Schema>;
      if (required.some((k) => !(k in properties))) throw new Error("Unknown required property");
      code = `z.strictObject({\n${Object.entries(properties).map(([k, v]) =>
        `  ${quote(k)}: ${schemaCode(v, refs)}${required.includes(k) ? "" : ".optional()"},`
      ).join("\n")}\n})`;
      break;
    }
    case "array": {
      code = schema.prefixItems
        ? `z.tuple([${(schema.prefixItems as Schema[]).map((s) => schemaCode(s, refs)).join(", ")}])`
        : `z.array(${schemaCode(schema.items as Schema, refs)})`;
      if (schema.minItems !== undefined) code += `.refine(v => v.length >= ${schema.minItems}, "Too few items")`;
      if (schema.maxItems !== undefined) code += `.refine(v => v.length <= ${schema.maxItems}, "Too many items")`;
      if (schema.uniqueItems) code += ".refine(hasUniqueItems, \"Duplicate items\")";
      break;
    }
    case "string": {
      code = "z.string()";
      if (schema.minLength !== undefined) code += `.refine(v => [...v].length >= ${schema.minLength}, "String too short")`;
      if (schema.maxLength !== undefined) code += `.refine(v => [...v].length <= ${schema.maxLength}, "String too long")`;
      if (schema.pattern) code += `.regex(new RegExp(${quote(schema.pattern)}))`;
      if (schema.format === "date-time") code += ".refine(isTimestamp, \"Invalid RFC3339 timestamp\")";
      else if (schema.format === "uri") code += ".refine(isUri, \"Invalid absolute URI\")";
      else if (schema.format) throw new Error(`Unsupported format: ${schema.format}`);
      break;
    }
    case "number":
    case "integer": {
      code = "z.number().finite()";
      if (schema.type === "integer") code += ".refine(Number.isInteger, \"Expected integer\")";
      if (schema.minimum !== undefined) code += `.min(${schema.minimum})`;
      if (schema.maximum !== undefined) code += `.max(${schema.maximum})`;
      if (schema.exclusiveMinimum !== undefined) code += `.gt(${schema.exclusiveMinimum})`;
      // Refinements retain a ZodNumber in Zod 4.
      break;
    }
    case "boolean": code = "z.boolean()"; break;
    case "null": code = "z.null()"; break;
    default: throw new Error(`Unsupported schema type: ${schema.type}`);
  }
  return schema.description ? `${code}.describe(${quote(schema.description)})` : code;
}

export function imports(refs: Set<string>, prefix: string): string {
  return [
    'import { z } from "zod";',
    `import { exactlyOne, hasUniqueItems, isTimestamp, isUri } from "${prefix}../schema-helpers";`,
    ...[...refs].sort().map((name) => `import { ${name}Schema } from "${prefix}${kebab(name)}";`),
  ].join("\n");
}

export type { Schema };
