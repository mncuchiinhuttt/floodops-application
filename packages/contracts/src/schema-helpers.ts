import { z } from "zod";

export function canonicalJson(value: unknown): string {
  if (value === null || typeof value !== "object") return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalJson).join(",")}]`;
  return `{${Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(
    ([key, item]) => `${JSON.stringify(key)}:${canonicalJson(item)}`,
  ).join(",")}}`;
}

export function hasUniqueItems(items: readonly unknown[]): boolean {
  return new Set(items.map(canonicalJson)).size === items.length;
}

export function exactlyOne<T extends readonly [z.ZodType, ...z.ZodType[]]>(variants: T) {
  return z.union(variants).refine(value => variants.filter(s => s.safeParse(value).success).length === 1, "Expected exactly one variant");
}

export function isUri(value: string): boolean {
  return /^[A-Za-z][A-Za-z0-9+.-]*:[^\s]*$/.test(value) && ![...value].some(ch => ch.charCodeAt(0) < 32 || ch.charCodeAt(0) === 127);
}

export function isTimestamp(value: string): boolean {
  const m = /^(\d{4})-(\d{2})-(\d{2})[Tt](\d{2}):(\d{2}):(\d{2})(?:\.\d+)?(?:[Zz]|([+-])(\d{2}):(\d{2}))$/.exec(value);
  if (!m) return false;
  const year = Number(m[1]), month = Number(m[2]), day = Number(m[3]);
  const days = [31, year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]! &&
    Number(m[4]) <= 23 && Number(m[5]) <= 59 && Number(m[6]) <= 59 &&
    (m[8] === undefined || (Number(m[8]) <= 23 && Number(m[9]) <= 59));
}
