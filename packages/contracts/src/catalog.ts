import * as exportedSchemas from "./generated/schemas";
import * as exportedOperations from "./generated/operations";
import * as exportedTools from "./generated/tools";
import type { z } from "zod";

export type SchemaName = keyof typeof exportedSchemas extends infer K
  ? K extends `${infer Name}Schema` ? Name : never : never;
export type SchemaOutput<N extends SchemaName> = z.infer<(typeof exportedSchemas)[`${N}Schema`]>;
export const schemas = Object.freeze(Object.fromEntries(Object.entries(exportedSchemas).map(
  ([name, schema]) => [name.slice(0, -6), schema],
))) as { readonly [N in SchemaName]: (typeof exportedSchemas)[`${N}Schema`] };
export const operations = Object.freeze({ ...exportedOperations });
export type OperationId = keyof typeof operations;
type ToolByExport = typeof exportedTools;
export type ToolName = ToolByExport[keyof ToolByExport]["name"];
export const tools = Object.freeze(Object.fromEntries(Object.values(exportedTools).map(tool => [tool.name, tool]))) as {
  readonly [K in keyof ToolByExport as ToolByExport[K]["name"]]: ToolByExport[K]
};
export type ToolInput<N extends ToolName> = z.infer<(typeof tools)[N]["input"]>;
export type ToolOutput<N extends ToolName> = z.infer<(typeof tools)[N]["output"]>;
