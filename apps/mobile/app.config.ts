import type { ExpoConfig } from "expo/config";
import { normalizeDevelopmentLanOrigin } from "@floodops/api-client";
declare const process: { env: Record<string, string | undefined> };
const apiBaseUrl = process.env.EXPO_PUBLIC_FLOODOPS_API_BASE_URL ?? "http://127.0.0.1:8790/api/v1";
const developmentLanOrigin = process.env.EXPO_PUBLIC_FLOODOPS_DEV_LAN_ORIGIN;
const normalizedDevelopmentLanOrigin = developmentLanOrigin === undefined ? undefined : normalizeDevelopmentLanOrigin(developmentLanOrigin);
if (developmentLanOrigin !== undefined && normalizedDevelopmentLanOrigin === null) throw new Error("Native development LAN origin must be an exact RFC1918 IPv4 HTTP origin with an explicit port");
if (developmentLanOrigin !== undefined && process.env.NODE_ENV !== "development") throw new Error("Native development LAN origin is available only in development");
const url = new URL(apiBaseUrl);
if (url.username || url.password || url.search || url.hash) throw new Error("Native API base URL cannot contain credentials, query or fragment data");
if (developmentLanOrigin !== undefined && url.origin !== normalizedDevelopmentLanOrigin) throw new Error("Native API base URL origin must match the development LAN origin");
if (url.protocol !== "https:" && !(url.protocol === "http:" && (["127.0.0.1", "localhost", "[::1]"].includes(url.hostname) || url.origin === normalizedDevelopmentLanOrigin))) throw new Error("Native API must use HTTPS or explicit loopback development");
export default { name: "FloodOps Simulation", slug: "floodops-simulation", version: "0.1.0", scheme: "floodops",
  orientation: "default", userInterfaceStyle: "automatic", runtimeVersion: { policy: "appVersion" },
  extra: { apiBaseUrl, developmentLanOrigin: developmentLanOrigin ?? null }, plugins: ["expo-router", "expo-secure-store", ["expo-image-picker", { photosPermission: "Choose a road photo to submit for human review in this simulation.", cameraPermission: false, microphonePermission: false }]],
  ios: { supportsTablet: true }, android: {}, experiments: { typedRoutes: true } } satisfies ExpoConfig;
