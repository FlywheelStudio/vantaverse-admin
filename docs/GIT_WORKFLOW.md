# Git Workflow Guide

Complete guide to the Git workflow, commit conventions, and automated release process used in this starter template.

## 📋 Table of Contents

- [Overview](#overview)
- [Conventional Commits](#conventional-commits)
- [Husky - Git Hooks](#husky---git-hooks)
- [Commitlint - Commit Validation](#commitlint---commit-validation)
- [Release-it - Automated Releases](#release-it---automated-releases)
- [Complete Workflow](#complete-workflow)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

This starter uses a professional Git workflow with automated validation and releases:

```
┌─────────────────────────────────────────────────────┐
│                  Developer Workflow                  │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
           ┌────────────────────────┐
           │    git add files       │
           └────────────────────────┘
                         │
                         ▼
           ┌────────────────────────┐
           │ git commit -m "..."    │
           └────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
        ┌──────────────┐  ┌──────────────┐
        │   pre-commit │  │  commit-msg  │
        │   (Husky)    │  │ (Commitlint) │
        │  Runs: lint  │  │ Validates    │
        └──────────────┘  │ format       │
                          └──────────────┘
                         │
                         ▼
           ┌────────────────────────┐
           │   Commit successful    │
           └────────────────────────┘
                         │
                         ▼
           ┌────────────────────────┐
           │      git push          │
           └────────────────────────┘
                         │
                         ▼
           ┌────────────────────────┐
           │     pre-push hook      │
           │  (additional checks)   │
           └────────────────────────┘
                         │
                         ▼
           ┌────────────────────────┐
           │   pnpm release         │
           │   (when ready)         │
           └────────────────────────┘
                         │
                ┌────────┴────────┐
                │                 │
                ▼                 ▼
        ┌──────────────┐  ┌──────────────┐
        │  Version     │  │  CHANGELOG   │
        │  bump        │  │  generated   │
        └──────────────┘  └──────────────┘
                         │
                         ▼
           ┌────────────────────────┐
           │  Git tag created       │
           │  GitHub release        │
           └────────────────────────┘
```

## 📝 Conventional Commits

### What is Conventional Commits?

A specification for adding human and machine-readable meaning to commit messages.

### Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Components

#### 1. Type (Required)

The type of change you're making:

| Type     | Description             | Version Bump  | Example                      |
| -------- | ----------------------- | ------------- | ---------------------------- |
| `feat`   | New feature             | Minor (0.X.0) | `feat: add user login`       |
| `fix`    | Bug fix                 | Patch (0.0.X) | `fix: resolve login timeout` |
| `hotfix` | Critical bug fix        | Patch (0.0.X) | `hotfix: fix payment crash`  |
| `docs`   | Documentation only      | None          | `docs: update README`        |
| `style`  | Code style (formatting) | None          | `style: format code`         |
| `chore`  | Maintenance             | None          | `chore: update deps`         |
| `test`   | Add or update tests     | None          | `test: add login tests`      |
| `ci`     | CI/CD changes           | None          | `ci: update workflow`        |

#### 2. Scope (Optional)

The area of the codebase affected:

```
feat(auth): add password reset
fix(ui): correct button alignment
docs(api): update endpoint docs
```

**Common scopes:**

- `auth` - Authentication
- `ui` - User interface
- `api` - API endpoints
- `db` - Database
- `hooks` - Custom hooks
- `components` - React components

#### 3. Subject (Required)

Brief description of the change:

**Rules:**

- Use imperative mood ("add" not "added" or "adds")
- Don't capitalize first letter
- No period at the end
- Maximum 120 characters (configured in commitlint.config.json)

```
✅ feat: add user authentication
❌ feat: Added user authentication.
❌ feat: Adds user authentication
```

#### 4. Body (Optional)

Detailed explanation of the change:

```bash
git commit -m "feat: add password reset feature

Implemented password reset functionality using email tokens.
Users can now request a password reset link via email.
Tokens expire after 1 hour for security."
```

#### 5. Footer (Optional)

Reference issues or breaking changes:

```bash
git commit -m "fix: resolve payment processing bug

The payment gateway was timing out on slow connections.
Added retry logic and increased timeout to 30 seconds.

Fixes #123
Closes #456"
```

**Breaking Changes:**

```bash
git commit -m "feat!: change authentication API

BREAKING CHANGE: The authentication API now uses JWT tokens
instead of session cookies. Update all API calls to include
the Authorization header.

Migration guide: docs/MIGRATION.md"
```

### Real-World Examples

#### Simple Feature

```bash
git commit -m "feat: add dark mode toggle"
```

#### Bug Fix with Context

```bash
git commit -m "fix(auth): resolve session timeout issue

Users were being logged out after 5 minutes of inactivity.
Increased session timeout to 30 minutes and added automatic
session refresh.

Fixes #234"
```

#### Documentation Update

```bash
git commit -m "docs: add API documentation for user endpoints"
```

#### Multiple Changes

```bash
# ❌ Bad - Don't combine unrelated changes
git commit -m "feat: add login and fix header and update docs"

# ✅ Good - Separate commits for each change
git commit -m "feat(auth): add user login functionality"
git commit -m "fix(ui): correct header alignment on mobile"
git commit -m "docs: update authentication guide"
```

### Breaking Changes

Indicate breaking changes with `!` or `BREAKING CHANGE:`:

```bash
# Method 1: Exclamation mark
git commit -m "feat!: change user API response format"

# Method 2: Footer
git commit -m "feat: update authentication system

BREAKING CHANGE: Authentication now requires OAuth2.
Update your login flow accordingly."
```

**This will:**

- Trigger a MAJOR version bump (X.0.0)
- Highlight the breaking change in changelog
- Alert developers to review the change

## 🪝 Husky - Git Hooks

### What is Husky?

Husky is a tool that makes Git hooks easy. Git hooks are scripts that run automatically when certain Git events occur.

### Installed Hooks

This starter has three hooks configured:

```
.husky/
├── commit-msg      # Validates commit messages
├── pre-commit      # Runs before commit
└── pre-push        # Runs before push
```

### 1. commit-msg Hook

**Trigger:** After you write a commit message  
**Purpose:** Validate commit message format  
**Command:** `pnpm commitlint`

```bash
# .husky/commit-msg
pnpm commitlint
```

**What it does:**

- Checks if commit message follows Conventional Commits
- Validates message length (max 120 characters)
- Ensures proper type is used

**Example:**

```bash
# ❌ This will be rejected
git commit -m "fixed bug"
# Error: type must be one of [feat, fix, docs, ...]

# ✅ This will be accepted
git commit -m "fix: resolve navigation bug"
```

### 2. pre-commit Hook

**Trigger:** Before commit is created  
**Purpose:** Ensure code quality  
**Command:** `pnpm lint`

```bash
# .husky/pre-commit
pnpm lint
```

**What it does:**

- Runs ESLint on your code
- Checks for syntax errors
- Enforces code style
- Prevents commits with linting errors

**Example:**

```bash
git commit -m "feat: add new feature"

# Running pre-commit hook...
# Linting code...
# ✅ No linting errors found
# Commit successful
```

If linting fails:

```bash
git commit -m "feat: add new feature"

# Running pre-commit hook...
# Linting code...
# ❌ Error: Unexpected console.log statement
# Commit aborted
```

**Fix and try again:**

```bash
# Remove the console.log
git add .
git commit -m "feat: add new feature"
# ✅ Success
```

### 3. pre-push Hook

**Trigger:** Before pushing to remote  
**Purpose:** Final validation  
**Command:** Additional checks can be added

```bash
# .husky/pre-push
# Add any final checks before pushing
# pnpm test (if you have tests)
# pnpm typecheck
```

### Setup Husky

Husky is set up automatically when you install dependencies:

```bash
# This runs automatically after pnpm install
pnpm prepare
```

**Manual setup** (if needed):

```bash
# Initialize Husky
pnpm prepare

# This creates:
# - .husky/_/ directory
# - All hook files
# - Enables git hooks
```

### Bypass Hooks (Not Recommended)

Sometimes you need to bypass hooks (use with caution):

```bash
# Skip all hooks
git commit --no-verify -m "fix: emergency fix"

# Or
git commit -n -m "fix: emergency fix"
```

**⚠️ Warning:** Only use this in emergencies. Bypassing hooks can lead to:

- Broken code in repository
- Inconsistent commit messages
- CI/CD failures

## ✅ Commitlint - Commit Validation

### Configuration

Located in `commitlint.config.json`:

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "header-max-length": [2, "always", 120],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "hotfix", "chore", "test", "docs", "style", "ci"]
    ]
  }
}
```

### Rules Explained

#### header-max-length

```json
"header-max-length": [2, "always", 120]
```

- **Level:** `2` (error - blocks commit)
- **Applicable:** `always`
- **Value:** `120` characters maximum

```bash
# ✅ OK (under 120 chars)
git commit -m "feat: add user authentication with email and password"

# ❌ Error (over 120 chars)
git commit -m "feat: add user authentication with email and password support including password reset and email verification functionality"
```

#### type-enum

```json
"type-enum": [2, "always", ["feat", "fix", "hotfix", ...]]
```

Only these types are allowed:

```bash
# ✅ Allowed
git commit -m "feat: ..."
git commit -m "fix: ..."
git commit -m "docs: ..."

# ❌ Not allowed
git commit -m "feature: ..."  # Use "feat" instead
git commit -m "bugfix: ..."   # Use "fix" instead
git commit -m "update: ..."   # Use "chore" instead
```

### Customizing Commitlint

Add more rules to `commitlint.config.json`:

```json
{
  "extends": ["@commitlint/config-conventional"],
  "rules": {
    "header-max-length": [2, "always", 120],
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "hotfix", "chore", "test", "docs", "style", "ci"]
    ],
    // Add custom rules
    "scope-enum": [
      2,
      "always",
      ["auth", "ui", "api", "db", "hooks", "components"]
    ],
    "subject-case": [2, "always", "lower-case"],
    "subject-empty": [2, "never"],
    "subject-full-stop": [2, "never", "."]
  }
}
```

### Test Commitlint

Test your commit messages without committing:

```bash
# Test a commit message
echo "feat: add new feature" | pnpm commitlint

