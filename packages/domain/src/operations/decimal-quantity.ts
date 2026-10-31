import { OperationError } from "./operation-types.ts";

// Quantities use the exact decimal spelling of each canonical finite JSON number.
function decimal(value: number): { coefficient: bigint; scale: number } {
  if (!Number.isFinite(value) || value < 0) throw new OperationError("INVALID_QUANTITY", "Invalid decimal quantity.");
  const [mantissa, exponent = "0"] = value.toString().toLowerCase().split("e");
  const [whole, fraction = ""] = mantissa!.split(".");
  let coefficient = BigInt(whole! + fraction), scale = fraction.length - Number(exponent);
  if (scale < 0) { coefficient *= 10n ** BigInt(-scale); scale = 0; }
  return { coefficient, scale };
}
export function addDecimalQuantity(a: number, b: number, sign: 1 | -1): number {
  const left = decimal(a), right = decimal(b), scale = Math.max(left.scale, right.scale);
  const coefficient = left.coefficient * 10n ** BigInt(scale - left.scale)
    + BigInt(sign) * right.coefficient * 10n ** BigInt(scale - right.scale);
  if (coefficient < 0n) throw new OperationError("CAPACITY", "Negative load.");
  const result = Number(`${coefficient}e-${scale}`);
  if (!Number.isFinite(result)) throw new OperationError("QUANTITY_PRECISION", "Quantity overflow.");
  const roundtrip = decimal(result), shared = Math.max(scale, roundtrip.scale);
  if (coefficient * 10n ** BigInt(shared - scale) !== roundtrip.coefficient * 10n ** BigInt(shared - roundtrip.scale)) {
    throw new OperationError("QUANTITY_PRECISION", "Exact quantity cannot be represented by the wire number.");
  }
  return result;
}
