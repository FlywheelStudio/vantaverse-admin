# Getting Started Guide

This guide will help you set up and start using the Flywheel Next.js + Supabase starter template. Follow these steps to get your project running.

## 📋 Prerequisites

Before you begin, make sure you have the following installed on your system:

### Required Software

1. **Node.js (v22.x or higher)**

   ```bash
   # Check your Node.js version
   node --version
   # Should output: v22.x.x or higher
   ```

   If you don't have Node.js 22, download it from [nodejs.org](https://nodejs.org/) or use a version manager like [nvm](https://github.com/nvm-sh/nvm):

   ```bash
   # Install Node.js 22 using nvm
   nvm install 22
   nvm use 22
   ```

2. **pnpm (v10.x or higher)**

   ```bash
   # Check your pnpm version
   pnpm --version
   # Should output: 10.x.x or higher

   # Install pnpm globally if you don't have it
   npm install -g pnpm@10
   ```

3. **Git**

   ```bash
   # Check your Git version
   git --version
   ```

   Download from [git-scm.com](https://git-scm.com/) if needed.

4. **A Supabase Account**
   - Sign up for free at [supabase.com](https://supabase.com)
   - No credit card required

### Recommended Tools

- **VS Code**: [Download](https://code.visualstudio.com/)
- **VS Code Extensions**:
  - ESLint
  - Prettier
  - Tailwind CSS IntelliSense
  - TypeScript and JavaScript Language Features

## 🚀 Step 1: Clone the Repository

You have two options:

### Option A: Use This Template (Recommended)

If you're starting a new project:

1. Go to the repository on GitHub
2. Click the **"Use this template"** button
3. Create a new repository with your desired name
4. Clone your new repository:

```bash
git clone https://github.com/YOUR_USERNAME/your-project-name.git
cd your-project-name
```

### Option B: Clone Directly

If you want to explore the starter first:

```bash
git clone https://github.com/flywheel-studio/nextjs-supabase-starter.git
cd nextjs-supabase-starter
```

## 📦 Step 2: Install Dependencies

Navigate to your project directory and install the dependencies:

```bash
cd your-project-name
pnpm install
```

This will:

- Install all required npm packages
- Set up the project according to `package.json`
- Create a `node_modules` directory

**Expected output:**

```
Packages: +XXX
+++++++++++++++++++++++++++++++++++++++++++++
Progress: resolved XXX, reused XXX, downloaded 0, added XXX, done
```

## 🔑 Step 3: Set Up Supabase

### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Sign in or create an account
3. Click **"New Project"**
4. Fill in the details:
   - **Name**: Your project name
   - **Database Password**: Strong password (save this!)
   - **Region**: Choose the closest to your users
   - **Pricing Plan**: Free (sufficient for development)
5. Click **"Create new project"**
6. Wait 2-3 minutes for the project to be provisioned

### Get Your API Credentials

Once your project is ready:

1. In the Supabase dashboard, go to **Settings** (gear icon)
2. Click **API** in the sidebar
3. You'll see two important values:
   - **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

**Keep these safe!** You'll need them in the next step.

## ⚙️ Step 4: Configure Environment Variables

### Create Environment File

1. In your project root, create a `.env.local` file:

```bash
# Copy the example file
cp .env.example .env.local

# Or create manually
touch .env.local
```

2. Open `.env.local` and add your Supabase credentials:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Optional: Add other environment variables here
# NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Important Notes

- **Never commit `.env.local`** to version control
- The `.gitignore` file already excludes this file
- Each developer needs their own `.env.local` file
- For production, set these variables in your deployment platform

## 🏃 Step 5: Run the Development Server

Start the development server:

```bash
pnpm dev
```

You should see:

```
  ▲ Next.js 16.1.1
  - Local:        http://localhost:3000
  - Network:      http://192.168.1.x:3000

 ✓ Ready in 2.5s
```

Open your browser and navigate to [http://localhost:3000](http://localhost:3000)

**🎉 Congratulations!** Your Next.js + Supabase app is running!

## 🔧 Step 6: Set Up Git Hooks (Optional but Recommended)

Set up Husky to enforce code quality:

```bash
pnpm prepare
```

This will:

- Initialize Husky
- Set up pre-commit hooks (runs linting)
- Set up commit-msg hooks (validates commit messages)
- Set up pre-push hooks (additional validation)

Now when you commit, your code will be automatically checked!

## ✅ Step 7: Verify Your Setup

Let's make sure everything is working:

### 1. Check Linting

```bash
pnpm lint
```

Expected output: `✔ No ESLint warnings or errors`

### 2. Check Code Formatting

```bash
pnpm format:check
```

Expected output: All files are formatted correctly

### 3. Check for Unused Code

```bash
pnpm knip
```

Expected output: No unused dependencies or exports

### 4. Test Supabase Connection

Create a simple test file to verify Supabase connection:

```typescript
// src/app/test/page.tsx
import { createClient } from '@/lib/supabase/core/server';

export default async function TestPage() {
  const supabase = await createClient();

  // This will test your connection
  const { data, error } = await supabase.auth.getSession();

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold">Supabase Connection Test</h1>
      {error ? (
        <p className="text-red-500">Error: {error.message}</p>
      ) : (
        <p className="text-green-500">✓ Connected successfully!</p>
      )}
    </div>
  );
}
```

Visit [http://localhost:3000/test](http://localhost:3000/test) to see the result.

## 🎨 Step 8: Explore the Starter

### Project Structure

```
your-project/
├── src/
│   ├── app/              # Next.js pages
│   ├── components/       # React components
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utilities and Supabase
│   ├── context/         # React contexts
│   └── services/        # Business logic
├── public/              # Static assets
├── docs/               # Documentation
└── Configuration files
```

### Key Files to Explore

1. **`src/app/layout.tsx`**: Root layout with providers
2. **`src/app/page.tsx`**: Home page
3. **`src/lib/supabase/core/`**: Supabase clients
4. **`src/hooks/use-auth.ts`**: Authentication hook
5. **`src/context/auth.tsx`**: Auth context provider

### Try Making Changes

1. **Edit the Home Page**:
   - Open `src/app/page.tsx`
   - Change the text
   - See the changes instantly (hot reload)

2. **Add a New Component**:

   ```bash
   npx shadcn@latest add card
   ```

   This adds a Card component you can use!

3. **Test Theme Switching**:
   - The starter includes dark/light mode
   - Check `useTheme` hook for implementation

## 🗄️ Step 9: Set Up Your Database (Optional)

If you need database tables:

### Create a Table in Supabase

1. Go to your Supabase project
2. Click **Table Editor**
3. Click **New Table**
4. Create a simple table:
   - Name: `notes`
   - Columns:
     - `id` (int8, primary key)
     - `created_at` (timestamptz, default: now())
     - `title` (text)
     - `content` (text)
     - `user_id` (uuid, foreign key to auth.users)
5. Click **Save**

### Enable Row Level Security (RLS)

Secure your table:

1. In Table Editor, select your `notes` table
2. Click **"Enable RLS"**
3. Click **"New Policy"**
4. Create a policy:
   - **Policy name**: Users can view their own notes
   - **Policy command**: SELECT
   - **Target roles**: authenticated
   - **USING expression**: `auth.uid() = user_id`
5. Repeat for INSERT, UPDATE, DELETE as needed

### Query Your Table

```typescript
import { createClient } from '@/lib/supabase/core/server';

export async function getNotes() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

## 🚀 Step 10: Next Steps

You're all set! Here's what to do next:

### Learn the Stack

1. **Read the Documentation**:
   - [Supabase Integration](./SUPABASE.md)
   - [Custom Hooks](./HOOKS.md)
   - [UI Components](./UI_COMPONENTS.md)
   - [Git Workflow](./GIT_WORKFLOW.md)

2. **Explore Example Code**:
   - Check out the existing components
   - See how authentication works
   - Study the Supabase integration

### Start Building

1. **Create Your First Feature**:
   - Use `npx shadcn@latest add [component]` for UI
   - Create your database tables in Supabase
   - Write queries in `src/lib/supabase/queries/`

2. **Follow Best Practices**:
   - Use TypeScript for type safety
   - Follow conventional commits
   - Write clean, documented code

### Deploy Your App

When you're ready to deploy:

1. **Push to GitHub**:

   ```bash
   git add .
   git commit -m "feat: initial setup"
   git push
   ```

2. **Deploy to Vercel**:
   - Go to [vercel.com](https://vercel.com)
   - Import your GitHub repository
   - Add environment variables
   - Deploy!

See our deployment guide for more details.

## 🆘 Troubleshooting

### Port Already in Use

If port 3000 is already in use:

```bash
# Use a different port
pnpm dev -- -p 3001
```

Or kill the process using port 3000:

```bash
# On Linux/Mac
lsof -ti:3000 | xargs kill -9

# On Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Module Not Found

If you get module errors:

```bash
# Clear cache and reinstall
rm -rf node_modules
rm pnpm-lock.yaml
pnpm install
```

### Supabase Connection Issues

Check:

1. ✅ Environment variables are set correctly
2. ✅ `.env.local` file exists
3. ✅ Variables start with `NEXT_PUBLIC_`
4. ✅ No extra spaces in the values
5. ✅ Supabase project is active

### TypeScript Errors

```bash
# Restart TypeScript server in VS Code
# Press Cmd/Ctrl + Shift + P
# Type: "TypeScript: Restart TS Server"

# Or rebuild the project
pnpm dev
```

### Git Hooks Not Working

```bash
# Reinstall Husky
rm -rf .husky
pnpm prepare
```

## 📚 Additional Resources

### Official Documentation

- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [ShadCN UI](https://ui.shadcn.com)

### Video Tutorials

- [Next.js App Router Tutorial](https://www.youtube.com/watch?v=wm5gMKuwSYk)
- [Supabase Crash Course](https://www.youtube.com/watch?v=7uKQBl9uZ00)
- [TypeScript for Beginners](https://www.youtube.com/watch?v=BwuLxPH8IDs)

### Community

- [Next.js Discord](https://nextjs.org/discord)
- [Supabase Discord](https://discord.supabase.com/)
- [Flywheel Studio Community](https://discord.gg/your-invite)

## 🎉 Congratulations!

You've successfully set up your Next.js + Supabase project! Start building amazing things! 🚀

---

**Need help?** Check our [Contributing Guide](../CONTRIBUTING.md) or open an issue on GitHub.
