import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    coverage: {
      exclude: ["src/**/*.spec.ts", "src/database/orm/prisma/generated/**"],
      include: ["src/**/*.ts"],
      provider: "v8",
      reporter: ["text", "html", "json-summary", "lcov"],
    },
    globals: true,
    include: ["**/*.spec.ts"],
    root: "./",
  },
});
