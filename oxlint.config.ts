import { defineConfig } from "oxlint";
import core from "ultracite/oxlint/core";
import react from "ultracite/oxlint/react";
import tanstack from "ultracite/oxlint/tanstack";

export default defineConfig({
  extends: [core, react, tanstack],
  ignorePatterns: [
    ".agents/**",
    ".agent/**",
    ".cursor/**",
    ".kiro/**",
    ".kilocode/**",
    ".trae/**",
    ".claude/**",
    "node_modules/**",
    "dist/**",
    "packages/ui/src/**",
  ],
  overrides: [
    {
      files: ["*"],
      rules: {
        "func-style": ["error", "declaration", { allowArrowFunctions: true }],
        "no-negated-condition": "off",
        "react/function-component-definition": ["allow"],
        "typescript/no-empty-interface": "off",
        "typescript/no-empty-object-type": "off",
        "unicorn/filename-case": [
          "error",
          {
            cases: {
              camelCase: true,
              kebabCase: true,
              pascalCase: true,
              snakeCase: true,
            },
          },
        ],
        "unicorn/no-negated-condition": "off",
      },
    },
  ],
  rules: {
    complexity: "off",
    "no-warning-comments": "off",
  },
});
