# Vite-plus (`vite.config.ts`)

Use this when the stack is **Vite-plus** (`vite-plus` package): bundling, linting, formatting, and tests are configured from one `vite.config.ts` via `defineConfig`.

## What to do

- Add or merge `vite.config.ts` so it matches the project (plugins, ignore paths, test globs). Adjust `lint.fmt` `ignorePatterns` and `staged` commands for your repo layout.
- Keep `resolve.tsconfigPaths: true` if you use path aliases from `tsconfig.json`.
- Extend `plugins` as needed (e.g. other Vite plugins beyond Tailwind and React).

## Sample configuration

```typescript
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig, loadEnv } from "vite-plus";

const config = defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  resolve: { tsconfigPaths: true },

  plugins: [
    tailwindcss(),
    viteReact(), // add any other plugins you need here
  ],

  lint: {
    ignorePatterns: ["dist", "drizzle/**", "app/components/ui/**", ".cursor/**"], // replace with your own ignore patterns
    options: { typeAware: true, typeCheck: true },
  },

  fmt: {
    ignorePatterns: ["dist", "drizzle/**", "app/components/ui/**", ".cursor/**"], // replace with your own ignore patterns
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
      internalPattern: ["#/"],
    },
  },

  test: {
    globals: true,
    environment: "node",
    include: ["**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["node_modules", "dist", ".output", "**/*.integration.test.*"],
  },
});

export default config;
```

Remove unused imports (for example `loadEnv`) if you do not use them.
