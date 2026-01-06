---
description: Merge current branch into develop and delete it
---

# Merge Current Branch into Develop

1. Get the current branch name using `git branch --show-current`
2. Get branch details (commit count, last commit message) using:
   - `git log develop..HEAD --oneline` to see commits that will be merged
   - `git rev-list --count develop..HEAD` to get commit count
3. Show confirmation dialog with:
   - Current branch name
   - Number of commits to merge
   - List of commit messages (first 5, or "X more commits" if more)
   - Message: "You are about to merge [branch-name] into develop and delete this branch. This will merge [N] commit(s). Proceed?"
4. If confirmed, execute:
   - `git checkout develop`
   - `git pull origin develop` (to ensure develop is up to date)
   - `git merge [branch-name]`
   - `git push origin develop`
   - `git branch -d [branch-name]` (delete local branch)
   - `git push origin --delete [branch-name]` (delete remote branch if it exists)
5. If merge conflicts occur, inform the user and stop - they need to resolve manually
6. Report success/failure of each step
