/** Street name for a WGS84 point from OpenStreetMap Nominatim (free, light interactive use); null on any failure. */
export async function streetNameAt([lon, lat]: readonly [number, number], signal: AbortSignal): Promise<string | null> {
  try {
    const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=17&accept-language=vi&lat=${lat}&lon=${lon}`,
      { signal, referrerPolicy: "origin", credentials: "omit" });
    if (!response.ok) return null;
    const body: unknown = await response.json();
    if (!body || typeof body !== "object") return null;
    const address = "address" in body ? body.address : null;
    if (address && typeof address === "object" && "road" in address && typeof address.road === "string" && address.road.trim()) return address.road.trim();
    return "name" in body && typeof body.name === "string" && body.name.trim() ? body.name.trim() : null;
  } catch { return null; }
}
