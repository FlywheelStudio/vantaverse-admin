# Custom Hooks Documentation

This guide covers all custom React hooks available in the starter template and how to use them effectively.

## 📋 Table of Contents

- [Overview](#overview)
- [useAuth Hook](#useauth-hook)
- [useTheme Hook](#usetheme-hook)
- [useIsMobile Hook](#useismobile-hook)
- [Creating Custom Hooks](#creating-custom-hooks)
- [Best Practices](#best-practices)

## 🎯 Overview

Custom hooks are reusable functions that encapsulate stateful logic. This starter includes three essential hooks:

| Hook | Purpose | Context Required |
|------|---------|------------------|
| `useAuth` | Authentication state and methods | `AuthProvider` |
| `useTheme` | Theme management (light/dark) | `ThemeProvider` |
| `useIsMobile` | Responsive design detection | None |

## 🔐 useAuth Hook

Provides access to authentication state and methods throughout your application.

### Location

```
src/hooks/use-auth.ts
```

### Source Code

```typescript
import { AuthContext, AuthContextType } from "@/context/auth";
import { useContext } from "react";

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within a AuthProvider");
    }
    return context;
};
```

### Return Type

```typescript
interface AuthContextType {
  user: User | null;          // Current user object
  session: Session | null;    // Current session
  isLoading: boolean;         // Loading state
  signOut: () => Promise<void>; // Sign out function
}
```

### Usage

#### Basic Usage

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';

export function ProfileComponent() {
  const { user, isLoading, signOut } = useAuth();

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <div>Please sign in</div>;
  }

  return (
    <div>
      <h1>Welcome, {user.email}</h1>
      <button onClick={signOut}>Sign Out</button>
    </div>
  );
}
```

#### Protected Component

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function ProtectedContent() {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null; // Will redirect
  }

  return (
    <div>
      <h1>Protected Content</h1>
      <p>Only authenticated users can see this</p>
    </div>
  );
}
```

#### Conditional Rendering

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';

export function Header() {
  const { user } = useAuth();

  return (
    <header>
      <nav>
        <Link href="/">Home</Link>
        {user ? (
          <>
            <Link href="/dashboard">Dashboard</Link>
            <Link href="/profile">Profile</Link>
          </>
        ) : (
          <>
            <Link href="/sign-in">Sign In</Link>
            <Link href="/sign-up">Sign Up</Link>
          </>
        )}
      </nav>
    </header>
  );
}
```

#### Access User Data

```typescript
'use client';

import { useAuth } from '@/hooks/use-auth';

export function UserInfo() {
  const { user, session } = useAuth();

  if (!user) return null;

  return (
    <div>
      <p>Email: {user.email}</p>
      <p>ID: {user.id}</p>
      <p>Created: {new Date(user.created_at).toLocaleDateString()}</p>
      
      {/* Access session data */}
      {session && (
        <p>Expires: {new Date(session.expires_at! * 1000).toLocaleDateString()}</p>
      )}
      
      {/* Access user metadata */}
      {user.user_metadata?.full_name && (
        <p>Name: {user.user_metadata.full_name}</p>
      )}
    </div>
  );
}
```

### Context Provider

The `useAuth` hook requires the `AuthProvider` wrapper:

```typescript
// app/layout.tsx
import { AuthProvider } from '@/context/auth';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
```

### Error Handling

The hook throws an error if used outside of `AuthProvider`:

```typescript
// ❌ This will throw an error
function Component() {
  const { user } = useAuth(); // Error: must be within AuthProvider
}

// ✅ This works
function App() {
  return (
    <AuthProvider>
      <Component /> {/* Now useAuth works */}
    </AuthProvider>
  );
}
```

## 🎨 useTheme Hook

Provides theme state and methods for dark/light mode switching.

### Location

```
src/hooks/use-theme.ts
```

### Source Code

```typescript
import { ThemeContext, ThemeContextType } from '@/context/theme';
import { useContext } from 'react';

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
```

### Return Type

```typescript
interface ThemeContextType {
  theme: 'light' | 'dark' | 'system';      // Current theme setting
  resolvedTheme: 'light' | 'dark' | undefined; // Actual theme applied
  setTheme: (theme: Theme) => void;        // Set theme manually
  toggleTheme: () => void;                 // Toggle between light/dark
}
```

### Usage

#### Theme Toggle Button

```typescript
'use client';

import { useTheme } from '@/hooks/use-theme';
import { Moon, Sun } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={toggleTheme}
      aria-label="Toggle theme"
    >
      {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
```

#### Theme Selector

```typescript
'use client';

import { useTheme } from '@/hooks/use-theme';

export function ThemeSelector() {
  const { theme, setTheme } = useTheme();

  return (
    <div>
      <label>Choose Theme:</label>
      <select 
        value={theme} 
        onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
      >
        <option value="light">Light</option>
        <option value="dark">Dark</option>
        <option value="system">System</option>
      </select>
    </div>
  );
}
```

#### Conditional Styling Based on Theme

```typescript
'use client';

import { useTheme } from '@/hooks/use-theme';

export function ThemedComponent() {
  const { resolvedTheme } = useTheme();

  return (
    <div className={resolvedTheme === 'dark' ? 'dark-specific-class' : 'light-specific-class'}>
      <p>Content styled based on current theme</p>
    </div>
  );
}
```

#### Display Current Theme

```typescript
'use client';

import { useTheme } from '@/hooks/use-theme';

export function ThemeInfo() {
  const { theme, resolvedTheme } = useTheme();

  return (
    <div>
      <p>Selected: {theme}</p>
      <p>Applied: {resolvedTheme}</p>
      {theme === 'system' && (
        <p>Following system preference: {resolvedTheme}</p>
      )}
    </div>
  );
}
```

### Context Provider

The `useTheme` hook requires the `ThemeProvider` wrapper:

```typescript
// app/layout.tsx
import { ThemeProvider } from '@/context/theme';

export default function RootLayout({ children }) {
  return (
    <html suppressHydrationWarning>
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
```

### Theme Provider Props

```typescript
interface ThemeProviderProps {
  attribute?: 'class' | 'data-theme';  // How theme is applied
  defaultTheme?: 'light' | 'dark' | 'system'; // Default theme
  enableSystem?: boolean;              // Allow system preference
  disableTransitionOnChange?: boolean; // Disable animation on change
}
```

## 📱 useIsMobile Hook

Detects if the user is on a mobile device based on screen width.

### Location

```
src/hooks/use-mobile.ts
```

### Source Code

```typescript
import * as React from 'react';

const MOBILE_BREAKPOINT = 768;

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    return () => mql.removeEventListener('change', onChange);
  }, []);

  return !!isMobile;
}
```

### Return Type

```typescript
boolean // true if mobile, false if desktop
```

### Usage

#### Conditional Rendering

```typescript
'use client';

import { useIsMobile } from '@/hooks/use-mobile';

export function ResponsiveComponent() {
  const isMobile = useIsMobile();

  return (
    <div>
      {isMobile ? (
        <MobileNavigation />
      ) : (
        <DesktopNavigation />
      )}
    </div>
  );
}
```

#### Different Layouts

```typescript
'use client';

import { useIsMobile } from '@/hooks/use-mobile';

export function Dashboard() {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? 'flex flex-col' : 'grid grid-cols-3 gap-4'}>
      <Sidebar />
      <MainContent />
      <RightPanel />
    </div>
  );
}
```

#### Mobile-Specific Features

```typescript
'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import { Sheet, SheetTrigger, SheetContent } from '@/components/ui/sheet';
import { Dialog, DialogTrigger, DialogContent } from '@/components/ui/dialog';

export function ResponsiveModal({ children, trigger }) {
  const isMobile = useIsMobile();

  // Use Sheet (drawer) on mobile, Dialog on desktop
  if (isMobile) {
    return (
      <Sheet>
        <SheetTrigger>{trigger}</SheetTrigger>
        <SheetContent>{children}</SheetContent>
      </Sheet>
    );
  }

  return (
    <Dialog>
      <DialogTrigger>{trigger}</DialogTrigger>
      <DialogContent>{children}</DialogContent>
    </Dialog>
  );
}
```

#### Optimize Performance

```typescript
'use client';

import { useIsMobile } from '@/hooks/use-mobile';
import dynamic from 'next/dynamic';

// Lazy load heavy components only on desktop
const HeavyChart = dynamic(() => import('./heavy-chart'), {
  ssr: false,
  loading: () => <div>Loading chart...</div>
});

export function Analytics() {
  const isMobile = useIsMobile();

  return (
    <div>
      <h1>Analytics</h1>
      {isMobile ? (
        <SimpleStats />
      ) : (
        <HeavyChart /> // Only loaded on desktop
      )}
    </div>
  );
}
```

#### Change Component Behavior

```typescript
'use client';

import { useIsMobile } from '@/hooks/use-mobile';

export function ImageGallery({ images }) {
  const isMobile = useIsMobile();

  return (
    <div className={isMobile ? 'space-y-4' : 'grid grid-cols-3 gap-4'}>
      {images.map((image) => (
        <img
          key={image.id}
          src={image.url}
          alt={image.alt}
          // Load smaller images on mobile
          sizes={isMobile ? '100vw' : '33vw'}
        />
      ))}
    </div>
  );
}
```

### Customizing the Breakpoint

If you need a different breakpoint:

```typescript
// hooks/use-mobile.ts
const MOBILE_BREAKPOINT = 640; // Tailwind's sm breakpoint

// Or make it configurable
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(
    undefined,
  );

  React.useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => {
      setIsMobile(window.innerWidth < breakpoint);
    };
    mql.addEventListener('change', onChange);
    setIsMobile(window.innerWidth < breakpoint);
    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);

  return !!isMobile;
}

// Usage
const isMobile = useIsMobile(640); // Use 640px breakpoint
```

## 🛠️ Creating Custom Hooks

### Hook Template

```typescript
// hooks/use-example.ts
import { useState, useEffect } from 'react';

export function useExample(initialValue: string) {
  const [value, setValue] = useState(initialValue);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Setup
    setIsLoading(true);
    
    // Async operation
    fetchData(value).then((result) => {
      setValue(result);
      setIsLoading(false);
    });

    // Cleanup
    return () => {
      // Cleanup code here
    };
  }, [value]);

  return { value, isLoading, setValue };
}
```

### Example: useDebounce Hook

```typescript
// hooks/use-debounce.ts
import { useEffect, useState } from 'react';

