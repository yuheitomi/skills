// Baseline vite.config.ts for a plain Vite + React SPA (no framework, no SSR) via vite-plus (`vp`).
// Shares fmt/lint house style with the react-router and tanstack-start templates.
// Rationale and optional variants: references/spa.md and references/vite-plus.md.
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

const ignorePatterns = [
  "dist",
  "src/components/ui/**", // shadcn output
  "drizzle/**",
];

const config = defineConfig({
  // Pre-commit hook installed by `vp config` (package.json "prepare").
  staged: {
    "*": "vp check --fix",
  },
  fmt: {
    ignorePatterns,
    printWidth: 100,
    semi: true,
    singleQuote: false,
    sortImports: {
      // `#/*` subpath imports land in "subpath", so no internalPattern is needed.
      groups: [
        ["builtin", "external"],
        { newlinesBetween: true },
        ["internal", "subpath"],
        { newlinesBetween: true },
        ["parent", "sibling", "index"],
        "style",
        "unknown",
      ],
      newlinesBetween: true,
    },
    sortTailwindcss: {
      // Tailwind v4: classes are sorted from the stylesheet, not a v3 config file.
      stylesheet: "./src/index.css",
      functions: ["clsx", "cn", "cva", "tw", "twMerge"],
    },
  },
  lint: {
    ignorePatterns,
    plugins: ["react", "typescript", "import", "unicorn", "oxc", "vitest"],
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: {
      // Import defineConfig etc. from "vite-plus", not "vite"/"vitest".
      "vite-plus/prefer-vite-plus-imports": "error",
      "typescript/no-floating-promises": "warn",
      "typescript/no-deprecated": "error",
    },
    options: { typeAware: true, typeCheck: true },
  },
  resolve: { tsconfigPaths: true }, // built into Vite 8; no vite-tsconfig-paths
  plugins: lazyPlugins(() => [
    tailwindcss(),
    viteReact(),
  ]),
  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", "**/*.integration.test.*"],
  },
});

export default config;
