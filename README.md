# skills

Personal [Agent Skills](https://docs.claude.com/en/docs/claude-code/skills) for Claude Code and other agents that support the `SKILL.md` format (Codex, Cursor, etc.).

## Skills

| Skill | What it does |
| --- | --- |
| [commit](commit/SKILL.md) | Splits pending changes into logical chunks and commits them with conventional commit messages. |
| [create-pr](create-pr/SKILL.md) | Commits changes in logical chunks, creates a feature branch when on `main`, pushes, and opens a pull request. |
| [gh-issue](gh-issue/SKILL.md) | Drafts a GitHub issue (bug or feature request), reviews it with you, then creates it with `gh`. |
| [setup-agent-worktrees](setup-agent-worktrees/SKILL.md) | Configures worktree setup for Codex desktop, Claude Code, and Cursor: copies selected env files, snapshots local SQLite databases, and runs setup commands. |
| [setup-vite-config](setup-vite-config/SKILL.md) | Sets up or updates `vite.config.ts` (vite-plus build, lint, format, test, pre-commit), pnpm workspace settings, and Zed settings for React projects — SPA, React Router v8, or TanStack Start on Cloudflare Workers. |

## Installation

With the [`skills`](https://github.com/vercel-labs/skills) CLI:

```sh
npx skills add yuheitomi/skills
```

Or manually, by cloning and linking the skills you want into your agent's skills directory:

```sh
git clone https://github.com/yuheitomi/skills.git
ln -s "$PWD/skills/commit" ~/.claude/skills/commit
```

## Usage

Skills trigger automatically when a request matches their description, or you can invoke one directly in Claude Code:

```
/commit
/create-pr
/setup-vite-config
```

## Requirements

- [`gh`](https://cli.github.com/) for `gh-issue` (and for opening PRs in `create-pr`)
- Python (run via [`uv`](https://docs.astral.sh/uv/) when available) for the `setup-agent-worktrees` helper script
- `pnpm` and `npm` (for version checks) for `setup-vite-config`
