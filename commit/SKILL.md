---
name: commit
description: Commits changes in logical chunks with proper commit messages
argument-hint: "[target-branch]"
allowed-tools: Bash(git add:*), Bash(git status:*), Bash(git commit:*), Bash(git log:*), Bash(git diff:*), Bash(git ls-files:*)
disable-model-invocation: true
---

Please help me commit my changes. Here's what I need you to do:

1. First, check the current git status to see what files have been modified
2. Check the current branch name before committing
3. If the current branch is `main` or `master`, warn the user before committing and ask whether to proceed
4. Analyze the changes and group them into logical commits when necessary, based on:
   - File types (tests, docs, config, etc.)
   - Feature areas (by directory/module)
   - Purpose of changes
5. If the commit chunks are clear and low-risk, proceed without asking the user to confirm the chunks
6. Ask the user to confirm the proposed chunks before committing when:
   - The changes include unrelated kinds of work
   - The intended grouping is uncertain
   - A change looks risky, surprising, or outside the expected scope
7. Create separate commits for each logical group with appropriate commit messages following conventional commit format
8. Run typecheck or lint commands (if available in package.json) before committing to ensure code quality
9. If '$ARGUMENTS' is provided, use it as the target branch name (otherwise default to 'main')

## git commit-prefixes:

- feat: "Adding new features or modifying functionality"
- fix: "Bug fixes or typo corrections"
- docs: "Adding documentation"
- style: "Formatting changes, import order adjustments, or adding comments"
- refactor: "Code refactoring without affecting functionality"
- test: "Adding or modifying tests"
- build: "Changes affecting build system or dependencies"
- ci: "Changes related to CI/CD"
- security: "Security-related changes"
- docker: "Modifications to Dockerfile or container-related changes"
- chore: "Miscellaneous changes"
