import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Reference: https://vitejs.dev/config/shared-options.html#base
  base: "/nmdc-changesheet-converter/",
});
