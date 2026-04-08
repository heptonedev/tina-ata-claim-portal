import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  server: {
    headers: {
      "Content-Security-Policy": "",
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  optimizeDeps: {
    esbuild: {
      define: {
        global: "globalThis",
      },
    },
  },
  define: {
    global: "globalThis",
  },
});
