---
name: setup-agent-worktrees
description: Create or update repository worktree setup for Codex desktop, Claude Code, and Cursor. Ask which agents and interfaces to support, which ignored env files to copy, whether to snapshot local databases, and which setup commands to run.
---

# Set up agent worktrees

Configure future worktrees for the selected agents. Inspect the repository first, ask only for choices not already supplied, then implement and verify the selected setup. This skill configures repositories; it does not install agents or change global permissions.

## Inspect and choose

Read repository instructions and existing worktree documentation. Inspect agent configuration, ignore rules, dependency scripts, and database launch commands. Discover env and database filenames without printing secret values or database records. Check whether configuration is tracked, generated, or local. Retain existing hooks, actions, settings, and unrelated files.

Ask a compact set of questions, offering concrete detected paths:

- Agents and interfaces: Codex desktop, Claude Code CLI/desktop, Cursor IDE/Agents Window/CLI. Distinguish Codex desktop from CLI; do not promise desktop environment hooks for CLI.
- Env files: copy which exact files, or skip? Suggest development files; do not automatically select every `.env*` file. Explain any local-versus-remote database mode implied by the selected file without exposing credentials.
- Local databases: skip (default), independent snapshot, or initialize an empty database? For snapshots, select source paths and identify the actual engine. For initialization, agree on the existing initialization command. Never substitute a shared database or symlink for a snapshot.
- Other setup: dependency installation, optional local settings, and any requested build or initialization commands. Detect the package manager from repository instructions, manifests, and lockfiles. Ask about supported operating systems when it affects implementation.

Honor existing answers; do not ask again. Show the chosen paths and commands before applying them as a brief implementation summary. Proceed within the requested scope; additional approval is only needed for an unresolved choice or an operation requiring it. Do not include migrations, resets, service startup, or remote DB changes unless requested.

## Implement

Read only the selected adapters:

- [Codex desktop](references/codex.md)
- [Claude Code](references/claude.md)
- [Cursor](references/cursor.md)

Verify current official documentation when adapter syntax, variables, or lifecycle behavior is uncertain. Existing repository files are examples, not proof of universal support. Quote all paths and serialize JSON/TOML rather than building unsafe shell strings.

Prefer simple native configuration for simple file copying. Where commands or database snapshots need shared logic, copy `scripts/setup_worktree.py` from this skill into the target repository at `scripts/setup_worktree.py` (or an existing appropriate scripts directory). Configure adapters to invoke that repository copy with explicit absolute source and destination roots. Do not make generated hooks depend on the personal skill installation path.

The helper accepts repeatable `--env`, `--sqlite`, and `--optional-file` arguments containing exact repository-relative paths. It rejects path traversal and symlinks, preserves existing destinations, and fails for missing required files. Optional files may be absent. It copies env files with private permissions and creates SQLite snapshots through the backup API. `--dry-run` reports paths and operations without copying. It does not install dependencies, rewrite env values, or initialize databases.

Run it through an available Python runtime; use `uv run` when the repository requires uv. Do not install packages into system Python. Do not introduce a new runtime silently if the repository lacks it; explain the requirement or implement equivalent behavior with existing tools (for example, a small Node script in a JavaScript repository that needs no SQLite snapshots).

When an agent hook triggers setup, the helper alone is not enough. A repository wrapper (or the equivalent script) must also no-op in the main checkout, skip work already done, run the selected install and initialization commands, and retry after a failure. See the Claude adapter for the details.

Example invocation (replace files and roots with the user's selections):

```sh
uv run scripts/setup_worktree.py \
  --source "$SOURCE_ROOT" --destination "$WORKTREE_ROOT" \
  --env .env.local --sqlite app.db
```

Preserve local files when setup runs again. Required missing files should fail clearly; optional files should report a skip. Copy secrets as files, never embed their contents into committed configuration. Ensure selected secrets, snapshots, and temporary backup artifacts remain ignored. Merge ignore rules narrowly, retaining tracked env examples. For SQLite, do not copy `-wal` and `-shm` independently or add a live database to Claude's native include list; use a consistent snapshot. Other engines need their own supported dump/restore workflow, not this helper. Emulator state such as Wrangler/Miniflare's `.wrangler/state` spreads one app's data across several hash-named SQLite files plus blob directories (D1, R2, KV, Durable Objects); a per-file snapshot is not a consistent copy. Prefer initializing it with the project's migration command, and explain that test accounts or data then need to be recreated.

Check the runtime database URL and launch commands for isolation. An env file pointing at remote Turso or a fixed localhost port is not made isolated by copying a DB file. If needed, agree on worktree-local URLs and distinct ports; persist adjustments in the destination without altering the source or logging secrets. Do not launch a database or dev server merely to validate config.

Keep wtp or other managers optional. Update them only if requested, preserving their repository conventions. Document selected files, setup commands, required runtimes, missing-file behavior, and how to rerun setup in the repository's existing worktree documentation.

## Verify and deliver

Parse edited configuration and check the intended changes against the original. Verify the shared helper in a disposable local fixture/worktree using dummy env values and a small test database. Check paths containing spaces, reruns preserving destination edits, required versus optional missing files, and a SQLite snapshot with committed data still in WAL. Check a destination database's integrity and confirm the source remains unchanged. Never use real secret contents or production data in a fixture.

Separate helper verification from native integration: report whether each selected agent actually triggered setup. A manually executed helper does not prove the agent lifecycle works. If app integration cannot be exercised, preserve the artifacts and state that limitation.

Deliver the changed paths, selected behavior, validation results, and any required app UI step. State when native setup only takes effect after the configuration reaches the branch new worktrees are created from. Do not commit or push unless requested.
