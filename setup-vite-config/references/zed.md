# Zed project settings

Template: [`../templates/zed/settings.json`](../templates/zed/settings.json). Project settings live at `.zed/settings.json` in the repo root.

**Apply when:** the repo already has a `.zed/` directory, or the user says they use Zed. Otherwise, offer it as an option; don't create it unasked.

## What the template does

For `TypeScript` and `TSX`, it sets the language servers to:

- `typescript-ls`: the TypeScript server (TypeScript 7 native)
- `oxfmt` and `oxlint`: formatting and linting, driven by the `fmt`/`lint` blocks in `vite.config.ts`
- `tailwindcss-language-server`: class completion
- `!vtsls` and `!typescript-language-server`: disable Zed's defaults so they don't duplicate diagnostics

## Adapting it

- Drop `oxfmt` / `oxlint` if the repo doesn't use vite-plus (or oxlint/oxfmt directly).
- Drop `tailwindcss-language-server` if Tailwind isn't installed.
- If the repo is still on TypeScript 5.x (no native server), ask before switching away from `vtsls`.
- If `.zed/settings.json` already exists, merge into its `languages` key instead of overwriting, and keep unrelated settings.
- Zed's settings file allows comments and trailing commas; keep whatever style the existing file uses.
