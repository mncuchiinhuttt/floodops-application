import { operations, schemas, tools, type OperationId, type SchemaName, type SchemaOutput, type ToolName, type ToolInput, type ToolOutput } from "./catalog";
import type { OperationInputs, OperationOutputs } from "./generated/operation-types";

export interface Validator<T = unknown> {
  safeParse(value: unknown): { success: true; data: T } | { success: false; error: { issues: readonly { path: readonly PropertyKey[]; code: string }[] } };
}
export class ContractValidationError extends Error {
  override readonly name = "ContractValidationError";
  constructor(readonly boundary: string, readonly issues: readonly { path: string; code: string }[]) {
    super(`Contract validation failed at ${boundary}`);
  }
}
export function validate<T>(schema: Validator<T>, value: unknown, boundary: string): T {
  const result = schema.safeParse(value);
  if (!result.success) throw new ContractValidationError(boundary, result.error.issues.map(issue => ({
    path: issue.path.map(String).join("."), code: issue.code,
  })));
  return result.data;
}
export function parseSchema<N extends SchemaName>(name: N, value: unknown): SchemaOutput<N> {
  return validate<unknown>(schemas[name], value, name) as SchemaOutput<N>;
}
export function parseOperationInput<I extends OperationId>(id: I, value: unknown): OperationInputs[I] {
  return validate<unknown>(operations[id].input, value, `${id}.request`) as OperationInputs[I];
}
export function parseOperationResponse<I extends OperationId>(id: I, status: number, value: unknown): OperationOutputs[I] {
  const schema = (operations[id].responses as Readonly<Record<number, Validator>>)[status];
  if (!schema) throw new ContractValidationError(`${id}.status`, [{ path: "status", code: "undocumented_status" }]);
  return validate(schema, value, `${id}.response`) as OperationOutputs[I];
}
export function parseToolInput<N extends ToolName>(name: N, value: unknown): ToolInput<N> {
  return validate<unknown>(tools[name].input, value, `${name}.input`) as ToolInput<N>;
}
export function parseToolOutput<N extends ToolName>(name: N, value: unknown): ToolOutput<N> {
  return validate<unknown>(tools[name].output, value, `${name}.output`) as ToolOutput<N>;
}
