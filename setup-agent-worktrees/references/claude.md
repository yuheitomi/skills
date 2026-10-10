# Claude Code (CLI and desktop)

Docs: [worktrees](https://code.claude.com/docs/en/worktrees) · [hooks](https://code.claude.com/docs/en/hooks) · [desktop](https://code.claude.com/docs/en/desktop)

## Mechanisms

- **`.worktreeinclude`** (repo root, `.gitignore` syntax): copies matching *gitignored* files into Claude-created worktrees. File copy only — no commands, no consistent DB snapshot.
- **Hooks** in `.claude/settings.json` (e.g. `SessionStart`) can run setup commands. Hook stdin JSON includes `cwd`. `SessionStart` stdout is added to Claude's context, so diagnostics belong on stderr.
- **`WorktreeCreate`** replaces worktree creation entirely: the hook must create the worktree itself and print only its absolute path on stdout; `.worktreeinclude` is not processed then. Only worth it if the user wants custom creation.

## Observed behavior (verify against current docs)

- Sessions started in a worktree (`--worktree`, desktop worktree sessions) read `.claude/settings.json` from the worktree's checkout, and `$CLAUDE_PROJECT_DIR` is the worktree. After `EnterWorktree` mid-session, `$CLAUDE_PROJECT_DIR` remains the original project — the stdin `cwd` is the reliable destination.
- `SessionStart` did not fire when a running session entered a worktree via `EnterWorktree`. `CwdChanged` exists but wasn't confirmed for that flow and fires on every directory change. A manual setup command is a sensible fallback.
- New worktrees branch from `origin/<default branch>` by default (`worktree.baseRef: "fresh"`), so uncommitted hooks don't run — and fail silently (visible only in the debug log).
- A linked worktree has `git rev-parse --git-dir` ≠ `--git-common-dir`; the main worktree is the first entry of `git worktree list --porcelain`. The git dir is a private place for per-worktree markers/locks.

## Testing native integration

`claude -p --worktree <name> --settings "$PWD/.claude/settings.json" --debug-file <log> "Reply with ok"` creates a worktree and runs hooks from the given settings; reusing the name reopens it. Uncommitted helper scripts must be copied into the worktree first. Grep the log for the hook result. Worktrees from `-p` runs stay locked — clean up yours with `git worktree unlock`, `git worktree remove --force`, `git branch -D worktree-<name>`.
