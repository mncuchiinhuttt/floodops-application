/** In-memory test module replacing expo-file-system; never production or device proof. */
type Entry = { kind: "file"; bytes: Uint8Array; modificationTime: number } | { kind: "directory" };
const entries = new Map<string, Entry>();
let clock = 0;
export const mockStorage = {
  entries, copies: [] as { source: string; destination: string }[], writes: [] as string[],
  copyGate: null as Promise<void> | null, bytesGate: null as Promise<void> | null, failNextWrite: false,
  reset() { entries.clear(); this.copies.length = 0; this.writes.length = 0; this.copyGate = null; this.bytesGate = null; this.failNextWrite = false; clock = 0; },
  seed(uri: string, content: string | Uint8Array) {
    const bytes = typeof content === "string" ? new TextEncoder().encode(content) : new Uint8Array(content);
    entries.set(uri, { kind: "file", bytes, modificationTime: ++clock });
  },
};
function path(parts: (string | File | Directory)[]) {
  return parts.map((part, index) => {
    const value = typeof part === "string" ? part : part.uri;
    return index === 0 ? value.replace(/\/$/, "") : value.replace(/^\/+|\/+$/g, "");
  }).join("/");
}
export class Directory {
  readonly uri: string;
  constructor(...parts: (string | File | Directory)[]) { this.uri = path(parts); }
  get exists() { return entries.get(this.uri)?.kind === "directory"; }
  get name() { return this.uri.slice(this.uri.lastIndexOf("/") + 1); }
  create(_options?: { intermediates?: boolean; idempotent?: boolean }) {
    void _options;
    const segments = this.uri.slice("file:///".length).split("/");
    segments.forEach((_, index) => entries.set(`file:///${segments.slice(0, index + 1).join("/")}`, { kind: "directory" }));
  }
  list(): (Directory | File)[] {
    const prefix = `${this.uri}/`;
    return [...entries].filter(([uri]) => uri.startsWith(prefix) && !uri.slice(prefix.length).includes("/"))
      .map(([uri, value]) => value.kind === "file" ? new File(uri) : new Directory(uri));
  }
}
export class File {
  readonly uri: string;
  constructor(...parts: (string | File | Directory)[]) { this.uri = path(parts); }
  get name() { return this.uri.slice(this.uri.lastIndexOf("/") + 1); }
  get size() { return this.entry().bytes.byteLength; }
  get modificationTime() { return this.entry().modificationTime; }
  get exists() { return entries.get(this.uri)?.kind === "file"; }
  private entry() {
    const value = entries.get(this.uri); if (!value || value.kind !== "file") throw new Error("Missing synthetic file");
    return value;
  }
  async bytes() { if (mockStorage.bytesGate) await mockStorage.bytesGate; return new Uint8Array(this.entry().bytes); }
  async json() { return JSON.parse(new TextDecoder().decode(await this.bytes())); }
  async write(content: string | Uint8Array) {
    if (mockStorage.failNextWrite) { mockStorage.failNextWrite = false; throw new Error("Synthetic interrupted write"); }
    mockStorage.writes.push(this.uri); mockStorage.seed(this.uri, content);
  }
  async copy(destination: File) {
    mockStorage.copies.push({ source: this.uri, destination: destination.uri });
    if (mockStorage.copyGate) await mockStorage.copyGate;
    mockStorage.seed(destination.uri, await this.bytes());
  }
}
export const Paths = { document: new Directory("file:///documents") };
