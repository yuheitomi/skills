---
name: create-pr
description: Commits changes in logical chunks and creates a pull request. Use when the user asks to open a PR, push their work and create a pull request, or commit and submit changes for review.
context: fork
---

# Create a pull request

Commit the user's changes in logical chunks and open a pull request. Follow these steps:

1. Check the input for any specific instructions regarding the pull request target branch or additional context.
2. Check the current git status to see what files have been modified.
3. Analyze the changes and group them into logical commits based on:
   - File types (tests, docs, config, etc.)
   - Feature areas (by directory/module)
   - Purpose of changes
4. Create separate commits for each logical group with appropriate commit messages following conventional commit format.
5. Run typecheck or lint commands (if available in `package.json`) before committing to ensure code quality.
6. Push the changes to the remote repository.
7. Create a pull request to the target branch (use the branch from the input if provided, otherwise default to `main`).
8. The PR should include:
   - A descriptive title
   - Summary of changes
   - List of commits included

## git commit-prefixes:

- feat: "Adding new features or modifying functionality"
- fix: "Bug fixes or typo corrections"
- docs: "Adding documentation"
- style: "Formatting changes, import order adjustments, or adding comments"
- refactor: "Code refactoring without affecting functionality"
- test: "Adding or modifying tests"
- build: "Changes affecting build system or dependencies"
- ci: "Changes related to CI/CD"
- perf: "Performance improvements"
- security: "Security-related changes"
- docker: "Modifications to Dockerfile or container-related changes"
- chore: "Miscellaneous changes"