# ✅ Output: No errors found

# Test an invalid message
echo "invalid commit" | pnpm commitlint

# ❌ Output: type must be one of [feat, fix, ...]
```

## 🚀 Release-it - Automated Releases

### What is Release-it?

Release-it automates the entire release process:

1. ✅ Runs pre-release checks (lint, knip)
2. ✅ Determines version bump from commits
3. ✅ Generates CHANGELOG.md
4. ✅ Updates version in package.json
5. ✅ Creates Git commit and tag
6. ✅ Pushes to repository
7. ✅ Creates GitHub release

### Configuration

Located in `.release-it.json`:

```json
{
  "plugins": {
    "@release-it/conventional-changelog": {
      "preset": "angular",
      "infile": "CHANGELOG.md"
    }
  },
  "hooks": {
    "before:release": "pnpm lint",
    "before:release:commit": "pnpm knip"
  },
  "npm": {
    "publish": false
  },
  "git": {
    "commit": true,
    "commitMessage": "chore(release): ${version}",
    "tag": true,
    "tagAnnotation": "Release ${version}",
    "push": true
  },
  "github": {
    "release": true,
    "releaseName": "${version}",
    "tokenRef": "RELEASE_GIT"
  }
}
```

### Configuration Explained

#### Conventional Changelog Plugin

```json
"@release-it/conventional-changelog": {
  "preset": "angular",
  "infile": "CHANGELOG.md"
}
```

- Generates changelog from conventional commits
- Uses Angular preset (same as Conventional Commits)
- Writes to `CHANGELOG.md` file

#### Hooks

```json
"hooks": {
  "before:release": "pnpm lint",
  "before:release:commit": "pnpm knip"
}
```

**before:release:**

- Runs `pnpm lint` before starting release
- Ensures code quality
- Release aborts if linting fails

**before:release:commit:**

- Runs `pnpm knip` before creating release commit
- Checks for unused dependencies and exports
- Helps keep codebase clean

#### NPM Configuration

```json
"npm": {
  "publish": false
}
```

- Disables npm publishing
- Useful for private projects
- Set to `true` if publishing to npm registry

#### Git Configuration

```json
"git": {
  "commit": true,
  "commitMessage": "chore(release): ${version}",
  "tag": true,
  "tagAnnotation": "Release ${version}",
  "push": true
}
```

- **commit:** Creates a release commit
- **commitMessage:** Commit message format
- **tag:** Creates a git tag (e.g., `v1.2.3`)
- **tagAnnotation:** Tag annotation message
- **push:** Pushes commit and tag to remote

#### GitHub Configuration

```json
"github": {
  "release": true,
  "releaseName": "${version}",
  "tokenRef": "RELEASE_GIT"
}
```

- **release:** Creates GitHub release
- **releaseName:** Release title on GitHub
- **tokenRef:** Environment variable with GitHub token

### Creating a Release

#### Step 1: Setup GitHub Token

Create a Personal Access Token on GitHub:

1. Go to GitHub Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Give it a name: "Release Token"
4. Select scopes:
   - ✅ `repo` (Full control of private repositories)
5. Click "Generate token"
6. Copy the token (you won't see it again!)

**Add to environment:**

```bash
# Add to your .env.local or .bashrc
export RELEASE_GIT=ghp_your_token_here

