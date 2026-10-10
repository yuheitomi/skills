# Claude Code CLI and desktop

Official references:
- https://code.claude.com/docs/en/worktrees
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/desktop

For simple env/local-file copies, use the root `.worktreeinclude`. It uses `.gitignore` syntax and copies only matching gitignored files for Claude-created Git worktrees. Use exact selected paths, preserve existing entries, and check ignored-directory pattern behavior in current documentation. This is a file-copy mechanism, not a command hook. It cannot guarantee a consistent snapshot of a database being written.

For dependency commands or SQLite backups, use a documented lifecycle hook or an explicit repository setup command. Before generating a hook, check its current input schema and timing. A SessionStart hook may initialize the destination when the session starts; it must positively identify a separate worktree, no-op in the source checkout, and preserve local state when sessions resume. Verify it covers the user's CLI/desktop creation flow. Read the hook JSON's cwd for the current destination; `CLAUDE_PROJECT_DIR` may continue pointing at the original project when a session enters a worktree, so do not use it as the destination. Resolve the source from supported context or the user's configured source, validating that it is a distinct checkout of the same repository. Do not select an arbitrary first worktree as the source.

Do not claim SessionStart runs whenever a running session enters a worktree; verify a documented event for that flow or supply an explicit setup command. Copy the shared helper into the repository and invoke it only after the actual source and destination have been established. Avoid duplicate copy operations if `.worktreeinclude` already handles a selected file.

`WorktreeCreate` replaces default worktree creation entirely. Use it only if the user chooses custom creation; then the hook must create the worktree, perform setup, and print only its final absolute path on stdout, with diagnostics on stderr. `.worktreeinclude` is not processed in this mode. Review WorktreeRemove semantics before changing cleanup; do not add automatic destructive cleanup merely to perform setup.

Merge hooks in `.claude/settings.json` or the user's chosen local scope without changing permission rules. Copy `.claude/settings.local.json` only when selected; it may contain user-specific hooks or permissions. When reliable automation is unavailable for the chosen flow, deliver an explicit setup invocation and explain that it is manual.
