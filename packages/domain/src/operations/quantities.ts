import type { Quantity } from "@floodops/contracts";
import { addDecimalQuantity } from "./decimal-quantity.ts";
import { OperationError } from "./operation-types.ts";

export function quantityMap(vector: readonly Quantity[]): Map<string, Quantity> {
  const map = new Map<string, Quantity>();
  for (const item of vector) {
    if (!item.dimension || !item.unit || !item.parameter_key || !Number.isFinite(item.value)
      || item.value < 0 || map.has(item.dimension)) throw new OperationError("INVALID_QUANTITY", "Invalid quantity dimension/unit/value.");
    map.set(item.dimension, item);
  }
  if (!map.size) throw new OperationError("INVALID_QUANTITY", "Quantity vector must be explicit.");
  return map;
}
export function changeLoad(load: readonly Quantity[], demand: readonly Quantity[], sign: 1 | -1): Quantity[] {
  const current = quantityMap(load);
  const requested = quantityMap(demand);
  if (requested.size !== current.size || [...current.keys()].some(key => !requested.has(key))) {
    throw new OperationError("UNIT_MISMATCH", "Demand must explicitly specify every constrained dimension, including zero.");
  }
  for (const item of requested.values()) {
    const base = current.get(item.dimension);
    if (!base || base.unit !== item.unit) throw new OperationError("UNIT_MISMATCH", "Missing/incompatible load dimension.");
    const next = addDecimalQuantity(base.value, item.value, sign);
    if (!Number.isFinite(next) || next < 0) throw new OperationError("CAPACITY", "Negative or invalid load.");
    current.set(item.dimension, { ...base, value: next });
  }
  return [...current.values()];
}
export function assertCapacity(load: readonly Quantity[], capacity: readonly Quantity[]): void {
  const limits = quantityMap(capacity), values = quantityMap(load);
  if (limits.size !== values.size) throw new OperationError("UNIT_MISMATCH", "Capacity/load dimensions differ.");
  for (const item of values.values()) {
    const limit = limits.get(item.dimension);
    if (!limit || limit.unit !== item.unit) throw new OperationError("UNIT_MISMATCH", "Capacity/load units differ.");
    if (item.value > limit.value) throw new OperationError("CAPACITY", "Capacity exceeded at a stop.");
  }
}
export function zeroLoad(capacity: readonly Quantity[]): Quantity[] {
  quantityMap(capacity);
  return capacity.map(item => ({ ...item, value: 0 }));
}
export function equalLoad(a: readonly Quantity[], b: readonly Quantity[]): boolean {
  const left = quantityMap(a), right = quantityMap(b);
  return left.size === right.size && [...left.values()].every(item => {
    const other = right.get(item.dimension);
    return other?.unit === item.unit && other.value === item.value;
  });
}
