// Baseline vite.config.ts for TanStack Start on Cloudflare Workers via vite-plus (`vp`).
// Plugin set/order matches `@tanstack/cli create --deployment cloudflare` output. Last verified: 2026-09-27.
// Rationale and optional variants: references/tanstack-start.md and references/vite-plus.md.
import { cloudflare } from "@cloudflare/vite-plugin";
import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, lazyPlugins } from "vite-plus";

const ignorePatterns = [
  "src/routeTree.gen.ts",
  "worker-configuration.d.ts",
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
      stylesheet: "./src/styles.css",
      functions: ["clsx", "cn", "cva", "tw", "twMerge"],
    },
  },
  lint: {
    ignorePatterns,
    plugins: ["react", "typescript", "import", "unicorn", "oxc"],
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
    devtools(), // must be first
    cloudflare({ viteEnvironment: { name: "ssr" } }), // run Start's ssr env in workerd
    tailwindcss(),
    tanstackStart(),
    viteReact(), // must come after tanstackStart()
  ]),
});

export default config;
