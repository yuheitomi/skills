# Cursor

Docs: [worktrees](https://cursor.com/docs/configuration/worktrees)

## Mechanisms

- **`.cursor/worktrees.json`** with `setup-worktree`, `setup-worktree-unix`, `setup-worktree-windows`. Platform-specific keys take precedence over the generic one.
- Values are either sequential command arrays or a script path relative to `.cursor/worktrees.json` (check current docs for script-path semantics).
- Commands run in the new worktree; `ROOT_WORKTREE_PATH` points at the source checkout.
- Unix and Windows keys need commands native to each platform.
- Setup output appears in Cursor's "Worktrees Setup" output panel — the place to confirm it ran.