# Or add to .env.local
echo "RELEASE_GIT=ghp_your_token_here" >> .env.local
```

#### Step 2: Make Changes

Make your changes and commit them following Conventional Commits:

```bash
git add .
git commit -m "feat: add new dashboard feature"
git commit -m "fix: resolve chart rendering issue"
git commit -m "docs: update installation guide"
git push
```

#### Step 3: Create Release

```bash
pnpm release
```

**Interactive process:**

```
🚀 release-it 19.2.0

⚠  Running pre-release checks...
✔  Linting code (pnpm lint)
✔  Checking for unused code (pnpm knip)

? Select increment: (recommended: minor)
  ❯ patch (0.1.0 → 0.1.1)
    minor (0.1.0 → 0.2.0)
    major (0.1.0 → 1.0.0)

? Continue? Yes

✔  Bumped version to 0.2.0
✔  Updated CHANGELOG.md
✔  Created commit chore(release): 0.2.0
✔  Created tag v0.2.0
✔  Pushed to origin
✔  Created GitHub release

🎉 Done! Version 0.2.0 released.
```

### Automatic Version Bumping

Version bump is determined from your commits:

| Commits                        | Version Bump | Example       |
| ------------------------------ | ------------ | ------------- |
| `fix:`                         | Patch        | 1.0.0 → 1.0.1 |
| `feat:`                        | Minor        | 1.0.0 → 1.1.0 |
| `feat!:` or `BREAKING CHANGE:` | Major        | 1.0.0 → 2.0.0 |
| `docs:`, `chore:`, `style:`    | None         | 1.0.0 → 1.0.0 |

**Example:**

```bash
# Your commits since last release:
# - feat: add user dashboard
# - feat: add profile settings
# - fix: resolve login bug
# - docs: update README

