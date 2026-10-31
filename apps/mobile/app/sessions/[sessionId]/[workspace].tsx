import { useLocalSearchParams } from "expo-router";
import { SessionSurface } from "../../../src/features/session/runtime/session-surfaces";
export default function WorkspaceSurfaceRoute() {
  const { workspace } = useLocalSearchParams<{ workspace: string }>(); return <SessionSurface workspace={workspace} />;
}
