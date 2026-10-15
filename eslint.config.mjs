import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  globalIgnores([
    ".next/**",
    "apps/web/.next/**",
    "apps/web/out/**",
    "apps/desktop/src-tauri/target/**",
    "next-env.d.ts",
    "apps/web/next-env.d.ts",
  ]),
]);
