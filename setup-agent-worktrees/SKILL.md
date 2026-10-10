---
name: setup-agent-worktrees
description: Create or update repository worktree setup for Codex desktop, Claude Code, and Cursor so new agent worktrees are ready to work in — local env files, dependencies, local databases, and other setup the project actually needs. Use when the user wants agent worktrees to start with a working environment.
---

# Set up agent worktrees

**Goal:** a worktree created by the user's coding agents should be ready to work in — dependencies installed, needed local files present, local data isolated from the main checkout — without manual steps, and without leaking secrets or disturbing the source checkout.

There is no fixed recipe. Study the project, decide what "ready" means for it, and pick the lightest mechanism that achieves it. This skill configures the repository; it does not install agents or change global permissions.

## Understand the project first

Work out how a fresh clone of this project becomes runnable: read its instructions, manifests, lockfiles, scripts, ignore rules, and any existing worktree tooling or agent configuration. Typical concerns — weigh them against what the project actually has:

- Dependencies and the toolchain/package manager the project already uses.
- Gitignored local files a checkout needs (env files, local settings) — distinguish dev files from ones pointing at shared or production resources.
- Local data: does the app use a local database or emulator state, and should a worktree get a snapshot, a freshly initialized one, or nothing?
- Isolation: a copied file is not isolated if the env still points at a remote DB, a fixed port, or a shared path.
- Existing setup (hooks, wtp/other managers, scripts) to build on rather than duplicate.

Ask the user only what you can't decide from the repo — usually which agents/interfaces they use and which secrets or data to carry over — offering the concrete options you found. Briefly state the plan before applying it.

## Constraints

- Never print, log, or commit secret values or database records. Copy secrets as files; keep them (and snapshots) gitignored.
- Don't run migrations, resets, remote DB changes, or start services unless the user asked.
- Merge into existing configuration; keep unrelated hooks, settings, and files.
- Generated config must not depend on this skill's install path — anything it needs lives in the repo.
- Don't introduce a new runtime the project doesn't already use without saying so.
- Don't commit or push unless asked.

## Things that are easy to get wrong

- **Copying a live SQLite DB file** (or its `-wal`/`-shm` separately) can produce an inconsistent copy; use a backup/snapshot. Other engines need their own dump/restore. Emulator state (e.g. Wrangler/Miniflare `.wrangler/state`) spans many files and isn't snapshot-safe — initializing via the project's migrations is usually the better answer.
- **Hook-driven setup runs repeatedly** (every session start/resume, possibly every `cd`) and may run in the main checkout or concurrently. It must be idempotent, cheap when already done, retry after failure, and never clobber local edits.
- **Native config only takes effect from the branch new worktrees are created from** — usually after it's committed and pushed.
- **Running a helper by hand doesn't prove the agent triggers it.** Report helper tests and native integration separately.
- Agent docs and observed behavior drift. When syntax, variables, or lifecycle timing matter, check the official docs linked in the references.

## References

Read only the ones for the agents in scope. They hold mechanisms, doc links, and observed caveats — not steps to follow.

- [Claude Code](references/claude.md)
- [Codex desktop](references/codex.md)
- [Cursor](references/cursor.md)

[scripts/setup_worktree.py](scripts/setup_worktree.py) is an optional helper (Python stdlib only) that copies selected repo-relative files into a destination checkout, takes consistent SQLite snapshots, refuses traversal/symlinks, and preserves existing destination files; see `--help`. Copy it into the repo if it fits; write something native to the project if it doesn't.

## Done means

The setup has been exercised as far as the environment allows (e.g. a disposable worktree with dummy data — never real secrets), and the user gets: what changed, what each agent will do on worktree creation, how to rerun setup manually, what was verified versus not, and any UI step or commit needed for it to take effect. Document the setup wherever the repo already documents development workflow.
