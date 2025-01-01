import globals from "globals";
import js from "@eslint/js";
import typescript from "typescript-eslint";

/** @type {import('eslint').Linter.Config[]} */
export default [
  {
    files: ["src/**/*.{ts}"],
    languageOptions: {
      globals: {
        ...globals.node,
      },
    },
  },
  js.configs.recommended,
  ...typescript.configs.recommended,
];