# Recommended bump: Minor (0.1.0 → 0.2.0)
# Reason: New features added
```

### CHANGELOG Generation

Release-it automatically generates a changelog:

```markdown
# Changelog

## [0.2.0] - 2024-12-23

### Features

- add user dashboard
- add profile settings

### Bug Fixes

- resolve login bug

### Documentation

- update README

## [0.1.0] - 2024-12-20

### Features

- initial release
```

### Dry Run

Test the release process without making changes:

```bash
pnpm release --dry-run

# Shows what would happen without:
# - Creating commits
# - Creating tags
# - Pushing to remote
# - Creating GitHub release
```

### Non-Interactive Mode

For CI/CD pipelines:

```bash
pnpm release --ci

# Skips interactive prompts
# Uses recommended version bump
# Suitable for automated releases
```

## 🔄 Complete Workflow

### Daily Development

```bash
# 1. Create a feature branch
git checkout -b feat/user-dashboard

# 2. Make changes
# ... edit files ...

# 3. Stage changes
git add .

# 4. Commit with conventional format
git commit -m "feat(dashboard): add user statistics widget"

# (pre-commit hook runs: pnpm lint)
# (commit-msg hook runs: validates message)

# 5. Continue development
git commit -m "feat(dashboard): add activity chart"
git commit -m "fix(dashboard): correct date formatting"

