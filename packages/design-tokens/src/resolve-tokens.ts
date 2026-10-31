import source from "../tokens.json";

type Tree = { [key: string]: string | number | Tree };
export function resolveTokens(tree: Tree, path: string[] = []): Tree {
  return Object.fromEntries(Object.entries(tree).map(([key, value]) => {
    if (typeof value === "object") return [key, resolveTokens(value, [...path, key])];
    if (typeof value !== "string" || !value.startsWith("{")) return [key, value];
    const reference = value.slice(1, -1).split(".");
    let resolved: string | number | Tree = source as unknown as Tree;
    for (const segment of reference) {
      if (typeof resolved !== "object" || !(segment in resolved)) {
        throw new Error(`Unknown token reference at ${[...path, key].join(".")}`);
      }
      resolved = resolved[segment]!;
    }
    if (typeof resolved === "object" || (typeof resolved === "string" && resolved.startsWith("{"))) {
      throw new Error("Aliases must point to primitive scalar values.");
    }
    return [key, resolved];
  }));
}

export function flattenTokens(tree: Tree, prefix = ""): Record<string, string | number> {
  return Object.fromEntries(Object.entries(tree).flatMap(([key, value]) => {
    const name = prefix ? `${prefix}-${key}` : key;
    return typeof value === "object" ? Object.entries(flattenTokens(value, name)) : [[name, value]];
  }));
}
