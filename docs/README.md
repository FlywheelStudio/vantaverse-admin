# Documentation Index

Welcome to the Flywheel Next.js + Supabase Starter documentation! This guide will help you understand and use all features of this template.

## 📚 Documentation Structure

### Getting Started

Perfect for newcomers and those setting up the project for the first time.

**[→ Getting Started Guide](./GETTING_STARTED.md)**

- Prerequisites and requirements
- Installation steps
- Environment configuration
- First run and verification
- Troubleshooting common issues

### Architecture

Understand the project structure and design patterns.

**[→ Architecture Guide](./ARCHITECTURE.md)**

- Project structure explained
- Layer architecture
- Design patterns used
- Data flow
- Component organization
- Performance optimizations

### Supabase Integration

Learn how to work with Supabase database and authentication.

**[→ Supabase Guide](./SUPABASE.md)**

- Client architecture (browser, server, anonymous)
- **RPC Pattern** - Recommended approach
- Creating PostgreSQL functions
- Real-time subscriptions
- Storage utilities
- Authentication patterns
- Best practices

### Custom Hooks

Master the custom React hooks provided in the starter.

**[→ Hooks Documentation](./HOOKS.md)**

- `useAuth` - Authentication state
- `useTheme` - Dark/light mode
- `useIsMobile` - Responsive design
- Creating your own hooks
- Hook patterns and best practices

### UI Components

Explore ShadCN UI components and how to use them.

**[→ UI Components Guide](./UI_COMPONENTS.md)**

- What is ShadCN UI?
- Installed components
- Adding new components
- Component examples
- Customization guide
- Theming

### Git Workflow

Learn the professional Git workflow with automated validation.

**[→ Git Workflow Guide](./GIT_WORKFLOW.md)**

- **Conventional Commits** - Commit message format
- **Husky** - Git hooks setup
- **Commitlint** - Commit validation
- **Release-it** - Automated releases
- Creating releases
- CHANGELOG generation
- Complete workflow examples

## 🎯 Quick Navigation by Task

### I want to...

#### Get Started