# 6. Push to remote
git push origin feat/user-dashboard

# (pre-push hook runs)

# 7. Create Pull Request on GitHub
# 8. After review and merge to main...
```

### Creating a Release

```bash
# 1. Checkout main branch
git checkout main

# 2. Pull latest changes
git pull origin main

# 3. Run release script
pnpm release

# 4. Follow interactive prompts
# 5. Release is created automatically!
```

### Emergency Hotfix

```bash
# 1. Create hotfix branch from main
git checkout -b hotfix/payment-crash

# 2. Fix the critical issue
# ... fix code ...

# 3. Commit with hotfix type
git commit -m "hotfix: resolve payment processing crash

Critical fix for production bug causing payment failures.
Added null check for payment gateway response.

Fixes #urgent-123"

# 4. Push and merge immediately
git push origin hotfix/payment-crash

# 5. Create emergency release
pnpm release
# Select: patch (e.g., 1.2.3 → 1.2.4)
```

## 🔧 Troubleshooting

### Commit Rejected

**Problem:**

```bash
git commit -m "added feature"

⧗   input: added feature
✖   subject may not be empty [subject-empty]
✖   type may not be empty [type-empty]
✖   found 2 problems, 0 warnings
```

**Solution:**

Use proper conventional commit format:

```bash
git commit -m "feat: add user authentication feature"
```

### Lint Errors Block Commit

**Problem:**

```bash
git commit -m "feat: add feature"

> pnpm lint
✖ Error: Unexpected console.log statement
  src/components/Feature.tsx:10:5

⚠  pre-commit hook failed
```

**Solution:**

Fix the linting error:

```bash
# Remove console.log or use eslint-disable
git add .
git commit -m "feat: add feature"
```

### Release Token Not Found

**Problem:**

```bash
pnpm release

ERROR: GitHub token not found
```

**Solution:**

Set your GitHub token:

```bash
export RELEASE_GIT=ghp_your_token_here

# Or add to .env.local
echo "RELEASE_GIT=ghp_your_token_here" >> .env.local
```

### Hook Not Running

**Problem:**

Commits are not being validated.

**Solution:**

Reinstall Husky:

```bash
rm -rf .husky
pnpm prepare
```

### Skip Hooks (Emergency Only)

```bash
# Skip all hooks
git commit --no-verify -m "fix: emergency fix"

# Skip individual hooks
HUSKY=0 git commit -m "fix: emergency fix"
```

⚠️ **Use only in emergencies!**

## 📚 Additional Resources

- [Conventional Commits](https://www.conventionalcommits.org/)
- [Commitlint](https://commitlint.js.org/)
- [Husky](https://typicode.github.io/husky/)
- [Release-it](https://github.com/release-it/release-it)
- [Semantic Versioning](https://semver.org/)

---

**Previous**: [UI Components ←](./UI_COMPONENTS.md) | **Main**: [README](../README.md)
