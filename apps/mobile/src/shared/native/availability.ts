import { useEffect, useState } from "react";
import { AppState } from "react-native";
import * as Network from "expo-network";
export function useNativeAvailability() {
  const [foreground, setForeground] = useState(AppState.currentState === "active");
  const [connected, setConnected] = useState(false);
  useEffect(() => {
    let alive = true;
    const update = (state: Network.NetworkState) => { if (alive) setConnected(state.isConnected === true && state.isInternetReachable === true); };
    void Network.getNetworkStateAsync().then(update).catch(() => { if (alive) setConnected(false); });
    const network = Network.addNetworkStateListener(update);
    const app = AppState.addEventListener("change", state => setForeground(state === "active"));
    return () => { alive = false; network.remove(); app.remove(); };
  }, []);
  return { foreground, online: foreground && connected };
}
