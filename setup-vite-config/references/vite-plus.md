# vite-plus toolchain (shared by all templates)

**vite-plus** (`vp`) replaces the vite, vitest, oxlint and oxfmt CLIs. Build, lint, format, test and the pre-commit hook are all configured from one `vite.config.ts`. This file covers the parts that are the same for every framework; the framework references cover plugins, entry points and tests.

## Core rules

- Config imports come from `"vite-plus"` (`defineConfig`, `lazyPlugins`, `loadEnv`, `configDefaults`), never `"vite"` or `"vitest/config"`. The `vite-plus/prefer-vite-plus-imports` lint rule enforces this.
- `plugins: lazyPlugins(() => [...])` defers building the plugins, so `vp fmt`, `vp lint` and `vp check` don't have to load framework or Cloudflare plugins.
- `resolve: { tsconfigPaths: true }` is built into Vite 8. Remove `vite-tsconfig-paths` if present.
- `staged: { "*": "vp check --fix" }` is the pre-commit hook, installed by `"prepare": "vp config"` in package.json.
- Existing projects on plain Vite: run `vp migrate` first (it switches scripts to `vp` and sets up the catalog), then merge the template config.

## fmt (oxfmt)

- `printWidth: 100`, `semi: true`, `singleQuote: false`.
- `sortImports` with the template's groups. Set `internalPattern` to match the repo's path alias: `["~/"]` for `~/*`, `["@/"]` for `@/*`. Node subpath imports (`#/*`) already land in the `subpath` group and need no `internalPattern`.
- To separate a `#/*` alias from other subpath imports, use a custom group:

  ```ts
  sortImports: {
    customGroups: [{ groupName: "internal-alias", elementNamePattern: ["#/**"] }],
    groups: [
      ["builtin", "external"], { newlinesBetween: true },
      "internal-alias", { newlinesBetween: false },
      "subpath", { newlinesBetween: true },
      ["parent", "sibling", "index"], "style", "unknown",
    ],
    newlinesBetween: true,
    internalPattern: ["#/"],
  },
  ```

