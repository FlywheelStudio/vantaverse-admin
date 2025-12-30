# Architecture Guide

This document explains the architecture, design patterns, and structure of the Flywheel Next.js + Supabase starter template.

## 📐 Architecture Overview

This starter follows a **modern, scalable architecture** designed for maintainability and developer experience. It implements:

- **Clean Architecture** principles for separation of concerns
- **Feature-based organization** for scalability
- **Type-safe data flow** using TypeScript
- **Server-first approach** with Next.js App Router
- **Progressive enhancement** for optimal performance

## 🏗️ Project Structure

### High-Level Organization

```
nextjs-supabase/
├── src/                    # Application source code
│   ├── app/               # Next.js App Router (UI layer)
│   ├── components/        # React components (Presentation layer)
│   ├── hooks/            # Custom React hooks (Logic layer)
│   ├── lib/              # Core utilities and integrations
│   ├── context/          # State management (Context API)
│   └── services/         # Business logic (Service layer)
├── public/               # Static assets
├── docs/                 # Documentation
└── config files          # Configuration (TS, ESLint, etc.)
```

### Layer Architecture

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │
│  (app/, components/, context/, hooks/)  │
├─────────────────────────────────────────┤
│            Business Logic               │
│            (services/)                  │
├─────────────────────────────────────────┤
│          Data Access Layer              │
│      (lib/supabase/queries/)           │
├─────────────────────────────────────────┤
│           External Services             │
│     (Supabase, APIs, Storage)          │
└─────────────────────────────────────────┘
```

## 📂 Detailed Structure

### `/src/app` - Next.js App Router

The App Router handles routing and page rendering using the Next.js 16 conventions.

```
app/
├── layout.tsx            # Root layout (providers, metadata)
├── page.tsx             # Home page (/)
├── globals.css          # Global styles and Tailwind directives
├── loading.tsx          # Loading UI (optional)
├── error.tsx            # Error boundary (optional)
└── [feature]/           # Feature-based routes
    ├── page.tsx        # Feature page
    ├── layout.tsx      # Feature layout (optional)
    └── loading.tsx     # Feature loading state
```

**Key Concepts:**

- **Server Components** by default (optimal performance)
- **Client Components** marked with `'use client'`
- **Layouts** for shared UI across routes
- **Loading** and **Error** boundaries for better UX

**Example: Root Layout**

```typescript
// app/layout.tsx
import { AuthProvider } from '@/context/auth';
import { ThemeProvider } from '@/context/theme';
import './globals.css';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
        >
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### `/src/components` - React Components

Organized by purpose for better maintainability.

```
components/
├── ui/                  # ShadCN UI components
│   ├── button.tsx      # Base UI components
│   ├── card.tsx
│   ├── dialog.tsx
│   └── ...
├── common/             # Shared application components
│   ├── header.tsx
│   ├── footer.tsx
│   └── navigation.tsx
└── [feature]/          # Feature-specific components
    ├── feature-card.tsx
    └── feature-list.tsx
```

**Design Principles:**

1. **Single Responsibility**: Each component does one thing well
2. **Composition**: Build complex UIs from simple components
3. **Type Safety**: All props are typed with TypeScript
4. **Accessibility**: Use semantic HTML and ARIA attributes

**Example: Component Structure**

```typescript
// components/common/header.tsx
interface HeaderProps {
  title: string;
  showNav?: boolean;
}

export function Header({ title, showNav = true }: HeaderProps) {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between">
        <h1 className="text-xl font-bold">{title}</h1>
        {showNav && <Navigation />}
      </div>
    </header>
  );
}
```

### `/src/hooks` - Custom React Hooks

Reusable stateful logic extracted from components.

```
hooks/
├── use-auth.ts          # Authentication hook
├── use-mobile.ts        # Mobile detection
├── use-theme.ts         # Theme management
└── [feature]/           # Feature-specific hooks
    └── use-feature.ts
```

**Hook Patterns:**

1. **State Management**: Encapsulate complex state
2. **Side Effects**: Handle subscriptions and cleanup
3. **Computed Values**: Derive data from state
4. **Context Consumption**: Simplify context usage

**Example: Authentication Hook**

```typescript
// hooks/use-auth.ts
import { AuthContext } from '@/context/auth';
import { useContext } from 'react';

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

// Usage in components
function Profile() {
  const { user, signOut } = useAuth();
  // Component logic
}
```

### `/src/context` - React Context

Global state management using Context API.

```
context/
├── auth.tsx            # Authentication state
└── theme.tsx           # Theme state
```

**Context Pattern:**

```typescript
// 1. Define types
interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signOut: () => Promise<void>;
}

// 2. Create context
const AuthContext = createContext<AuthContextType>(defaultValue);

// 3. Create provider
export function AuthProvider({ children }: Props) {
  const [user, setUser] = useState<User | null>(null);
  // Provider logic
  return (
    <AuthContext.Provider value={{ user, ... }}>
      {children}
    </AuthContext.Provider>
  );
}

// 4. Export context for hooks
export { AuthContext };
export type { AuthContextType };
```

