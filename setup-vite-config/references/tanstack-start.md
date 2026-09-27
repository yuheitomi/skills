# TanStack Start on Cloudflare Workers

Template: [`../templates/tanstack-start/vite.config.ts`](../templates/tanstack-start/vite.config.ts). Verified versions: [`../templates/tanstack-start/versions.txt`](../templates/tanstack-start/versions.txt). Shared toolchain rules: [vite-plus.md](vite-plus.md).

**Detect:** `@tanstack/react-start` in dependencies. A repo with only `@tanstack/react-router` (no Start) is an SPA: use [spa.md](spa.md) and add `tanstackRouter()` before `viteReact()` if it uses file-based routing.

## Stack

- `tanstackStart()` from `@tanstack/react-start/plugin/vite`
- `cloudflare()` from `@cloudflare/vite-plugin`, which runs dev in workerd
- `@tailwindcss/vite` (Tailwind v4, no PostCSS config)
- `@vitejs/plugin-react` v6. It is still required: Start throws in dev without React Refresh.
- Optional: `devtools()` from `@tanstack/devtools-vite`. Keep it only if the package is installed or the user wants it.

## Plugin order

This matches the official scaffolder output exactly.

```ts
plugins: lazyPlugins(() => [
  devtools(),                                        // optional; MUST be first
  cloudflare({ viteEnvironment: { name: "ssr" } }),  // run Start's "ssr" env in workerd
  tailwindcss(),
  tanstackStart(),
  viteReact(),                                       // MUST come after tanstackStart()
]),
```

- The position of `cloudflare()` and `tailwindcss()` before `tanstackStart()` doesn't matter.
- Not on Cloudflare: drop `cloudflare()` and the wrangler bits; configure the host per the TanStack hosting guide.
- Alternative to `lazyPlugins` when Node-mode Vitest is inline: `plugins: isTest ? [] : [...]`.
- `cloudflare({ ..., remoteBindings: true })` plus `"remote": true` on a binding makes local dev use the real resource. Only when the user wants that.

## Path alias and ignores

- Prefer the Node subpath import `"imports": { "#/*": "./src/*" }` in package.json with `paths: { "#/*": ["./src/*"] }` in tsconfig. Older repos use `@/*`: keep what the repo uses and set `internalPattern` accordingly.
- Ignore: `src/routeTree.gen.ts`, `worker-configuration.d.ts`, `src/components/ui/**` (shadcn), `drizzle/**`.
- `sortTailwindcss.stylesheet`: usually `./src/styles.css`.

## Scaffolding (only for new projects)

```sh
pnpm create cloudflare@latest my-app --framework=tanstack-start
# or directly (C3 wraps this):
pnpm dlx @tanstack/cli create my-app --deployment cloudflare --framework react
```

Then `vp migrate`, merge the template `vite.config.ts`, and apply the catalog from [vite-plus.md](vite-plus.md).

## Worker entry (wrangler.jsonc)

```jsonc
{
  "main": "@tanstack/react-start/server-entry",
  "compatibility_date": "<today>",
  "compatibility_flags": ["nodejs_compat"],
  "observability": { "enabled": true },
}
```

To export Durable Objects or add queue, cron or email handlers, set `"main": "src/server.ts"`:

```ts
import handler from "@tanstack/react-start/server-entry";

export { MyDurableObject } from "./durable-objects/my-do";

export default {
  fetch: handler.fetch,
  async queue(batch, env, ctx) { /* ... */ },
  async scheduled(controller, env, ctx) { /* ... */ },
} satisfies ExportedHandler<Env>;
```

If you only need `fetch`, the typed wrapper is `createServerEntry({ fetch(req) { return handler.fetch(req) } })`. Generate binding types with `vp exec wrangler types` and add `worker-configuration.d.ts` to tsconfig `include`/`types`.

## Optional variants (apply only with a matching signal or user request)

