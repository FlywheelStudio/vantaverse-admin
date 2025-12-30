# Flywheel Starter - Next.js + Supabase

**English | [Español](README.es.md)**

A modern, production-ready starter template for building scalable web applications with Next.js 16, Supabase, and TypeScript. This starter provides a solid foundation with authentication, database integration, UI components, and best practices for professional development.

## 🚀 Tech Stack

### Core Framework

- **Frontend**: Next.js 16.1.1 with App Router
- **Language**: TypeScript 5.x
- **Database & Backend**: Supabase (PostgreSQL + Auth)
- **Runtime**: Node.js 22.x
- **Package Manager**: pnpm 10.x

### UI & Design System

- **Components**: ShadCN UI built on Radix UI primitives
- **Styling**: Tailwind CSS 4.x
- **Animations**: tw-animate-css for smooth transitions
- **Icons**: Lucide React
- **Themes**: Next Themes with dark/light mode support

### Development & Quality Tools

- **Linting**: ESLint with Next.js config
- **Formatting**: Prettier for consistent code style
- **Git Hooks**: Husky for pre-commit validation
- **Commits**: Commitlint with Conventional Commits
- **Dead Code**: Knip for unused dependencies detection
- **Releases**: Release-it with conventional changelog

## ✨ Key Features

### 🔐 **Authentication Ready**

- Complete Supabase Auth integration
- Server-side and client-side authentication
- Protected routes and middleware
- Session management with cookies
- Anonymous client for public data

### 🎨 **Modern UI Components**

- Pre-configured ShadCN UI components
- Dark/Light theme support
- Responsive design utilities
- Mobile detection hook
- Accessible components (Radix UI)

### 📦 **Supabase Integration**

- Multiple client configurations (client, server, anonymous)
- **RPC pattern** for database operations (recommended)
- PostgreSQL functions for business logic
- Real-time subscriptions support
- Storage utilities
- Type-safe queries and schemas

### 🛠️ **Developer Experience**

- TypeScript strict mode
- Absolute imports with path aliases
- Hot module replacement
- ESLint and Prettier configured
- Git hooks for code quality
- Automated releases with changelog

## 📁 Project Structure

```
nextjs-supabase/
├── src/                           # Source code
│   ├── app/                       # Next.js App Router
│   │   ├── layout.tsx            # Root layout with providers
│   │   ├── page.tsx              # Home page
│   │   └── globals.css           # Global styles
│   │
│   ├── components/               # React components
│   │   ├── ui/                   # ShadCN UI components
│   │   │   ├── button.tsx        # Button component
│   │   │   └── alert.tsx         # Alert component
│   │   └── common/               # Common components
│   │
│   ├── context/                  # React Context providers
│   │   ├── auth.tsx              # Authentication context
│   │   └── theme.tsx             # Theme context
│   │
│   ├── hooks/                    # Custom React hooks
│   │   ├── use-auth.ts           # Authentication hook
│   │   ├── use-mobile.ts         # Mobile detection hook
│   │   └── use-theme.ts          # Theme management hook
│   │
│   ├── lib/                      # Utility functions and configs
│   │   ├── supabase/             # Supabase client configuration
│   │   │   ├── core/             # Core client implementations
│   │   │   │   ├── client.ts     # Browser client
│   │   │   │   ├── server.ts     # Server client
│   │   │   │   └── anonymous.ts  # Anonymous client
│   │   │   ├── queries/          # Database queries
│   │   │   ├── schemas/          # Data schemas
│   │   │   ├── realtimes/        # Real-time subscriptions
│   │   │   ├── query.ts          # Query builder
│   │   │   ├── realtime.ts       # Realtime utilities
│   │   │   └── storage.ts        # Storage utilities
│   │   ├── utils.ts              # Common utilities
│   │   └── proxy.ts              # Proxy utilities
│   │
│   └── services/                 # Business logic services
│
├── public/                       # Static assets
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md          # Architecture guide
│   ├── SUPABASE.md              # Supabase integration guide
│   ├── HOOKS.md                 # Custom hooks documentation
│   ├── UI_COMPONENTS.md         # UI components guide
│   └── GIT_WORKFLOW.md          # Git workflow and releases
│
├── .husky/                       # Git hooks configuration
│   ├── commit-msg                # Commit message validation
│   ├── pre-commit                # Pre-commit linting
│   └── pre-push                  # Pre-push validation
│
└── Configuration Files           # ESLint, Prettier, TypeScript, etc.
```

