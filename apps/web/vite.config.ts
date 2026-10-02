import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite";

import { createWebEnv } from "./src/env-schema.ts";

export default defineConfig(({ mode }) => {
  createWebEnv(loadEnv(mode, process.cwd(), "VITE_"));

  return {
    plugins: [
      tailwindcss(),
      tanstackRouter({
        autoCodeSplitting: true,
        target: "react",
      }),
      react(),
    ],
    resolve: {
      tsconfigPaths: true,
    },
    server: {
      port: 3001,
    },
  };
});
