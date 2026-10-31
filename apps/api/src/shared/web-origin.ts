/** `WEB_ORIGIN` is one exact origin or a comma-separated list of exact origins (for example the workers.dev URL plus a custom domain). No wildcards. */
export function isWebOrigin(configured: string, origin: string | null | undefined): origin is string {
  return !!origin && configured.split(",").some(entry => entry.trim() === origin);
}
