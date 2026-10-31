import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { IdSchema } from "@floodops/contracts";
import { useNativeRuntime } from "../../../src/features/session/runtime/native-runtime";
export default function SessionLayout() {
  const { sessionId } = useLocalSearchParams<{ sessionId: string }>(); const { context } = useNativeRuntime();
  if (!IdSchema.safeParse(sessionId).success || !context || context.session.session_id !== sessionId) return <Redirect href="/" />;
  return <Stack screenOptions={{ headerTitle: `${context.participant.role} workspace` }} />;
}
