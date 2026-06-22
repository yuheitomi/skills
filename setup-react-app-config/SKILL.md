---
name: setup-react-app-config
description: Set up configuration files for React projects (Vite-plus, Shadcn/UI)
allowed-tools:
  - Read(*)
  - Write(*)
  - WebFetch(*)
---

# Instruction

Your task is to set up and complete configurations for the project to reflect the user's preferences referring to provided instruction details and template files.

## Steps to follow

- Analyze the project structure and installed libraries and existing configuration files to determine the best way to integrate them.
- Check the existing configuration files and settings of the project to plan how to integrate configurations.
- Ask the user which configurations to apply based on your analysis.
  - pnpm
  - vite-plus (`vite.config.ts`)
  - shadcn
- When there's an existing configuration in the project (e.g., existing linter or formatter), ask the user how to handle potential conflicts or merges.

## Instruction details and template files

### Vite-plus

Use when setting up a **Vite-plus**-based environment (single `vite.config.ts` for build, lint, format, and tests).

- Refer to: `vite-plus.md`

### Shadcn/UI with Base UI

- Refer to the detail instruction: `shadcn-baseui.md`

### pnpm configuration

WARNING: Apply this only when the project uses `pnpm` as the package manager.

- Refer to the detail instruction: `pnpm.md`
