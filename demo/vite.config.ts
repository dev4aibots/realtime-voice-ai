import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Fully static build: relative asset paths, zero network calls, no login.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    assetsInlineLimit: 4096,
  },
});
