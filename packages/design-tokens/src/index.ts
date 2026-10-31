export { tokens } from "./tokens.native";
export type SemanticTokens = typeof import("./tokens.native").tokens.semantic;
export type StatusTone = keyof SemanticTokens["status"];
export type ProvenanceTone = keyof SemanticTokens["provenance"];
export type PriorityTone = keyof SemanticTokens["priority"];