- `sortTailwindcss` only when Tailwind v4 is installed. Point `stylesheet` at the CSS file that has `@import "tailwindcss"` (find it; don't guess), and keep `functions: ["clsx", "cn", "cva", "tw", "twMerge"]`.
- Stricter house style option: pin every oxfmt default (`tabWidth`, `trailingComma: "all"`, `arrowParens: "always"`, `endOfLine: "lf"`, ...) plus `sortPackageJson: true`, so a toolchain upgrade can't reformat the repo. Offer this only if the user wants it.

## lint (oxlint)

- `options: { typeAware: true, typeCheck: true }` gives type-aware rules and a tsc-equivalent check inside `vp check`. This requires generated types (route types, `worker-configuration.d.ts`) to exist before `vp check` runs; see the framework reference.
- Plugins: `react`, `typescript`, `import`, `unicorn`, `oxc`, plus `vitest` only if the project has tests.
- `jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }]` with `"vite-plus/prefer-vite-plus-imports": "error"`.
- Baseline rules: `typescript/no-floating-promises` (warn), `typescript/no-deprecated` (error).
- Also worth offering: `typescript/consistent-type-imports`, `typescript/switch-exhaustiveness-check`, `react/self-closing-comp`, `no-param-reassign`.

## Ignore patterns

Share one `ignorePatterns` array between `fmt` and `lint`. Include only paths that exist or will be generated in the target repo:

- Build output (`dist`, `build`, `.output`) and `.wrangler`
- Generated code: `.react-router/**`, `src/routeTree.gen.ts`, `worker-configuration.d.ts`
- shadcn output (the `ui` alias dir from `components.json`, e.g. `src/components/ui/**`)
- `drizzle/**` (migrations) if drizzle is used
- Editor/agent dirs the repo commits, e.g. `.cursor/**`

## Where config is read from

`vp check` always uses the workspace-root `lint`/`fmt` blocks. In vite-plus 1.0, `vp lint` and `vp fmt` discover config from the working directory (`-c` overrides it).

## Large configs

If fmt/lint grows large, move it into `tooling/vite/check-config.ts` exporting `createAppCheckConfig(): Pick<UserConfig, "lint" | "fmt" | "staged">` and spread it into `defineConfig`. Lint `overrides` (type `OxlintOverride` from `"vite-plus/lint"`) can enforce layering, e.g. a `no-restricted-imports` rule that bans `#/routes/**` (or `~/routes/**`) from server-only lib code.

## pnpm-workspace.yaml (vite-plus catalog)

vite-plus ships its own Vite core. Alias `vite` to it everywhere so all plugins resolve a single copy.

```yaml
catalog:
  vite: npm:@voidzero-dev/vite-plus-core@0.3.3
  vite-plus: 0.3.3
  vitest: 4.1.11   # only with @cloudflare/vitest-plugin
overrides:
  vite@*: "catalog:"   # the `@*` keys are intentional, so `vp up` keeps catalog refs
  vitest@*: "catalog:"
peerDependencyRules:
  allowAny: [vite, vitest]
  allowedVersions:
    vite: "*"
    vitest: "*"
allowBuilds:
  esbuild: true
  sharp: true
  workerd: true             # only with Cloudflare
  "@tailwindcss/oxide": true # only with Tailwind
  lightningcss: true         # only if installed
```

- `vite-plus-core` must equal `vite-plus`.
- Add the `vitest` entries only if the project uses `@cloudflare/vitest-plugin`; the version must equal the Vitest that vite-plus bundles (`vp toolchain vitest`).
- In package.json devDependencies use `"vite": "catalog:"` and `"vite-plus": "catalog:"` (and `"vitest": "catalog:"` when needed).
- Pin pnpm with `"devEngines": { "packageManager": { "name": "pnpm", "version": "<ver>", "onFail": "download" } }`. See [pnpm.md](pnpm.md) for the rest of the pnpm setup.

## Versions and holds

Each template folder has a `versions.txt` with the versions it was verified against. Run `scripts/check-versions.sh templates/<framework>` to compare with npm latest. `DRIFT` means read the changelog before trusting the template for that package; `HOLD` means pinned on purpose.

### vite-plus 1.0: HOLD only for projects using the Workers test pool

vite-plus 1.0 (rc.1 released 2026-09-26) bundles **Vitest 5.0.1**, but `@cloudflare/vitest-plugin` 1.2.8 still requires `vitest ^4.1` ([workers-sdk#15618](https://github.com/cloudflare/workers-sdk/issues/15618), [PR #15500](https://github.com/cloudflare/workers-sdk/pull/15500)). If the target repo uses `@cloudflare/vitest-plugin`, stay on 0.3.x. Otherwise, ask the user whether to go to 1.0.

Upgrade procedure:

1. Run the migrator from the workspace root **before** bumping dependencies, so it can still detect Vitest 4:

   ```sh
   pnpm dlx --package=vite-plus@<ver> vp migrate --no-interactive
   ```

2. Run `pnpm install`, `vp fmt` (oxlint and oxfmt were bumped), `vp check`, `vp test` and `vp build`.

Result: catalog `vite: npm:@voidzero-dev/vite-plus-core@<ver>`, `vite-plus: <ver>`, `vitest: 5.0.1`. Node `^22.18 || ^24.11 || >=26` is required, and `vp staged` needs Git 2.32+. The migrator inserts `// Vitest v4 compatibility` settings (`clearMocks: false`, `sharedViteServer: false`); tell the user to review and remove them over time.

Vitest 5 changes that matter:

- `clearMocks` defaults to `true`.
- Config files are no longer found in parent directories.
- `vi.mock` and `vi.hoisted` must be at the top level.
- Unawaited async assertions fail the test.
- Reports go to `.vitest/`; add it to `.gitignore`.
- The `vite-plus/test/{coverage,reporters,environments,snapshot,runners,suite}` subpaths are removed.
