# Contributing to Flywheel Starter - Next.js + Supabase

Thank you for your interest in contributing to this project! This document provides guidelines and instructions for contributing.

## 📋 Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Commit Guidelines](#commit-guidelines)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)
- [Documentation](#documentation)

## 📜 Code of Conduct

### Our Pledge

We are committed to providing a welcoming and inclusive environment for all contributors, regardless of:

- Age, body size, disability, ethnicity, gender identity and expression
- Level of experience, education, socio-economic status
- Nationality, personal appearance, race, religion
- Sexual identity and orientation

### Our Standards

**Positive behavior includes:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints and experiences
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**

- Trolling, insulting/derogatory comments, and personal or political attacks
- Public or private harassment
- Publishing others' private information without explicit permission
- Other conduct which could reasonably be considered inappropriate

## 🚀 Getting Started

### Prerequisites

Before you begin, ensure you have:

- **Node.js 22.x** or higher
- **pnpm 10.x** (recommended package manager)
- **Git** for version control
- **Supabase Account** (free tier is sufficient)
- **Code Editor** (VS Code recommended)

### Initial Setup

1. **Fork the Repository**

```bash
# Fork on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/nextjs-supabase-starter.git
cd nextjs-supabase-starter
```

2. **Add Upstream Remote**

```bash
git remote add upstream https://github.com/flywheel-studio/nextjs-supabase-starter.git
```

3. **Install Dependencies**

```bash
pnpm install
```

4. **Setup Environment**

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

5. **Setup Git Hooks**

```bash
pnpm prepare
```

6. **Verify Setup**

```bash
# Run linting
pnpm lint

# Start development server
pnpm dev
```

## 🔄 Development Workflow

### 1. Create a Branch

Always create a new branch for your work:

```bash
# Update your main branch
git checkout main
git pull upstream main

# Create a feature branch
git checkout -b feat/your-feature-name

# Or a bugfix branch
git checkout -b fix/issue-description
```

### Branch Naming Convention

- `feat/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation changes
- `chore/description` - Maintenance tasks
- `test/description` - Test additions or changes

### 2. Make Changes

- Write clean, readable code
- Follow the [Coding Standards](#coding-standards)
- Add comments for complex logic
- Update documentation if needed
- Write tests for new features

### 3. Test Your Changes

```bash
# Run linting
pnpm lint

# Check for unused code
pnpm knip

# Format code
pnpm format:write

# Test the development server
pnpm dev
```

### 4. Commit Your Changes

We use **Conventional Commits** specification. Your commits will be automatically validated.

```bash
# Stage your changes
git add .

# Commit (will trigger commit-msg hook)
git commit -m "feat: add new authentication feature"
```

See [Commit Guidelines](#commit-guidelines) for detailed commit message format.

### 5. Push and Create Pull Request

```bash
# Push to your fork
git push origin feat/your-feature-name

# Create Pull Request on GitHub
```

## 📝 Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Components

1. **Type** (required): One of the following:
   - `feat`: A new feature
   - `fix`: A bug fix
   - `hotfix`: A critical bug fix
   - `docs`: Documentation only changes
   - `style`: Code style changes (formatting, missing semicolons, etc.)
   - `chore`: Maintenance tasks (updating dependencies, etc.)
   - `test`: Adding or updating tests
   - `ci`: CI/CD configuration changes

2. **Scope** (optional): The area of the codebase affected
   - Examples: `auth`, `ui`, `hooks`, `api`, `docs`

3. **Subject** (required): Brief description
   - Use imperative mood ("add" not "added" or "adds")
   - Don't capitalize first letter
   - No period at the end
   - Maximum 120 characters

4. **Body** (optional): Detailed explanation
   - Separate from subject with blank line
   - Explain what and why, not how

5. **Footer** (optional): References to issues
   - `Closes #123`
   - `Fixes #456`
   - `BREAKING CHANGE: description`

### Examples

**Simple commit:**

```bash
git commit -m "feat: add dark mode toggle to header"
```

**With scope:**

```bash
git commit -m "fix(auth): resolve session timeout issue"
```

**With body:**

```bash
git commit -m "feat(ui): add responsive navigation menu

Implement a mobile-friendly navigation menu that collapses
into a hamburger icon on smaller screens. Uses ShadCN Sheet
component for the drawer functionality."
```

**With footer:**

```bash
git commit -m "fix(hooks): correct useAuth return type

The useAuth hook was returning incorrect types when user
was null, causing TypeScript errors in consuming components.

Fixes #123"
```

**Breaking change:**

```bash
git commit -m "feat(api)!: change authentication API structure

BREAKING CHANGE: The authentication API now uses a different
response structure. Update all API calls to use the new format."
```

### Commit Validation

Commits are automatically validated by `commitlint`. If your commit message doesn't follow the convention, it will be rejected:

```bash
# ❌ This will fail
git commit -m "fixed some bugs"
git commit -m "WIP"
git commit -m "Update README"

# ✅ This will pass
git commit -m "fix: resolve navigation bug on mobile devices"
git commit -m "docs: update README with setup instructions"
git commit -m "feat: add user profile page"
```

## 🔀 Pull Request Process

### Before Submitting

1. **Update your branch** with the latest main

```bash
git checkout main
git pull upstream main
git checkout your-branch
git rebase main
```

2. **Run all checks**

```bash
pnpm lint
pnpm format:check
pnpm knip
```

3. **Test thoroughly**
   - Test in development mode
   - Test all affected features
   - Test on different screen sizes (if UI changes)

### PR Title

Use the same format as commit messages:

```
feat: add user authentication
fix: resolve mobile navigation issue
docs: improve setup instructions
```

### PR Description

Include:

1. **What**: What changes did you make?
2. **Why**: Why did you make these changes?
3. **How**: How did you implement it?
4. **Testing**: How did you test it?
5. **Screenshots**: If UI changes, include before/after screenshots
6. **Related Issues**: Link related issues (`Closes #123`)

### PR Template

```markdown
## Description

Brief description of the changes

## Type of Change

- [ ] Bug fix (non-breaking change which fixes an issue)
- [ ] New feature (non-breaking change which adds functionality)
- [ ] Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] Documentation update

## Changes Made

- Change 1
- Change 2
- Change 3

## How Has This Been Tested?

Describe the tests you ran to verify your changes

## Screenshots (if applicable)

Before: [screenshot]
After: [screenshot]

## Related Issues

Closes #123

## Checklist

- [ ] My code follows the project's coding standards
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have tested my changes thoroughly
```

### Review Process

1. **Automatic Checks**: Wait for CI/CD checks to pass
2. **Code Review**: Maintainers will review your code
3. **Address Feedback**: Make requested changes
4. **Approval**: Once approved, your PR will be merged

### After Merge

```bash
# Update your local main branch
git checkout main
git pull upstream main

# Delete your feature branch
git branch -d feat/your-feature-name
git push origin --delete feat/your-feature-name
```

## 💻 Coding Standards

### TypeScript

- **Use TypeScript**: Never use `any` type
- **Strict Mode**: TypeScript strict mode is enabled
- **Interfaces over Types**: Prefer interfaces for object shapes
- **Export Types**: Export all public types

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  name?: string;
}

