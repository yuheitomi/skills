# React Router v8 (framework mode) on Cloudflare Workers

Template: [`../templates/react-router/vite.config.ts`](../templates/react-router/vite.config.ts). Verified versions: [`../templates/react-router/versions.txt`](../templates/react-router/versions.txt). Shared toolchain rules: [vite-plus.md](vite-plus.md).

**Detect:** `@react-router/dev` in devDependencies, a `react-router.config.ts`, and an `app/` directory. If `react-router` is used only as a library (no `@react-router/dev`), this is an SPA: use [spa.md](spa.md).

## Stack

- `reactRouter()` from `@react-router/dev/vite`. It handles React Refresh itself: **no `@vitejs/plugin-react`**. Remove it if present.
- `cloudflare()` from `@cloudflare/vite-plugin`, which runs dev in workerd
- `@tailwindcss/vite` (Tailwind v4, no PostCSS config)
- Optional: **react-router-auto-routes** for file-based routing. `app/routes.ts` is just `export default autoRoutes();`. `_layout.tsx` is the only file that creates nesting and `$name` marks a dynamic segment. Don't introduce it into a repo with hand-written `routes.ts` unless the user asks.
- The dev and build scripts still go through the React Router CLI (`react-router dev` / `react-router build`). It loads Vite programmatically, which resolves to vite-plus-core through the catalog alias.

## Plugin order

```ts
plugins: lazyPlugins(() => [
  cloudflare({ viteEnvironment: { name: "ssr" } }),  // run React Router's "ssr" env in workerd
  tailwindcss(),
  reactRouter(),
]),
```

- Not on Cloudflare: drop `cloudflare()`, the wrangler files, and `worker-configuration.d.ts` from ignores.
- `cloudflare({ ..., remoteBindings: true })` plus `"remote": true` on a binding in wrangler.jsonc makes local dev hit the real KV/R2/etc. Only when the user wants that.

## Path alias and ignores

- Alias: `~/*` → `./app/*` in tsconfig `paths`, so `sortImports.internalPattern: ["~/"]`. If the repo also maps `"*": ["./*"]` (so `shared/*`, `workers/*` resolve from the root), add those prefixes to `internalPattern`.
- Ignore: `.react-router/**` (route types), `worker-configuration.d.ts`, `app/components/ui/**` (shadcn), `drizzle/**`, plus `build` and `.wrangler` as needed.
- `sortTailwindcss.stylesheet`: usually `./app/app.css`.
- **typeCheck needs route types:** `+types/*` imports resolve from `.react-router/types`, so `react-router typegen` (and `wrangler types`) must run before `vp check` in CI or a fresh clone. `react-router dev` regenerates them while running.

## Upgrading a React Router 7-era project (e.g. fresh `pnpm create cloudflare@latest --framework=react-router`)

The Cloudflare starter is still on React Router 7.9 / Vite 7. Only do these steps if the user agrees to upgrade:

