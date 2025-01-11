import { sheriff, type SheriffSettings, tseslint } from "eslint-config-sheriff";

const sheriffOptions: SheriffSettings = {
  react: false,
  lodash: false,
  remeda: false,
  next: false,
  astro: false,
  playwright: false,
  jest: false,
  vitest: false,
};

export default [
  { ignores: ["eslint.config.ts", "config/*"] },
  ...tseslint.config(sheriff(sheriffOptions), {
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
      "@typescript-eslint/switch-exhaustiveness-check": [
        "error",
        {
          allowDefaultCaseForExhaustiveSwitch: false,
          considerDefaultExhaustiveForUnions: true,
        },
      ],
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "default",
          format: ["camelCase"],
          leadingUnderscore: "forbid",
          trailingUnderscore: "forbid",
        },
        {
          selector: "variable",
          format: ["camelCase", "PascalCase"],
          modifiers: ["const"],
          leadingUnderscore: "forbid",
          trailingUnderscore: "forbid",
        },
        {
          selector: "variable",
          format: ["camelCase", "UPPER_CASE"],
          modifiers: ["const"],
          types: ["string", "number"],
          leadingUnderscore: "forbid",
          trailingUnderscore: "forbid",
        },
        {
          selector: "objectLiteralProperty",
          format: null,
          leadingUnderscore: "allowSingleOrDouble",
          trailingUnderscore: "forbid",
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
          leadingUnderscore: "forbid",
          trailingUnderscore: "forbid",
        },
        {
          selector: "variable",
          types: ["boolean"],
          format: ["PascalCase"],
          prefix: ["is", "are", "has", "should", "can"],
          leadingUnderscore: "forbid",
          trailingUnderscore: "forbid",
        },
        { selector: "variable", modifiers: ["destructured"], format: null },
        { selector: "typeProperty", format: null },
        {
          selector: ["variable", "function"],
          types: ["function"],
          format: ["camelCase", "PascalCase"],
          leadingUnderscore: "forbid",
          trailingUnderscore: "forbid",
        },
      ],
    },
  }),
];
