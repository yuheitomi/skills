---
name: gh-issue
description: Creates a new GitHub issue in the current repository
documentation-url: https://docs.github.com/en/issues/tracking-your-work-with-issues/creating-an-issue
display-name: "Create GitHub Issue"
argument-hint: "[issue-title]"
allowed-tools: Bash(gh issue create:*), Bash(gh auth status:*), Bash(gh repo view:*), Read(*)
disable-model-invocation: true
---

## Instruction

Please help me create a new GitHub issue in this repository. Here's what I need you to do:

1. Use the command input as the issue content for the issue body.
2. Explore the codebase to gather more context about the issue.
3. Create a new issue in the current repository enhancing the issue content with additional context with an appropriate title.
4. Ask the user to review the issue content and make any necessary changes.
5. Output the created issue URL for reference.

Example usage:

```
#gh-issue "[description]"
```

## Example commit message for this command:

```
feat: Add GitHub issue creation command

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```
