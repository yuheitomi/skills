# Set up pnpm for React Project

Full v10 → v11 migration guide: [Migrating from v10 to v11](https://pnpm.io/11.x/migration).

## Migrating from v10 to v11 (essence)

- **Codemod first**: From the repo root, run `pnpx codemod run pnpm-v10-to-v11` (or install `codemod` globally and run `codemod run pnpm-v10-to-v11`). It mechanically moves most settings and bumps `packageManager` in `package.json`.
- **`package.json#pnpm` is gone in v11**: Workspace/project pnpm options belong in **`pnpm-workspace.yaml`** (camelCase keys), not under a `pnpm` field in `package.json`.
- **`.npmrc` is split**: v11 only reads **auth and registry** from `.npmrc`. Everything else (`hoist-pattern`, `node-linker`, `save-exact`, etc.) belongs in **`pnpm-workspace.yaml`**; per-package `.npmrc` entries may land under `packageConfigs["<project-name>"]`.
- **Build allowlist merged**: `onlyBuiltDependencies`, `neverBuiltDependencies`, `ignoredBuiltDependencies`, and `onlyBuiltDependenciesFile` collapse into a single **`allowBuilds`** map (`{ name: true | false }`).
- **Package-manager strictness**: `managePackageManagerVersions`, `packageManagerStrict`, and `packageManagerStrictVersion` become **`pmOnFail`**: `download | ignore | warn | error`.
- **Renames**: `allowNonAppliedPatches` → **`allowUnusedPatches`**; `auditConfig.ignoreCves` → **`auditConfig.ignoreGhsas`** (CVE IDs must be converted to GHSA IDs manually where needed).
- **`useNodeVersion`**: Becomes a **`devEngines.runtime`** entry on the **root `package.json`** (not workspace YAML).

**Manual follow-ups the codemod cannot do** (see [migration doc](https://pnpm.io/11.x/migration) for detail):

- Map ignored CVEs to GHSA IDs after the `auditConfig` rename.
- **Workspace subpackages**: replace **`executionEnv.nodeVersion`** (formerly under `package.json#pnpm`) with that package’s **`devEngines.runtime`**.
- **`ignorePatchFailures` removed** — failed patches always fail; fix or drop the patch.
- **`npm_config_*` env vars** are ignored — use **`pnpm_config_*`** in CI, shells, and images.
- **`pnpm link <name>`** no longer uses the global store — link by **path** (`pnpm link ./foo`).
- **`pnpm install -g`** with no args is invalid — use **`pnpm add -g <pkg>`**.
- **`pnpm server`** removed.
- Script names **`clean`**, **`setup`**, **`deploy`**, **`rebuild`** shadow built-ins — use **`pnpm pm <command>`** to force the built-in ([`pnpm pm`](https://pnpm.io/11.x/cli/pm)).

## Node version (v11)

Ask the user which Node version to pin (e.g. latest LTS such as **24.x**). Check releases: https://nodejs.org/en/blog/release/

In **pnpm v11**, declare the runtime on the **root `package.json`** via `devEngines.runtime` (replacing `useNodeVersion` in YAML). See [pnpm `package.json`](https://pnpm.io/package_json) ( **`devEngines.runtime`** section) for the full field.

```json
{
  "devEngines": {
    "runtime": {
      "name": "node",
      "version": "24.12.0",
      "onFail": "download"
    }
  }
}
```

Adjust `version` to the semver range or exact version the team wants. `onFail` is optional (`ignore` | `warn` | `error` | `download` per pnpm).

## `pnpm-workspace.yaml` (example)

Workspace-wide policies such as minimum package age stay here (camelCase in v11). Replace exclusions as needed.

```yaml
minimumReleaseAge: 1440 # 24 hours
minimumReleaseAgeExclude:
  - react
```
