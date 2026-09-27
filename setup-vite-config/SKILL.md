---
name: setup-vite-config
description: Sets up or updates vite.config.ts (vite-plus build, lint, format, test, pre-commit), pnpm workspace settings, and Zed editor settings for React projects, including React Router v8 and TanStack Start on Cloudflare Workers. Use when the user asks to configure, migrate, or modernize a Vite/React app's toolchain, add vite-plus, oxlint/oxfmt, or align a repo with their standard config.
---

# Set up Vite config

Bring the target repo's toolchain in line with the user's baseline configs, applying only what fits the repo. The templates are complete baselines; your job is to pick the right one, strip what doesn't apply, and add optional variants only when the repo gives a reason.

## Files in this skill

| File | Use for |
| --- | --- |
| [references/vite-plus.md](references/vite-plus.md) | Shared rules for every template: fmt/lint, ignores, catalog, version holds. Always read. |
| [references/react-router.md](references/react-router.md) + [templates/react-router/](templates/react-router/) | React Router v8 framework mode (on Cloudflare Workers) |
| [references/tanstack-start.md](references/tanstack-start.md) + [templates/tanstack-start/](templates/tanstack-start/) | TanStack Start (on Cloudflare Workers) |
| [references/spa.md](references/spa.md) + [templates/spa/](templates/spa/) | Plain Vite + React SPA |
| [references/pnpm.md](references/pnpm.md) | pnpm v11 settings, Node version pin, v10 → v11 migration |
| [references/zed.md](references/zed.md) + [templates/zed/settings.json](templates/zed/settings.json) | Zed `.zed/settings.json` |
| [scripts/check-versions.sh](scripts/check-versions.sh) | `scripts/check-versions.sh templates/<framework>` compares a template's verified versions with npm latest |

## Steps

### 1. Inspect the target repo

Read `package.json`, the lockfile, `vite.config.*`, `tsconfig*.json`, `wrangler.*`, `pnpm-workspace.yaml`, `.npmrc`, `components.json`, and any `.zed/`, `.eslintrc*`/`eslint.config.*`, `.prettierrc*`, `biome.json`, `vitest.config.*`, `playwright.config.*`. Record:

- **Framework:** `@react-router/dev` → react-router; `@tanstack/react-start` → tanstack-start; otherwise `@vitejs/plugin-react` → spa. None of these → stop and ask; this skill targets React + Vite.
- **Deployment:** Cloudflare Workers if `wrangler.*` or `@cloudflare/vite-plugin` exists. If not, drop all Cloudflare parts from the template.
- **Toolchain:** vite-plus already installed? Plain Vite + Vitest? ESLint / Prettier / Biome in use?
- **Versions:** framework major (React Router 7 vs 8), TypeScript major, vite-plus version, pnpm major.
- **Features:** Tailwind v4 (and which CSS file imports it), shadcn (`components.json` `ui` alias dir), path alias (`~/`, `@/`, `#/`), tests (Vitest, `@cloudflare/vitest-plugin`, Playwright), drizzle, Hono, Durable Objects.
- **Editor:** a `.zed/` directory.

### 2. Plan the changes

Start from the matching template and decide each block against the repo:

- Remove plugins, ignore patterns, `sortTailwindcss`, the `vitest` lint plugin and `test:` blocks for things the repo doesn't have.
- Set `internalPattern`, `sortTailwindcss.stylesheet` and ignore paths from what you found, not from the template defaults.
- For each optional variant in the framework reference, check its signal table. Include a variant only when its signal is present; list the others as offers.
- Check versions with `scripts/check-versions.sh`. Respect `HOLD` entries (notably: vite-plus stays on 0.3.x while `@cloudflare/vitest-plugin` is used).
- Merge, don't overwrite: keep existing custom plugins, `define`, `server`, `build` and alias settings unless they conflict with the baseline.

### 3. Confirm with the user

Present a short plan grouped by area (vite.config.ts, pnpm, package.json scripts, tsconfig, Zed) and ask which to apply. Ask explicitly before:

- Replacing ESLint / Prettier / Biome with oxlint / oxfmt (and deleting their configs and deps)
- Framework or major upgrades (React Router 7 → 8, TypeScript 7, vite-plus 1.0, pnpm 11)
- Changing the path alias convention or file-based routing setup
- Creating `.zed/settings.json` when no `.zed/` exists
- Experimental variants (RSC)

If the choice is obvious and low-risk (e.g. updating ignore patterns in an existing vite-plus config), just do it and mention it.

### 4. Apply

- Existing plain Vite repo: run `vp migrate` first, then merge the template config.
- Write `vite.config.ts`, then the related files the plan covers: `pnpm-workspace.yaml` catalog ([vite-plus.md](references/vite-plus.md#pnpm-workspaceyaml-vite-plus-catalog)), pnpm settings ([pnpm.md](references/pnpm.md), only if the repo uses pnpm), package.json scripts and tsconfig (framework reference), `.zed/settings.json` ([zed.md](references/zed.md)).
- Drop the template's header comment ("Baseline ... Last verified") from the target file; keep the inline comments that explain non-obvious settings.
- Use `pnpm` unless the repo uses another package manager.

### 5. Verify

Run, in order, and fix what fails:

1. `pnpm install`
2. Type generation if applicable (`wrangler types`, `react-router typegen`), since `typeCheck: true` needs it
3. `vp check` (use `vp check --fix` once for formatting churn, and tell the user it reformatted files)
4. `vp build`, and `vp test run` if tests exist

Report what was applied, what was skipped and why, the offers the user may want later, and any failures you couldn't resolve with their output.