export function getUser(id: string): Promise<User> {
  // ...
}

// ❌ Avoid
function getUser(id: any): Promise<any> {
  // ...
}
```

### React Components

- **Functional Components**: Use function components with hooks
- **TypeScript Props**: Always type your props
- **Named Exports**: Prefer named exports over default exports
- **File Naming**: Use kebab-case for files, PascalCase for components

```typescript
// ✅ Good: user-profile.tsx
interface UserProfileProps {
  userId: string;
  onUpdate?: () => void;
}

export function UserProfile({ userId, onUpdate }: UserProfileProps) {
  // component logic
}

// ❌ Avoid: UserProfile.tsx
export default function UserProfile(props: any) {
  // component logic
}
```

### Hooks

- **Custom Hooks**: Start with `use` prefix
- **Dependencies**: Always specify dependencies correctly
- **Cleanup**: Return cleanup functions when needed

```typescript
// ✅ Good
export function useAuth() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const subscription = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      subscription.data.subscription.unsubscribe();
    };
  }, []);

  return { user };
}
```

### Imports

- **Absolute Imports**: Use path aliases
- **Order**: External → Internal → Local
- **Grouping**: Group related imports

```typescript
// ✅ Good
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';

import { validateEmail } from './utils';

// ❌ Avoid
import { validateEmail } from './utils';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
```

### Styling

- **Tailwind CSS**: Use Tailwind utility classes
- **Component Variants**: Use `class-variance-authority` for variants
- **Responsive**: Mobile-first approach
- **Theme Variables**: Use CSS variables for colors

```typescript
// ✅ Good
<button className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
  Click me
</button>

// ❌ Avoid inline styles
<button style={{ backgroundColor: '#000', color: '#fff' }}>
  Click me
</button>
```

### Comments

- **JSDoc**: Document public APIs
- **Inline Comments**: Explain why, not what
- **TODO Comments**: Include issue number

```typescript
/**
 * Authenticates a user with email and password
 * @param email - User's email address
 * @param password - User's password
 * @returns User object if successful
 * @throws AuthError if credentials are invalid
 */
export async function signIn(email: string, password: string): Promise<User> {
  // Use Supabase auth instead of custom implementation
  // to leverage their security features (issue #123)
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw new AuthError(error.message);
  return data.user;
}
```

## 🧪 Testing

### Manual Testing

1. **Development Server**: Test in `pnpm dev`
2. **Different Screens**: Test responsive behavior
3. **Browser Testing**: Test in Chrome, Firefox, Safari
4. **Edge Cases**: Test error states, loading states, empty states

### Areas to Test

- **Authentication**: Sign in, sign out, session persistence
- **UI Components**: All interactive elements
- **Forms**: Validation, submission, error handling
- **Navigation**: All routes work correctly
- **Responsive**: Mobile, tablet, desktop views
- **Theme**: Light and dark mode switching

## 📚 Documentation

### When to Update Documentation

Update documentation when you:

- Add new features
- Change existing functionality
- Add new components or hooks
- Modify configuration
- Change API behavior

### What to Document

- **README**: High-level feature description
- **Code Comments**: Complex logic explanation
- **Type Definitions**: Public API types
- **Examples**: Usage examples for new features

## ❓ Questions?

If you have questions:

1. **Check Documentation**: Review existing docs
2. **Search Issues**: Look for similar questions
3. **Ask in Discussions**: Open a discussion on GitHub
4. **Contact Maintainers**: Email the team

## 🙏 Thank You!

Your contributions make this project better for everyone. We appreciate your time and effort!

---

**Happy Coding! 🚀**