## 📚 Documentation

For detailed guides and implementation details, see the [documentation directory](./docs/):

- **[Getting Started](./docs/GETTING_STARTED.md)** - Quick start guide and setup
- **[Architecture](./docs/ARCHITECTURE.md)** - Project architecture and patterns
- **[Supabase Integration](./docs/SUPABASE.md)** - Database and auth setup
- **[Custom Hooks](./docs/HOOKS.md)** - Available hooks and usage
- **[UI Components](./docs/UI_COMPONENTS.md)** - ShadCN UI components guide
- **[Git Workflow](./docs/GIT_WORKFLOW.md)** - Commits, releases, and conventions
- **[Contributing](./CONTRIBUTING.md)** - How to contribute to this project

## 🚀 Quick Start

### Prerequisites

- **Node.js**: 22.x or higher
- **pnpm**: 10.x (recommended) or npm/yarn
- **Supabase Account**: Create one at [supabase.com](https://supabase.com)
- **Git**: For version control

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/your-org/nextjs-supabase-starter.git
cd nextjs-supabase-starter

# 2. Install dependencies
pnpm install

# 3. Setup environment variables
cp .env.example .env.local

# Edit .env.local with your Supabase credentials:
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Get Your Supabase Credentials

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **Project Settings** → **API**
4. Copy your **Project URL** and **anon/public key**
5. Paste them in your `.env.local` file

### Run Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see your application.

### Setup Git Hooks

```bash
pnpm prepare
```

This will initialize Husky for git hooks (commit-msg, pre-commit, pre-push).

## 🔧 Available Scripts

```bash
# Development
pnpm dev              # Start development server (localhost:3000)
pnpm start            # Start production server

# Code Quality
pnpm lint             # Run ESLint checks
pnpm format:check     # Check code formatting
pnpm format:write     # Format code with Prettier
pnpm knip             # Find unused dependencies and exports

# Git & Release
pnpm commitlint       # Validate commit messages
pnpm release          # Create a new release with changelog
pnpm prepare          # Setup Husky git hooks
```

## 🎨 Using ShadCN UI Components

This starter comes with ShadCN UI pre-configured. Add new components:

```bash
npx shadcn@latest add [component-name]
```

Example:

```bash
# Add a card component
npx shadcn@latest add card

# Add multiple components
npx shadcn@latest add dialog sheet tabs
```

Available components: button, card, dialog, sheet, tabs, input, form, and [many more](https://ui.shadcn.com/docs/components).

## 🔐 Authentication

The starter includes a complete authentication setup using Supabase Auth:

```typescript
// Client component
import { useAuth } from '@/hooks/use-auth';

function MyComponent() {
  const { user, session, isLoading, signOut } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <div>Not authenticated</div>;

  return (
    <div>
      <p>Welcome, {user.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

See [Supabase Integration Guide](./docs/SUPABASE.md) for more details.

## 🎭 Theme Management

Toggle between light and dark themes:

```typescript
import { useTheme } from '@/hooks/use-theme';

function ThemeToggle() {
  const { theme, toggleTheme, setTheme } = useTheme();

  return (
    <button onClick={toggleTheme}>
      Current theme: {theme}
    </button>
  );
}
```

## 📱 Responsive Design

Detect mobile devices:

```typescript
import { useIsMobile } from '@/hooks/use-mobile';

function ResponsiveComponent() {
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? <MobileView /> : <DesktopView />}
    </div>
  );
}
```

## 🗄️ Database Integration

### RPC Pattern (Recommended)

**Best Practice:** Use PostgreSQL functions with RPC instead of direct queries for better security and performance.

```sql
-- Create a PostgreSQL function in Supabase SQL Editor
CREATE OR REPLACE FUNCTION get_user_notes(p_user_id uuid)
RETURNS TABLE (
  id bigint,
  title text,
  content text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT n.id, n.title, n.content, n.created_at
  FROM notes n
  WHERE n.user_id = p_user_id
  ORDER BY n.created_at DESC;
END;
$$;
```

**Call the function from TypeScript:**

```typescript
import { createClient } from '@/lib/supabase/core/server';

async function getUserNotes(userId: string) {
  const supabase = await createClient();

  // Call RPC function (recommended)
  const { data, error } = await supabase.rpc('get_user_notes', {
    p_user_id: userId,
  });

  if (error) throw error;
  return data;
}
```

**Why RPC?**

- ✅ Better security (logic stays on server)
- ✅ Better performance (complex operations run on database)
- ✅ Easier to maintain and test
- ✅ Reusable across different clients

### Real-time Subscriptions

```typescript
import { supabase } from '@/lib/supabase/core/client';

const channel = supabase
  .channel('table-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'your_table' },
    (payload) => console.log('Change received!', payload),
  )
  .subscribe();
```

**Learn more:** See [Supabase Integration Guide](./docs/SUPABASE.md) for complete RPC examples and best practices.

## 🔄 Git Workflow

This starter follows **Conventional Commits** with automated validation:

### Commit Message Format

```
type(scope): subject

body (optional)

footer (optional)
```

### Allowed Types

- `feat`: New feature
- `fix`: Bug fix
- `hotfix`: Critical bug fix
- `chore`: Maintenance task
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `test`: Adding or updating tests
- `ci`: CI/CD changes

### Examples

```bash
# Good commits
git commit -m "feat: add user authentication"
git commit -m "fix: resolve navigation issue on mobile"
git commit -m "docs: update README with setup instructions"

# Bad commits (will be rejected)
git commit -m "updated stuff"
git commit -m "WIP"
```

**Maximum length**: 120 characters

### Git Hooks

- **commit-msg**: Validates commit message format
- **pre-commit**: Runs ESLint on staged files
- **pre-push**: Runs additional validation

## 📦 Creating Releases

This starter uses `release-it` for automated releases:

```bash
# Create a new release
pnpm release

# What happens:
# 1. Runs linting (ESLint)
# 2. Runs unused code detection (Knip)
# 3. Bumps version based on commits
# 4. Generates/updates CHANGELOG.md
# 5. Creates git commit and tag
# 6. Pushes to repository
# 7. Creates GitHub release
```

### Version Bumping

The version is automatically determined from your commits:

- `feat:` → Minor version bump (0.1.0 → 0.2.0)
- `fix:` → Patch version bump (0.1.0 → 0.1.1)
- `feat!:` or `BREAKING CHANGE:` → Major version bump (0.1.0 → 1.0.0)

### GitHub Release Token

To create GitHub releases, add a personal access token:

```bash
# Add to your environment
export RELEASE_GIT=your_github_token

# Or add to .env.local
RELEASE_GIT=your_github_token
```

## 🚀 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy

### Other Platforms

This starter can be deployed to any platform that supports Next.js:

- **Netlify**: [Deploy guide](https://docs.netlify.com/integrations/frameworks/next-js/)
- **Railway**: [Deploy guide](https://docs.railway.app/guides/nextjs)
- **AWS Amplify**: [Deploy guide](https://docs.amplify.aws/nextjs/)

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](./CONTRIBUTING.md) for:

- Code of Conduct
- Development workflow
- Pull request process
- Coding standards

## 🐛 Issues and Support

- **Bug Reports**: [Open an issue](https://github.com/your-org/repo/issues)
- **Feature Requests**: [Open a discussion](https://github.com/your-org/repo/discussions)
- **Questions**: [Join our Discord](https://discord.gg/your-invite)

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](./LICENSE) file for details.

## 👥 Authors

**Flywheel Studio**  
Ender Puentes <endpuent@gmail.com>

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) - The React Framework
- [Supabase](https://supabase.com/) - Open source Firebase alternative
- [ShadCN UI](https://ui.shadcn.com/) - Beautifully designed components
- [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS framework
- [Radix UI](https://www.radix-ui.com/) - Accessible component primitives

---

**Documentation Links**  
[Next.js Docs](https://nextjs.org/docs) | [Supabase Docs](https://supabase.com/docs) | [Tailwind Docs](https://tailwindcss.com/docs) | [ShadCN UI](https://ui.shadcn.com) | [TypeScript](https://www.typescriptlang.org/docs)

**Made with ❤️ by Flywheel Studio**

**English | [Español](README.es.md)**
