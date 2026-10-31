import type { ExpoConfig } from "expo/config";
declare const process: { env: Record<string, string | undefined> };
const apiBaseUrl = process.env.EXPO_PUBLIC_FLOODOPS_API_BASE_URL ?? "http://127.0.0.1:8790/api/v1";
const url = new URL(apiBaseUrl);
if (url.username || url.password || url.search || url.hash) throw new Error("Native API base URL cannot contain credentials, query or fragment data");
if (url.protocol !== "https:" && !(url.protocol === "http:" && ["127.0.0.1", "localhost", "[::1]"].includes(url.hostname))) throw new Error("Native API must use HTTPS or explicit loopback development");
export default { name: "FloodOps Simulation", slug: "floodops-simulation", version: "0.1.0", scheme: "floodops",
  orientation: "default", userInterfaceStyle: "automatic", runtimeVersion: { policy: "appVersion" },
  extra: { apiBaseUrl }, plugins: ["expo-router", "expo-secure-store", ["expo-image-picker", { photosPermission: "Choose a road photo to submit for human review in this simulation.", cameraPermission: false, microphonePermission: false }]],
  ios: { supportsTablet: true }, android: {}, experiments: { typedRoutes: true } } satisfies ExpoConfig;
