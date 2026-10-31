import type { Schema } from "./schema-codegen";
export interface Parameter {
  $ref?: string;
  name: string;
  in: "path" | "query" | "header";
  required?: boolean;
  schema: Schema;
}
interface Content { [mediaType: string]: { schema: Schema } }
interface Operation {
  operationId?: string;
  parameters?: Parameter[];
  requestBody?: { required?: boolean; content: Content };
  responses: Record<string, { content?: Content }>;
  "x-roles": string[];
  "x-requires-operational-revision": boolean;
  "x-idempotent-command": boolean;
}
export interface ApiDefinition {
  info: { version: string };
  paths: Record<string, Record<string, Operation>>;
  components: { schemas: Record<string, Schema>; parameters: Record<string, Parameter> };
}
interface Tool {
  name: string;
  description: string;
  parameters: Schema;
  output_schema: Schema;
  side_effect: string;
  strict: true;
}
export interface Definition {
  "openapi.json": ApiDefinition;
  "tool-contracts.json": { tools: Tool[] };
  "contract-examples.json": unknown;
  "tool-examples.json": unknown;
}
