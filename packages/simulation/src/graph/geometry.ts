import type { Coordinate } from "./graph-types.ts";

// IUGG mean Earth radius; spherical approximation, not a D04 calibration claim.
const EARTH_RADIUS_METERS = 6_371_008.8;
const radians = (degrees: number) => degrees * Math.PI / 180;

export function assertCoordinate(coordinate: Coordinate): void {
  if (coordinate.length !== 2 || !Number.isFinite(coordinate[0])
    || !Number.isFinite(coordinate[1]) || Math.abs(coordinate[0]) > 180
    || Math.abs(coordinate[1]) > 90) throw new Error("Invalid WGS84 longitude/latitude.");
}

export function distanceMeters(a: Coordinate, b: Coordinate): number {
  assertCoordinate(a);
  assertCoordinate(b);
  const latitudeDelta = radians(b[1] - a[1]);
  const longitudeDelta = radians(b[0] - a[0]);
  const haversine = Math.sin(latitudeDelta / 2) ** 2
    + Math.cos(radians(a[1])) * Math.cos(radians(b[1])) * Math.sin(longitudeDelta / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(Math.min(1, haversine)));
}

export function polylineLengthMeters(geometry: readonly Coordinate[]): number {
  if (geometry.length < 2) throw new Error("A polyline needs at least two coordinates.");
  geometry.forEach(assertCoordinate);
  let length = 0;
  for (let i = 1; i < geometry.length; i++) length += distanceMeters(geometry[i - 1]!, geometry[i]!);
  return length;
}
