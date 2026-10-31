import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
export default defineConfig({ plugins: [react(), tailwind()], server: { host: "127.0.0.1", port: 5174, strictPort: true,
  proxy: { "/api/v1": { target: "http://127.0.0.1:8789", changeOrigin: false } } }, build: { outDir: "dist/live" } });