export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

// Usage
function SearchComponent() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 500);

  useEffect(() => {
    // This only runs 500ms after user stops typing
    if (debouncedSearch) {
      performSearch(debouncedSearch);
    }
  }, [debouncedSearch]);

  return (
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search..."
    />
  );
}
```

### Example: useLocalStorage Hook

```typescript
// hooks/use-local-storage.ts
import { useState, useEffect } from 'react';

export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T) => void] {
  // Get from local storage then parse stored json or return initialValue
  const readValue = (): T => {
    if (typeof window === 'undefined') {
      return initialValue;
    }

    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  };

  const [storedValue, setStoredValue] = useState<T>(readValue);

  const setValue = (value: T) => {
    try {
      const newValue = value instanceof Function ? value(storedValue) : value;
      window.localStorage.setItem(key, JSON.stringify(newValue));
      setStoredValue(newValue);
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue];
}

// Usage
function SettingsComponent() {
  const [settings, setSettings] = useLocalStorage('app-settings', {
    notifications: true,
    theme: 'light'
  });

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={settings.notifications}
          onChange={(e) => 
            setSettings({ ...settings, notifications: e.target.checked })
          }
        />
        Enable notifications
      </label>
    </div>
  );
}
```

## ✅ Best Practices

### 1. Name Hooks with "use" Prefix

```typescript
// ✅ Good
export function useAuth() { }
export function useIsMobile() { }
export function useDebounce() { }