### `/src/lib` - Core Libraries

Core utilities, configurations, and integrations.

```
lib/
├── supabase/           # Supabase integration
│   ├── core/          # Client implementations
│   │   ├── client.ts  # Browser client
│   │   ├── server.ts  # Server client
│   │   └── anonymous.ts # Public client
│   ├── queries/       # Database queries
│   ├── schemas/       # Data validation schemas
│   ├── realtimes/     # Real-time subscriptions
│   ├── query.ts       # Query builder
│   ├── realtime.ts    # Realtime utilities
│   └── storage.ts     # Storage utilities
└── utils.ts           # Common utilities
```

**Supabase Client Architecture:**

```
┌─────────────────────────────────────┐
│         Application Code            │
└─────────────────┬───────────────────┘
                  │
    ┌─────────────┼─────────────┐
    │             │             │
    ▼             ▼             ▼
┌────────┐  ┌──────────┐  ┌───────────┐
│ Client │  │  Server  │  │ Anonymous │
│ (CSR)  │  │  (SSR)   │  │  (Static) │
└────┬───┘  └────┬─────┘  └─────┬─────┘
     │           │              │
     └───────────┼──────────────┘
                 │
                 ▼
         ┌──────────────┐
         │   Supabase   │
         │   Backend    │
         └──────────────┘
```

### `/src/services` - Business Logic

Service layer for business logic and data operations.

```
services/
├── auth.service.ts      # Authentication logic
├── user.service.ts      # User management
└── [feature]/          # Feature services
    └── feature.service.ts
```

**Service Pattern:**

```typescript
// services/user.service.ts
import { createClient } from '@/lib/supabase/core/server';

export class UserService {
  /**
   * Get user profile by ID
   */
  static async getProfile(userId: string) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }
  
  /**
   * Update user profile
   */
  static async updateProfile(userId: string, updates: ProfileUpdates) {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    return data;
  }
}
```

## 🔄 Data Flow

### Server-Side Rendering (SSR)

```
User Request
    ↓
Next.js Server
    ↓
Create Server Client (/lib/supabase/core/server.ts)
    ↓
Fetch Data from Supabase
    ↓
Render Server Component
    ↓
HTML Response to Client
```

**Example:**

```typescript
// app/dashboard/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/core/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  
  // Data fetched on server, rendered as HTML
  return <div>Welcome, {user?.email}</div>;
}
```

### Client-Side Rendering (CSR)

```
Component Mount
    ↓
Use Client Hook/Context
    ↓
Browser Client (/lib/supabase/core/client.ts)
    ↓
Fetch Data from Supabase
    ↓
Update Component State
    ↓
Re-render UI
```

**Example:**

```typescript
// components/profile.tsx (Client Component)
'use client';

import { useAuth } from '@/hooks/use-auth';

export function Profile() {
  const { user, isLoading } = useAuth();
  
  if (isLoading) return <Spinner />;
  return <div>{user?.email}</div>;
}
```

### Real-time Updates

```
Component Subscribe
    ↓
Real-time Channel
    ↓
Supabase Realtime
    ↓
Database Change
    ↓
Callback Function
    ↓
Update Component State
    ↓
Re-render UI
```

**Example:**

```typescript
'use client';

import { supabase } from '@/lib/supabase/core/client';
import { useEffect, useState } from 'react';

export function RealtimeNotes() {
  const [notes, setNotes] = useState([]);
  
  useEffect(() => {
    // Subscribe to changes
    const channel = supabase
      .channel('notes-channel')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notes'
      }, (payload) => {
        // Handle real-time update
        if (payload.eventType === 'INSERT') {
          setNotes(prev => [...prev, payload.new]);
        }
      })
      .subscribe();
    
    // Cleanup
    return () => {
      channel.unsubscribe();
    };
  }, []);
  
  return <NotesList notes={notes} />;
}
```

## 🎨 Design Patterns

### 1. Component Composition

Build complex UIs from simple, reusable components.

```typescript
// Bad: Monolithic component
function UserDashboard() {
  return (
    <div>
      {/* 300 lines of mixed concerns */}
    </div>
  );
}

// Good: Composed components
function UserDashboard() {
  return (
    <DashboardLayout>
      <DashboardHeader />
      <DashboardStats />
      <DashboardContent />
    </DashboardLayout>
  );
}
```

### 2. Provider Pattern

Share state across the component tree.

```typescript
// Root layout wraps app with providers
<ThemeProvider>
  <AuthProvider>
    <App />
  </AuthProvider>
</ThemeProvider>

// Deep components access via hooks
function DeepComponent() {
  const { user } = useAuth();
  const { theme } = useTheme();
  // Use shared state
}
```

