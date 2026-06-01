# skill_AddCommitPush

## Trigger

User prompts `skill_AddCommitPush.md  ` or `@skills/skill_AddCommitPush.md  ` — meaning they want to stage, commit, and push all current changes to the repo.

## What it means

Stage everything, write a professional commit message based on what actually changed, push to `origin main`. One command, done.

## Behavior

When triggered, Claude:

1. Run `git diff` and `git status` to see what changed.
2. Write a concise, professional commit message that accurately describes the latest changes (not generic — based on the actual diff).
3. Run:
   ```
   git add .
   git commit -m "<generated message>"
   git push origin main
   ```
4. Confirm success with the commit hash and message used.

## Scope

- Touches: git index, commit history, remote `origin main`
- Off-limits: no file edits, no branch creation, no rebasing

## Edge cases

- **Nothing to commit**: if `git status` is clean, tell the user — don't create an empty commit.
- **Push rejected**: report the error, do not force-push. Ask user how to proceed.
- **Untracked sensitive files** (`.env`, credentials): warn before staging, don't include them.

## Boundaries

- Do NOT `--force` push.
- Do NOT skip hooks (`--no-verify`).
- Do NOT amend previous commits.
- Do NOT create or switch branches.

## Example

User: `skill_AddCommitPush`
Claude: checks diff, writes message like `"Add twoPointers-threeSum solution with O(N²) two-pointer approach"`, stages all, commits, pushes, confirms with hash.
