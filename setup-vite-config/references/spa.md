# Plain Vite + React SPA

Template: [`../templates/spa/vite.config.ts`](../templates/spa/vite.config.ts). Shared toolchain rules: [vite-plus.md](vite-plus.md).

**Detect:** `vite` + `@vitejs/plugin-react` (or `@vitejs/plugin-react-swc`) without `@react-router/dev` or `@tanstack/react-start`. Usually has an `index.html` and `src/main.tsx`.

## Adapting the template

- **Plugins:** keep `viteReact()`; keep `tailwindcss()` only with Tailwind v4. Add the repo's other plugins inside `lazyPlugins(() => [...])`. With TanStack Router file-based routing, put `tanstackRouter({ target: "react", autoCodeSplitting: true })` from `@tanstack/router-plugin/vite` **before** `viteReact()` and ignore `src/routeTree.gen.ts`.
- **Tailwind stylesheet:** set `sortTailwindcss.stylesheet` to the CSS file with `@import "tailwindcss"` (often `./src/index.css`). Remove `sortTailwindcss` without Tailwind.
- **Alias:** match the repo (`@/*` → `internalPattern: ["@/"]`; `#/*` needs none).
- **Tests:** keep `test:` and the `vitest` lint plugin only if the repo has tests. Switch `environment` to `"jsdom"` or `"happy-dom"` for component tests if that package is installed.
- **Static deploy to Cloudflare:** SPAs usually don't need `@cloudflare/vite-plugin`. If the repo already has wrangler.jsonc with `assets`, keep it and add `.wrangler` and `worker-configuration.d.ts` to the ignores.

## package.json scripts

```json
{
  "dev": "vp dev",
  "build": "vp build",
  "preview": "vp preview",
  "test": "vp test run",
  "check": "vp check",
  "prepare": "vp config"
}
```

## tsconfig essentials

`moduleResolution: "bundler"`, `verbatimModuleSyntax: true`, `noEmit: true`, `strict: true`, `jsx: "react-jsx"`, `types: ["vite-plus/client"]`. Drop `baseUrl` (TypeScript 7 removed it).
