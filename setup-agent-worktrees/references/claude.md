# Claude Code CLI and desktop

Official references:
- https://code.claude.com/docs/en/worktrees
- https://code.claude.com/docs/en/hooks
- https://code.claude.com/docs/en/desktop

For simple env/local-file copies, use the root `.worktreeinclude`. It uses `.gitignore` syntax and copies only matching gitignored files for Claude-created Git worktrees. Use exact selected paths, preserve existing entries, and check ignored-directory pattern behavior in current documentation. This is a file-copy mechanism, not a command hook. It cannot guarantee a consistent snapshot of a database being written.

For dependency commands or SQLite backups, use a documented lifecycle hook or an explicit repository setup command. Before generating a hook, check its current input schema and timing. A SessionStart hook may initialize the destination when the session starts; it must positively identify a separate worktree, no-op in the source checkout, and preserve local state when sessions resume. Verify it covers the user's CLI/desktop creation flow. Read the hook JSON's `cwd` for the current destination. Resolve the source from supported context or the user's configured source, validating that it is a distinct checkout of the same repository. The main worktree (always the first entry of `git worktree list --porcelain`) is a valid source; another linked worktree is not.

Where hook commands and settings come from (observed with `claude -p --worktree`; recheck against current docs):

- A session started in a worktree (`--worktree`, desktop worktree sessions) reads `.claude/settings.json` from the worktree's checkout, and `$CLAUDE_PROJECT_DIR` is the worktree. After `EnterWorktree` mid-session, `$CLAUDE_PROJECT_DIR` stays at the original project instead. Write hook commands that work either way, e.g. `node "$CLAUDE_PROJECT_DIR/scripts/setup.mjs" --hook` with the destination read from stdin `cwd`.
- New worktrees branch from `origin/<default branch>` by default (`worktree.baseRef: "fresh"`), so hooks and the helper only run natively after they are committed and pushed to that branch. Uncommitted hooks fail silently (the hook error appears only in the debug log). Say so in the delivery.
- SessionStart did not fire when a running session entered a worktree with `EnterWorktree`. `CwdChanged` exists (async, no matcher, fires on every directory change) but was not confirmed to fire on that flow; if used, the setup must be a cheap no-op on every other call. Always document a manual setup command as the fallback.

Hook-triggered setup runs repeatedly (every startup/resume, possibly every `cd`), so the wrapper must: detect a linked worktree (`git rev-parse --git-dir` differs from `--git-common-dir`); ignore other repositories (compare the common git dir with the script's own repository); record success in a marker inside the worktree's private git dir so later runs exit immediately, and leave no marker on failure so the next run retries; take a lock (e.g. `mkdir` in the git dir) against concurrent runs; and log only to stderr, since SessionStart stdout is added to Claude's context. Use a timeout long enough for dependency installation.

Copy the shared helper into the repository and invoke it only after the actual source and destination have been established. Avoid duplicate copy operations if `.worktreeinclude` already handles a selected file.

To verify native integration before committing, run `claude -p --worktree <name> --settings "$PWD/.claude/settings.json" --debug-file <log> "Reply with ok"`, copy the uncommitted helper into the new worktree, and run the same command again (reusing the name reopens the worktree), then grep the log for the hook's `SessionStart` result. Worktrees from `-p` runs stay locked: clean up with `git worktree unlock`, `git worktree remove --force` and `git branch -D worktree-<name>`, only for worktrees you created.

`WorktreeCreate` replaces default worktree creation entirely. Use it only if the user chooses custom creation; then the hook must create the worktree, perform setup, and print only its final absolute path on stdout, with diagnostics on stderr. `.worktreeinclude` is not processed in this mode. Review WorktreeRemove semantics before changing cleanup; do not add automatic destructive cleanup merely to perform setup.

Merge hooks in `.claude/settings.json` or the user's chosen local scope without changing permission rules. Copy `.claude/settings.local.json` only when selected; it may contain user-specific hooks or permissions. When reliable automation is unavailable for the chosen flow, deliver an explicit setup invocation and explain that it is manual.
