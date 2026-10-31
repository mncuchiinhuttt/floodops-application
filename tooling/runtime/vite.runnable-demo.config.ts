import base from "../../apps/web/vite.config";
/** Local connected demo; not the separate prebuilt fixture preview or deployment config. */
export default { ...base, root: new URL("../../apps/web", import.meta.url).pathname,
  server: { ...base.server, host: "127.0.0.1", port: 5170, strictPort: true,
    proxy: { "/api/v1": { target: "http://127.0.0.1:8760", changeOrigin: false } } } };
