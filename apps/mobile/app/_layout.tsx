import "react-native-gesture-handler";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { NativeRuntimeProvider } from "../src/features/session/runtime/native-runtime";
export default function RootLayout() {
  return <SafeAreaProvider><NativeRuntimeProvider><Stack screenOptions={{ headerTitle: "FloodOps · Simulation" }} /></NativeRuntimeProvider></SafeAreaProvider>;
}
