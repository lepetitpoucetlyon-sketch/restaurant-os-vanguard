import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import { murDeChinePlugin } from "./eslint-plugins/mur-de-chine.mjs";
import unusedImports from "eslint-plugin-unused-imports";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    plugins: {
      "vanguard": murDeChinePlugin,
      "unused-imports": unusedImports,
    },
    rules: {
      "vanguard/no-cross-imports": "error",
      "vanguard/no-inter-module-imports": "error",
      // Barrel Contract — bloque tout import plus profond que '@/modules/<pilier>'.
      // 239 violations pré-existantes (barrel-debt) — non bloquantes aujourd'hui via le ratchet
      // du preflight (voir scripts/preflight.sh § ESLint). Seuil à descendre à chaque PR.
      "no-restricted-imports": ["error", {
        "patterns": [
          {
            "group": ["@/modules/*/*", "@modules/*/*"],
            "message": "Barrel Contract : importez uniquement '@/modules/<pilier>' (racine). Profondeur domaine/module interdite."
          },
          {
            // Bloque les imports vers l'ancien src/domain/ (rapatriement terminé en S11)
            // Utiliser @/modules/<pilier> ou @/shared/schemas selon le type.
            "group": ["@/domain", "@/domain/*", "@/domain/**"],
            "message": "Legacy src/domain/ supprimé — remplacer par @/modules/<pilier> ou @/shared/schemas."
          }
        ]
      }],
      "unused-imports/no-unused-imports": "error",
      // Unused vars: warn level, underscore prefix silences intentional non-use
      "@typescript-eslint/no-unused-vars": ["warn", {
        "varsIgnorePattern": "^_",
        "argsIgnorePattern": "^_",
        "ignoreRestSiblings": true,
        "caughtErrorsIgnorePattern": "^_"
      }],
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
    // Deep barrel imports allowed for mocking specific sub-paths (CLAUDE.md § Barrel rule).
    files: ["**/*.test.{ts,tsx}", "tests/**", "src/e2e/**", "src/__tests__/**"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-restricted-imports": "off",
    },
  },
  {
    // Pure contract definitions & infrastructure bridges need deep schema imports
    // to avoid pulling in entire module runtime trees and creating circular dependencies.
    files: [
      "src/shared/nexus/contracts/**",
      "src/shared/schemas/**",
      "src/shared/nexus-contract.ts",
      "src/shared/nexus/engines/**",
      "src/shared/nexus/state/**",
      "src/shared/hooks/**",
      "src/shared/eventBus/**",
      "src/lib/NexusTelemetryService.ts",
      "src/lib/MaintenanceAgent.ts",
      "src/modules/*/domain/schemas/**",
    ],
    rules: {
      "no-restricted-imports": "off",
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    ".next-mcc/**",
    ".firebase/**",
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