- **Set up the project**: [Getting Started → Installation](./GETTING_STARTED.md#installation)
- **Configure Supabase**: [Getting Started → Set Up Supabase](./GETTING_STARTED.md#step-3-set-up-supabase)
- **Run the dev server**: [Getting Started → Run Development Server](./GETTING_STARTED.md#step-5-run-the-development-server)

#### Work with Database

- **Create database functions**: [Supabase → Database Functions](./SUPABASE.md#database-functions)
- **Call RPC functions**: [Supabase → RPC Pattern](./SUPABASE.md#best-practice-rpc-pattern)
- **Real-time updates**: [Supabase → Real-time Subscriptions](./SUPABASE.md#real-time-subscriptions)
- **Upload files**: [Supabase → Storage](./SUPABASE.md#storage)

#### Build UI

- **Add new components**: [UI Components → Adding New Components](./UI_COMPONENTS.md#adding-new-components)
- **Customize theme**: [UI Components → Customization](./UI_COMPONENTS.md#customization)
- **Component examples**: [UI Components → Component Examples](./UI_COMPONENTS.md#component-examples)

#### Manage State

- **Use authentication**: [Hooks → useAuth](./HOOKS.md#useauth-hook)
- **Theme switching**: [Hooks → useTheme](./HOOKS.md#usetheme-hook)
- **Mobile detection**: [Hooks → useIsMobile](./HOOKS.md#useismobile-hook)
- **Create custom hook**: [Hooks → Creating Custom Hooks](./HOOKS.md#creating-custom-hooks)

#### Git and Releases

- **Commit changes**: [Git Workflow → Conventional Commits](./GIT_WORKFLOW.md#conventional-commits)
- **Create a release**: [Git Workflow → Release-it](./GIT_WORKFLOW.md#release-it---automated-releases)
- **Setup git hooks**: [Git Workflow → Husky](./GIT_WORKFLOW.md#husky---git-hooks)

## 📖 Reading Order

### For Beginners

1. **[Getting Started](./GETTING_STARTED.md)** - Set up your development environment
2. **[Architecture](./ARCHITECTURE.md)** - Understand the project structure
3. **[UI Components](./UI_COMPONENTS.md)** - Learn to build interfaces
4. **[Hooks](./HOOKS.md)** - Manage state and logic
5. **[Supabase](./SUPABASE.md)** - Work with database
6. **[Git Workflow](./GIT_WORKFLOW.md)** - Professional development workflow

### For Experienced Developers

1. **[Architecture](./ARCHITECTURE.md)** - Review design patterns
2. **[Supabase](./SUPABASE.md)** - RPC pattern and best practices
3. **[Git Workflow](./GIT_WORKFLOW.md)** - Commit conventions and releases
4. **[Getting Started](./GETTING_STARTED.md)** - Quick setup reference

## 🔍 Find by Technology

### Next.js

- [Architecture → App Router](./ARCHITECTURE.md#srcapp---nextjs-app-router)
- [Architecture → Server Components](./ARCHITECTURE.md#server-side-rendering-ssr)
- [Architecture → Performance](./ARCHITECTURE.md#performance-optimizations)

### React

- [Hooks → Custom Hooks](./HOOKS.md)
- [Architecture → Component Patterns](./ARCHITECTURE.md#design-patterns)
- [UI Components → Examples](./UI_COMPONENTS.md#component-examples)

### TypeScript

- [Architecture → Type Safety](./ARCHITECTURE.md)
- [Supabase → TypeScript Types](./SUPABASE.md#typescript-types-for-rpc-functions)
- [Hooks → Typing Hooks](./HOOKS.md#best-practices)

### Supabase

- [Supabase → Complete Guide](./SUPABASE.md)
- [Supabase → RPC Pattern](./SUPABASE.md#best-practice-rpc-pattern)
- [Supabase → Real-time](./SUPABASE.md#real-time-subscriptions)

### Tailwind CSS

- [UI Components → ShadCN UI](./UI_COMPONENTS.md)
- [UI Components → Customization](./UI_COMPONENTS.md#customization)
- [Hooks → useIsMobile](./HOOKS.md#useismobile-hook)

### Git

- [Git Workflow → Complete Guide](./GIT_WORKFLOW.md)
- [Git Workflow → Conventional Commits](./GIT_WORKFLOW.md#conventional-commits)
- [Git Workflow → Releases](./GIT_WORKFLOW.md#release-it---automated-releases)

## 💡 Common Tasks

### Authentication Tasks

```typescript
// Check if user is logged in
import { useAuth } from '@/hooks/use-auth';
const { user } = useAuth();

// Get user in server component
import { createClient } from '@/lib/supabase/core/server';
const supabase = await createClient();
const {
  data: { user },
} = await supabase.auth.getUser();
```

**Learn more**: [Hooks → useAuth](./HOOKS.md#useauth-hook) | [Supabase → Authentication](./SUPABASE.md#authentication)

### Database Queries

```typescript
// RECOMMENDED: Call PostgreSQL functions via RPC
const { data } = await supabase.rpc('get_user_notes', {
  p_user_id: userId,
});

// Avoid: Direct queries (less secure, harder to maintain)
// const { data } = await supabase.from('notes').select('*')
```

**Why RPC?** Better security, performance, and maintainability.  
**Learn more**: [Supabase → RPC Pattern](./SUPABASE.md#best-practice-rpc-pattern)

### UI Components

```bash
# Add a new component
npx shadcn@latest add card
```

**Learn more**: [UI Components → Adding Components](./UI_COMPONENTS.md#adding-new-components)

### Git Commits

```bash
# Proper commit format
git commit -m "feat: add new feature"
git commit -m "fix: resolve bug"
git commit -m "docs: update documentation"
```

**Learn more**: [Git Workflow → Conventional Commits](./GIT_WORKFLOW.md#conventional-commits)

## 🆘 Getting Help

### Documentation Not Clear?

1. Check the **[Troubleshooting](./GETTING_STARTED.md#troubleshooting)** section
2. Search for your issue in the documentation
3. Check the **[Additional Resources](#additional-resources)** section

### Still Need Help?

- **GitHub Issues**: Report bugs or request features
- **GitHub Discussions**: Ask questions and share ideas
- **Discord Community**: Chat with other developers

## 📚 Additional Resources

### Official Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [ShadCN UI](https://ui.shadcn.com)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [TypeScript](https://www.typescriptlang.org/docs)

### Tutorials and Guides

- [Next.js App Router Tutorial](https://nextjs.org/learn)
- [Supabase Quickstart](https://supabase.com/docs/guides/getting-started)
- [React Hooks Guide](https://react.dev/reference/react)
- [Conventional Commits](https://www.conventionalcommits.org/)

### Community

- [Next.js Discord](https://nextjs.org/discord)
- [Supabase Discord](https://discord.supabase.com/)
- [Radix UI Community](https://www.radix-ui.com/community)

## 🚀 Ready to Start?

Begin with the **[Getting Started Guide](./GETTING_STARTED.md)** and follow the setup instructions!

---

**Need to contribute?** Check our **[Contributing Guide](../CONTRIBUTING.md)**

**Found an issue?** [Report it on GitHub](https://github.com/your-org/repo/issues)

**Have a question?** [Start a discussion](https://github.com/your-org/repo/discussions)
