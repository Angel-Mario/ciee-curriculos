import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import nestjs from "ultracite/oxlint/nestjs";
import vitest from "ultracite/oxlint/vitest";

export default defineConfig({
  extends: [core, nestjs, vitest],
  ignorePatterns: [...(core.ignorePatterns ?? []), "migrations/**"],
  overrides: [
    {
      files: ["**/*.{test,spec}.{ts,tsx,js,jsx}"],
      plugins: ["vitest"],
      rules: {
        "vitest/consistent-test-filename": [
          "error",
          { pattern: ".*\\.(test|spec)\\.[tj]sx?$" },
        ],
      },
    },
  ],
  rules: {
    "class-methods-use-this": "off",
    "func-style": ["off"],
    "no-useless-constructor": "off",
    "oxc/no-const-enum": "off",
    "typescript/ban-ts-comment": "off",
    "typescript/consistent-type-imports": "off",
    "typescript/no-extraneous-class": "off",
    "typescript/no-non-null-assertion": "off",
    "typescript/parameter-properties": "off",
    "unicorn/no-static-only-class": "off",
  },
});
