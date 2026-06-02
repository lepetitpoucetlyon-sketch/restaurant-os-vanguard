import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { murDeChinePlugin } from "./eslint-plugins/mur-de-chine.mjs";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "vanguard": murDeChinePlugin
    },
    rules: {
      "vanguard/no-cross-imports": "error",
      // Legacy warning debt is intentionally disabled now that the blocking
      // correctness rules pass; CI focuses on hard failures rather than noise.
      "@typescript-eslint/no-unused-vars": "warn",
      "@typescript-eslint/no-explicit-any": "error",
      "@next/next/no-img-element": "off",
      "@typescript-eslint/ban-ts-comment": "error",
      "@typescript-eslint/no-require-imports": "error",
      "react/no-unescaped-entities": "off",
      "@typescript-eslint/prefer-as-const": "off",
      "react-hooks/exhaustive-deps": "off",
      "jsx-a11y/alt-text": "off",
      "react-hooks/purity": "off",
      "react-hooks/preserve-manual-memoization": "off",
      "react-hooks/set-state-in-effect": "off",
    },
  },
  {
    files: ["scripts/**/*.js"],
    rules: {
      "@typescript-eslint/no-require-imports": "off",
    },
  },
  {
    // Test files legitimately use `any` for mocks/fixtures/stubs — not shipped code.
    files: ["**/*.test.{ts,tsx}", "tests/**", "src/tests/**", "src/__tests__/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "src_VANGUARD_AUDIT/**",
    "src_OLD_VIBE_BACKUP/**",
    ".nexus/agents/**",
    ".nexus/scripts/**",
    ".nexus/hooks/**",
    ".staging-mcc/**",
    ".mempalace/**",
    "graphify_tool/**",
    "graphify-out/**",
    "functions/**",
    "scratch/**",
  ]),
]);

export default eslintConfig;