| Variant | Signal in the target repo |
| --- | --- |
| Extended import protection | `src/lib/server/**` or other server-only dirs, DB clients like `@libsql/client` |
| React Server Components | `@vitejs/plugin-rsc` dependency or `rsc: { enabled: true }` |
| Dev server port + `forwardConsole` | user wants a fixed port / browser logs in terminal |
| Workers-pool Vitest | `@cloudflare/vitest-plugin` dependency, `*.workers.test.ts` files |
| Node-mode Vitest inline | `vitest` tests with no Workers pool |
| Workers Cache, Playwright stub | see [react-router.md](react-router.md#optional-variants-apply-only-with-a-matching-signal-or-user-request); they only touch wrangler.jsonc, the entry and the Vite config, so they work the same with Start (use a custom `src/server.ts` entry for Workers Cache) |

### Server-only import protection

On by default: the client denies `**/*.server.*` and `@tanstack/react-start/server`, the server denies `**/*.client.*`, violations are mocked in dev and fail the build, and only files under `srcDirectory` are checked. Extend it for server-only directories and packages:

```ts
tanstackStart({
  importProtection: {
    ignoreImporters: ["**/*.test.ts", "**/*.test.tsx", "**/*.spec.ts", "**/*.spec.tsx"],
    client: {
      files: ["**/*.server.*", "src/lib/server/**"],
      specifiers: ["@libsql/client", "@libsql/client/web", "drizzle-orm/libsql", "cloudflare:workers"],
    },
  },
}),
```

Other options: `behavior` (`"error"` | `"mock"` | `{ dev, build }`), `server: { files, specifiers, excludeFiles }`, `include`/`exclude`, `onViolation`. Setting `excludeFiles` *replaces* its default of `["**/node_modules/**"]`.

### React Server Components (experimental)

TanStack says RSC stays experimental "into early v1". The Start + `rsc()` + `viteReact()` shape is official; the Cloudflare `childEnvironments: ["rsc"]` wiring is documented by Cloudflare for plugin-rsc, but there is no official Start + Cloudflare RSC example. Tell the user this before applying.

```ts
import crypto from "node:crypto";
import rsc from "@vitejs/plugin-rsc"; // >= 0.5.30

plugins: lazyPlugins(() => [
  cloudflare({ viteEnvironment: { name: "ssr", childEnvironments: ["rsc"] } }),
  tailwindcss(),
  tanstackStart({
    rsc: { enabled: true },
    serverFns: {
      // optional (experimental): stable, opaque server-fn IDs
      generateFunctionId: ({ filename, functionName }) =>
        crypto.createHash("sha1").update(`${filename}--${functionName}`).digest("hex"),
    },
  }),
  rsc(),        // between tanstackStart() and viteReact()
  viteReact(),
]),
```

Workarounds needed with the pnpm dependency optimizer (and `use-sync-external-store` as a direct dependency):

```ts
optimizeDeps: {
  // react-form ships "use client" modules; the client prebundle would diverge from the rsc env copy.
  exclude: ["@tanstack/react-form"],
},
ssr: {
  optimizeDeps: {
    // The SSR prebundle of react-store imports use-sync-external-store from the app root, which breaks under pnpm.
    exclude: ["@tanstack/react-store", "use-sync-external-store"],
  },
},
```

### Other `tanstackStart()` options worth knowing

`srcDirectory`, `router` (`routesDirectory`, `basepath`, `codeSplittingOptions`), `prerender: { enabled: true, crawlLinks, filter, ... }` (uses local bindings; in CI set `CLOUDFLARE_INCLUDE_PROCESS_ENV=true`), `pages[]`, `sitemap`, `spa: { enabled: true }`, `server.build.inlineCss`, `serverFns.base`.

### Dev server

```ts
server: {
  port: 3000,
  strictPort: true,
  forwardConsole: {
    unhandledErrors: true,
    logLevels: ["log", "info", "warn", "error", "debug"],
  },
},
```

Or pass `--port 3000` in the `dev` script. List client deps in `optimizeDeps.include` to avoid a re-optimize on first load.

### Testing

Convention: `*.workers.test.ts` run in the Workers pool; everything else runs in Node.

**Workers pool:** a separate `vitest.config.ts` (or `vitest.workers.config.ts`). Use `@cloudflare/vitest-plugin`'s `cloudflareTest()`; it replaced `@cloudflare/vitest-pool-workers` and `defineWorkersConfig` is gone (migrate with `npx @cloudflare/codemods vitest:pool-workers-to-vitest-plugin`). Add `"@cloudflare/vitest-plugin/types"` to the test tsconfig. **Don't** load `tanstackStart()` or `cloudflare()` here; test Durable Objects, handlers and libraries directly. `ctx.exports` can miss exports that come through virtual modules; `additionalExports` works around that. To mock outgoing requests, use `@msw/cloudflare`. This puts vite-plus on HOLD (see [vite-plus.md](vite-plus.md#vite-plus-10-hold-only-for-projects-using-the-workers-test-pool)).

```ts
import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { configDefaults, defineConfig } from "vite-plus";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    cloudflareTest({
      main: "./vitest-worker-entry.ts", // stub worker, or the real entry if tests need it
      remoteBindings: false,
      wrangler: { configPath: "./wrangler.jsonc" },
      miniflare: { kvNamespaces: ["KV"], bindings: { /* test secrets */ } },
    }),
  ],
  test: {
    include: ["src/**/*.workers.test.ts"],
    exclude: [...configDefaults.exclude],
  },
});
```

**Node mode, inline `test:` in vite.config.ts** (fast unit tests):

```ts
const isTest = process.env.VITEST === "true" || process.env.NODE_ENV === "test";
// plugins: isTest ? [] : [...]
test: {
  globals: true,
  environment: "node",
  include: ["**/*.{test,spec}.{ts,tsx}"],
  exclude: ["node_modules", "dist", "**/*.workers.test.ts"],
  alias: {
    "@libsql/client/web": "@libsql/client",
    "cloudflare:workers": new URL("./test/cloudflare-workers-stub.ts", import.meta.url).pathname,
  },
  server: {
    // Inlining React causes `module is not defined`.
    deps: { external: [/^react(?:\/.*)?$/, /^react-dom(?:\/.*)?$/], fallbackCJS: true },
  },
  env: loadEnv("test", process.cwd(), ""),
},
```

Keep only the `alias` entries for modules the repo actually uses.

## package.json scripts

```json
{
  "dev": "vp dev --port 3000",
  "build": "vp build",
  "preview": "vp preview",
  "test": "vp test run",
  "check": "vp check",
  "deploy": "vp build && vp exec wrangler deploy",
  "cf-typegen": "vp exec wrangler types",
  "postinstall": "wrangler types",
  "prepare": "vp config"
}
```

Multiple wrangler environments: `CLOUDFLARE_ENV=dev vp dev` and `CLOUDFLARE_ENV=dev vp build --mode development`.

## tsconfig essentials

`moduleResolution: "bundler"`, `allowImportingTsExtensions: true`, `verbatimModuleSyntax: true`, `noEmit: true`, `strict: true`, `jsx: "react-jsx"`, `types: ["vite-plus/client"]`, plus `worker-configuration.d.ts`.

## Code-level note

For server-function input validation, use `createServerFn().validator(...)`. `.inputValidator(...)` is deprecated, although some Cloudflare docs still show it.
