import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    coverage: {
      exclude: ["src/**/*.test.{ts,tsx}", "src/routeTree.gen.ts"],
      include: ["src/**/*.{ts,tsx}"],
      provider: "v8",
      reporter: ["text", "html", "json-summary", "lcov"],
    },
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