1. Bump `react-router` and `@react-router/dev` to `^8`, TypeScript to 7.
2. Remove `vite-tsconfig-paths` (use `resolve.tsconfigPaths`), and remove `future.unstable_viteEnvironmentApi` from `react-router.config.ts`. The v8 `FutureConfig` only has `unstable_enableNodeReadableStream` and `unstable_optimizeDeps`.
3. Replace the `AppLoadContext` module augmentation with `RouterContextProvider` + `createContext` (see [Worker entry](#worker-entry)).
4. Run `vp migrate`, then merge the template `vite.config.ts` and the catalog from [vite-plus.md](vite-plus.md).

## Worker entry

```jsonc
// wrangler.jsonc
{
  "$schema": "node_modules/wrangler/config-schema.json",
  "main": "./workers/app.ts",
  "compatibility_date": "<today>",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
  "upload_source_maps": true,
}
```

```ts
// app/lib/contexts.ts
import { createContext } from "react-router";

export const CloudflareContext = createContext<{ env: Env; ctx: ExecutionContext }>();
```

```ts
// workers/app.ts
import { createRequestHandler, RouterContextProvider } from "react-router";

import { CloudflareContext } from "~/lib/contexts";

const requestHandler = createRequestHandler(
  () => import("virtual:react-router/server-build"),
  import.meta.env.MODE,
);

export default {
  async fetch(request, env, ctx) {
    const context = new RouterContextProvider();
    context.set(CloudflareContext, { env, ctx });
    return requestHandler(request, context);
  },
} satisfies ExportedHandler<Env>;
```

Read it in a loader with `context.get(CloudflareContext)`. In `app/entry.server.tsx`, the fifth argument is typed `RouterContextProvider` (not `AppLoadContext`). Export Durable Objects from `workers/app.ts`. Generate binding types with `wrangler types` (also as `postinstall`), which writes `worker-configuration.d.ts`.

## Optional variants (apply only with a matching signal or user request)

| Variant | Signal in the target repo |
| --- | --- |
| Dev server port + `forwardConsole` | user wants a fixed port / browser logs in terminal |
| `optimizeDeps.include` | re-optimize + full reload on first page load |
| Workers Cache | `"cache"` in wrangler.jsonc, or user asks for edge caching |
| Hono in front of React Router | `hono` dependency, API/MCP/agent routes, email handler |
| Workers-pool Vitest | `@cloudflare/vitest-plugin` dependency |
| Playwright with stubbed module | `@playwright/test` dependency |

### Dev server

```ts
server: {
  port: 5173,
  strictPort: true,
  forwardConsole: {
    unhandledErrors: true,
    logLevels: ["log", "info", "warn", "error", "debug"],
  },
},
```

### Pre-bundling client deps

List client deps in `optimizeDeps.include` so the first page load doesn't trigger a re-optimize (e.g. `react`, `react-dom/client`, `react-router`, `react-router/dom`, `@base-ui/react/*` subpaths).

### Workers Cache

Enable cache per entrypoint in wrangler.jsonc, with an uncached front entrypoint so auth still runs on a cache hit:

```jsonc
"cache": { "enabled": true },
"exports": {
  "default":   { "type": "worker", "cache": { "enabled": false } },
  "CachedApp": { "type": "worker", "cache": { "enabled": true } },
},
```

`workers/app.ts` defines `class CachedApp extends WorkerEntrypoint<Env, { auth: Auth }>` and the default `fetch` forwards through `ctx.exports.CachedApp({ props: { auth } }).fetch(request)`. Workers Cache applies heuristic TTLs otherwise, so default responses to `Cache-Control: private, no-store` and let routes opt in.

### Hono in front of React Router

```ts
const app = new Hono<{ Bindings: Env }>();
app.route("/", apiApp);
app.all("/agents/*", async (c) => (await routeAgentRequest(c.req.raw, c.env)) ?? c.text("Not found", 404));
app.all("*", (c) => {
  const context = new RouterContextProvider();
  context.set(cloudflareContext, { env: c.env, ctx: c.executionCtx as ExecutionContext });
  return requestHandler(c.req.raw, context);
});
export default { fetch: app.fetch, async email(event, env, ctx) { /* ... */ } };
```

Keep the context in its own module (`app/context.ts`) so loaders can import it without pulling the Hono app into the client bundle. Alternative: expose the Hono API as a separate `ApiWorker` entrypoint in `exports`.

### Workers-pool Vitest, inline in vite.config.ts

Swap the whole plugin list under Vitest, so the Cloudflare/React Router plugins don't fight over the `ssr` environment:

```ts
import { cloudflareTest } from "@cloudflare/vitest-plugin";

plugins: lazyPlugins(() =>
  process.env.VITEST
    ? [cloudflareTest({ wrangler: { configPath: "./wrangler.jsonc" }, main: "./app/lib/.server/service.ts" })]
    : [cloudflare({ viteEnvironment: { name: "ssr" } }), tailwindcss(), reactRouter()],
),
test: { include: ["tests/**/*.test.ts"], testTimeout: 30000, hookTimeout: 30000 },
```

`main` points at a module to test directly (a service or a Durable Object), not the React Router app. For Node-mode tests only, drop just `cloudflare()` under `process.env.VITEST`. Workers-pool tests put vite-plus on HOLD (see [vite-plus.md](vite-plus.md#vite-plus-10-hold-only-for-projects-using-the-workers-test-pool)).

### Playwright e2e with a stubbed module

Start the dev server with an env flag that swaps a server module for a fake and uses its own `cacheDir`:

```ts
export default defineConfig(({ command }) => ({
  cacheDir: process.env.TEST_MODE === "1" ? "node_modules/.vite-test" : "node_modules/.vite",
  resolve: {
    tsconfigPaths: true,
    alias:
      command === "serve" && process.env.TEST_MODE === "1"
        ? { "~/lib/.server/ai": fileURLToPath(new URL("./tests/ai.server.ts", import.meta.url)) }
        : undefined,
  },
}));
```

`playwright.config.ts` runs `webServer.command: "TEST_MODE=1 vp run dev --host 127.0.0.1 --port 5174"`, or skips the web server when `BASE_URL` is set, so the same specs run against staging.

## package.json scripts

```json
{
  "dev": "react-router dev",
  "build": "react-router build",
  "preview": "vp run build && vp preview",
  "check": "vp check",
  "typecheck": "wrangler types && react-router typegen && tsc -b",
  "test": "vp test run",
  "deploy": "vp run build && wrangler deploy",
  "cf-typegen": "wrangler types",
  "postinstall": "wrangler types",
  "prepare": "vp config"
}
```

Multiple wrangler environments: `CLOUDFLARE_ENV=staging react-router build`, then `wrangler deploy --env staging`.

## tsconfig essentials

- `tsconfig.json`: `files: []`, references to the two below, plus `verbatimModuleSyntax`, `strict`, `noEmit`, `skipLibCheck` and `paths: { "~/*": ["./app/*"] }`.
- `tsconfig.cloudflare.json`: includes `.react-router/types/**/*`, `app/**/*`, `app/**/.server/**/*`, `app/**/.client/**/*`, `workers/**/*` and `worker-configuration.d.ts`. Sets `rootDirs: [".", "./.react-router/types"]` (required for `+types` imports), `moduleResolution: "bundler"`, `jsx: "react-jsx"` and `types: ["vite/client"]`.
- `tsconfig.node.json`: `vite.config.ts` (plus `playwright.config.ts` if present) with `types: ["node"]`.

Drop `baseUrl` (TypeScript 7 removed it) and `@cloudflare/workers-types` in favor of the generated `worker-configuration.d.ts`.
