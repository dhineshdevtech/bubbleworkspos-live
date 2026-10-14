import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

export default defineConfig(() => ({
  server: {
    host: "::",
    port: 3000,
  },
  plugins: [react()],
  envPrefix: ["NEXT_PUBLIC_", "VITE_"],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@bubbleworks/shared": path.resolve(__dirname, "../../packages/shared/src/index.ts"),
    },
  },
  build: {
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("firebase")) return "firebase";
            if (id.includes("react-router-dom")) return "router";
            if (id.includes("react-dom") || id.includes("react")) return "react";
            if (id.includes("recharts")) return "charts";
            if (id.includes("lucide-react")) return "icons";
            return "vendor";
          }
        },
      },
    },
  },
}));
