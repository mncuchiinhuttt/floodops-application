import { useEffect } from "react";
import { RouterProvider } from "react-router";
import type { createApplication } from "../router";
import { RuntimeProvider } from "./context";
export function WebApplication({ application }: { application: ReturnType<typeof createApplication> }) {
  const { runtime, router } = application;
  useEffect(() => {
    const online = () => runtime.setOnline(navigator.onLine);
    const foreground = () => {
      if (document.visibilityState === "visible" && navigator.onLine && runtime.snapshot().identity && !runtime.snapshot().eventsPaused)
        void runtime.refresh().then(() => runtime.queries.invalidateQueries({ queryKey: ["session"] })).catch(() => undefined);
    };
    online(); window.addEventListener("online", online); window.addEventListener("offline", online); window.addEventListener("focus", foreground);
    return () => { window.removeEventListener("online", online); window.removeEventListener("offline", online); window.removeEventListener("focus", foreground); runtime.dispose(); };
  }, [runtime]);
  return <RuntimeProvider runtime={runtime}><RouterProvider router={router} /></RuntimeProvider>;
}