// ❌ Bad
export function getAuth() { }
export function isMobile() { }
export function debounce() { }
```

### 2. Return Objects for Multiple Values

```typescript
// ✅ Good - Easy to use and extend
export function useAuth() {
  return { user, session, isLoading, signOut };
}

const { user, signOut } = useAuth(); // Can pick what you need

// ❌ Less flexible
export function useAuth() {
  return [user, session, isLoading, signOut];
}

const [user, , , signOut] = useAuth(); // Must match order
```

### 3. Handle Cleanup

```typescript
export function useSubscription(channel: string) {
  useEffect(() => {
    const subscription = subscribe(channel);

    // Always cleanup
    return () => {
      subscription.unsubscribe();
    };
  }, [channel]);
}
```

### 4. Type Your Hooks

```typescript
// ✅ Good - Fully typed
export function useData<T>(url: string): {
  data: T | null;
  error: Error | null;
  isLoading: boolean;
} {
  // Implementation
}

// Usage with type inference
const { data } = useData<User>('/api/user');
// data is typed as User | null
```

### 5. Document Your Hooks

```typescript
/**
 * Debounces a value by a specified delay
 * 
 * @param value - The value to debounce
 * @param delay - Delay in milliseconds (default: 500)
 * @returns The debounced value
 * 
 * @example
 * const debouncedSearch = useDebounce(searchTerm, 500);
 */
export function useDebounce<T>(value: T, delay = 500): T {
  // Implementation
}
```

### 6. Handle Server-Side Rendering

```typescript
export function useWindowSize() {
  const [size, setSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    // Only run on client
    if (typeof window === 'undefined') return;

    const handleResize = () => {
      setSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return size;
}
```

## 📚 Additional Resources

- [React Hooks Documentation](https://react.dev/reference/react)
- [Rules of Hooks](https://react.dev/reference/rules/rules-of-hooks)
- [Custom Hooks Guide](https://react.dev/learn/reusing-logic-with-custom-hooks)

---

**Next**: [UI Components →](./UI_COMPONENTS.md)