### 3. Custom Hooks Pattern

Extract and reuse stateful logic.

```typescript
// Hook encapsulates logic
function useUserData(userId: string) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchUser(userId).then(setUser).finally(() => setLoading(false));
  }, [userId]);
  
  return { user, loading };
}

// Multiple components can reuse
function ComponentA() {
  const { user, loading } = useUserData('123');
  // ...
}
```

### 4. Service Layer Pattern

Centralize business logic and data operations.

```typescript
// Service handles complexity
export class NoteService {
  static async createNote(data: CreateNoteInput) {
    // Validation
    const validated = noteSchema.parse(data);
    
    // Business logic
    const supabase = await createClient();
    const { data: note, error } = await supabase
      .from('notes')
      .insert(validated)
      .select()
      .single();
    
    if (error) throw new Error(error.message);
    
    // Post-processing
    await this.notifySubscribers(note);
    
    return note;
  }
}

// Components stay simple
async function handleCreate(data: FormData) {
  const note = await NoteService.createNote(data);
  // Handle success
}
```

### 5. Error Boundary Pattern

Gracefully handle errors in component tree.

```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div>
      <h2>Something went wrong!</h2>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
```

## 🔐 Authentication Architecture

### Auth Flow

```
1. User visits app
   ↓
2. AuthProvider initializes
   ↓
3. Check for session (server-side)
   ↓
4. Listen for auth changes (client-side)
   ↓
5. Update context state
   ↓
6. Components react to auth state
```

### Implementation

```typescript
// 1. Server-side auth check
// app/protected/page.tsx
import { createClient } from '@/lib/supabase/core/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    redirect('/login');
  }
  
  return <ProtectedContent />;
}

// 2. Client-side auth state
// components/profile.tsx
'use client';

import { useAuth } from '@/hooks/use-auth';

export function Profile() {
  const { user, session, signOut } = useAuth();
  
  return (
    <div>
      <p>{user?.email}</p>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

## 📊 State Management

### Local State (useState)

For component-specific state:

```typescript
function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### Context State

For app-wide state:

```typescript
// Shared across entire app
<AuthProvider>
  <ComponentA /> {/* Can access auth */}
  <ComponentB /> {/* Can access auth */}
</AuthProvider>
```

### Server State (Supabase)

For database data:

```typescript
// Server Component: Fetch once on server
async function Page() {
  const data = await fetchData();
  return <List data={data} />;
}

// Client Component: Fetch and update on client
function ClientPage() {
  const [data, setData] = useState([]);
  
  useEffect(() => {
    fetchData().then(setData);
  }, []);
  
  return <List data={data} />;
}
```

## 🚀 Performance Optimizations

### 1. Server Components by Default

Leverage Next.js 16 server components for:
- Zero JavaScript bundle size
- Direct database access
- Better SEO
- Faster initial page load

### 2. Code Splitting

Automatic code splitting per route:

```typescript
// Dynamically import heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('./heavy-chart'), {
  loading: () => <Spinner />,
  ssr: false // Disable SSR for this component
});
```

### 3. Image Optimization

Use Next.js Image component:

```typescript
import Image from 'next/image';

<Image
  src="/hero.jpg"
  alt="Hero"
  width={1200}
  height={600}
  priority // Load immediately for above-fold images
/>
```

### 4. Font Optimization

Next.js automatically optimizes fonts:

```typescript
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

export default function RootLayout({ children }) {
  return (
    <html className={inter.className}>
      <body>{children}</body>
    </html>
  );
}
```

## 🧩 Extensibility

### Adding New Features

1. **Create feature directory**:
   ```
   src/
   ├── app/my-feature/           # Routes
   ├── components/my-feature/    # Components
   ├── hooks/my-feature/         # Hooks
   └── services/my-feature/      # Services
   ```

2. **Follow the pattern**:
   - Server components for data fetching
   - Client components for interactivity
   - Hooks for reusable logic
   - Services for business logic

3. **Maintain type safety**:
   - Define TypeScript interfaces
   - Export types from feature modules
   - Use strict type checking

## 📚 Best Practices

1. **Keep Server Components**:  Use server components by default, opt into client components only when needed

2. **Co-locate Code**: Keep related code together (feature-based organization)

3. **Type Everything**: Use TypeScript for all code, no `any` types

4. **Composition Over Inheritance**: Build with small, composable components

5. **Single Source of Truth**: Centralize shared state in context or services

6. **Separation of Concerns**: UI, logic, and data layers should be distinct

7. **Error Handling**: Handle errors at appropriate levels with error boundaries

8. **Accessibility**: Use semantic HTML and ARIA attributes

## 🔍 Additional Resources

- [Next.js Architecture](https://nextjs.org/docs/app/building-your-application/routing)
- [React Patterns](https://reactpatterns.com/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

**Next**: [Supabase Integration →](./SUPABASE.md)

