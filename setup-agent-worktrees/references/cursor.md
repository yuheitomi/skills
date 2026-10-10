# Cursor

Official reference: https://cursor.com/docs/configuration/worktrees

Inspect and merge `.cursor/worktrees.json`. Cursor supports `setup-worktree`, `setup-worktree-unix`, and `setup-worktree-windows`. Platform-specific keys take precedence over the generic key. Values may be sequential command arrays or script paths relative to `.cursor/worktrees.json`; read the current documentation before choosing a script-path wrapper.

The documented source variable is `ROOT_WORKTREE_PATH`; setup commands run in the destination worktree. Quote the variable and resolve the destination Git root. Prefer command arrays for a small invocation, or platform-specific wrapper scripts for more complex setup. Use the agreed runtime on each operating system; Unix shell commands are not Windows commands.

Pass explicit roots to the repository helper. Preserve existing commands and avoid duplicated installs or overwriting local files. Check setup output through Cursor's Worktrees Setup output panel when native integration can be exercised.
