// Baseline vite.config.ts for React Router v8 (framework mode) on Cloudflare Workers via vite-plus (`vp`).
// Plugin set/order matches the Cloudflare react-router starter template. Last verified: 2026-09-27.
// Rationale and optional variants: references/react-router.md and references/vite-plus.md.
import { cloudflare } from "@cloudflare/vite-plugin";
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, lazyPlugins } from "vite-plus";

const ignorePatterns = [
  ".react-router/**", // generated route types
  "worker-configuration.d.ts",
  "app/components/ui/**", // shadcn output
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
      internalPattern: ["~/"],
    },
    sortTailwindcss: {
      // Tailwind v4: classes are sorted from the stylesheet, not a v3 config file.
      stylesheet: "./app/app.css",
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
    cloudflare({ viteEnvironment: { name: "ssr" } }), // run React Router's ssr env in workerd
    tailwindcss(),
    reactRouter(), // includes React Refresh; no @vitejs/plugin-react
  ]),
});

export default config;
