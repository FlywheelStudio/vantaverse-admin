# Supabase Integration Guide

This guide explains how to use Supabase in this starter template, following best practices with **RPC (Remote Procedure Calls)** and PostgreSQL functions.

## 📋 Table of Contents

- [Overview](#overview)
- [Client Architecture](#client-architecture)
- [Best Practice: RPC Pattern](#best-practice-rpc-pattern)
- [Database Functions](#database-functions)
- [Query Builder](#query-builder)
- [Real-time Subscriptions](#real-time-subscriptions)
- [Storage](#storage)
- [Authentication](#authentication)
- [Error Handling](#error-handling)

## 🎯 Overview

This starter uses Supabase for:

- **Authentication**: JWT-based user authentication
- **Database**: PostgreSQL with Row Level Security (RLS)
- **Real-time**: WebSocket subscriptions for live updates
- **Storage**: File uploads and management
- **Edge Functions**: Serverless API endpoints (optional)

## 🏗️ Client Architecture

The starter provides three Supabase client configurations:

```
lib/supabase/core/
├── client.ts      # Browser client (CSR)
├── server.ts      # Server client (SSR)
└── anonymous.ts   # Anonymous client (Static/Public)
```

### 1. Browser Client (Client-Side Rendering)

Use in **client components** for browser-side operations.

```typescript
// lib/supabase/core/client.ts
'use client';

import { createBrowserClient } from '@supabase/ssr';

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);
```

**Usage:**

```typescript
'use client';

import { supabase } from '@/lib/supabase/core/client';
import { useEffect, useState } from 'react';

export function ClientComponent() {
  const [data, setData] = useState(null);

  useEffect(() => {
    // Call RPC function (recommended)
    supabase
      .rpc('get_user_notes')
      .then(({ data }) => setData(data));
  }, []);

  return <div>{/* render data */}</div>;
}
```

### 2. Server Client (Server-Side Rendering)

Use in **server components** and **API routes** for server-side operations.

```typescript
// lib/supabase/core/server.ts
'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            console.error('Error setting cookies');
          }
        },
      },
    },
  );
}
```

**Usage:**

```typescript
// app/dashboard/page.tsx (Server Component)
import { createClient } from '@/lib/supabase/core/server';

export default async function DashboardPage() {
  const supabase = await createClient();

  // Call RPC function (recommended)
  const { data, error } = await supabase.rpc('get_dashboard_stats');

  if (error) throw error;

  return <Dashboard stats={data} />;
}
```

### 3. Anonymous Client (Static/Public Data)

Use for **public data** access without authentication.

```typescript
// lib/supabase/core/anonymous.ts
import { createClient } from '@supabase/supabase-js';

export function createAnonymousClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
```

**Usage:**

```typescript
import { createAnonymousClient } from '@/lib/supabase/core/anonymous';

export async function getPublicPosts() {
  const supabase = createAnonymousClient();
  const { data } = await supabase.rpc('get_public_posts');
  return data;
}
```
## 🔧 Query Builder

### When to Use Direct Queries

```typescript
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(10);
```

### Query Organization

Queries need, organize them:

```
lib/supabase/queries/
├── notes.queries.ts
├── users.queries.ts
└── posts.queries.ts
```

```typescript
// lib/supabase/queries/notes.queries.ts
import { createClient } from '@/lib/supabase/core/server';

export async function getPublicNotes() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('notes')
    .select('*')
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data;
}
```

## 🔴 Real-time Subscriptions

Subscribe to database changes in real-time.

### Basic Subscription

```typescript
'use client';

import { supabase } from '@/lib/supabase/core/client';
import { useEffect, useState } from 'react';

export function RealtimeNotes() {
  const [notes, setNotes] = useState([]);

  useEffect(() => {
    // Initial fetch using RPC
    supabase.rpc('get_user_notes', { p_user_id: userId })
      .then(({ data }) => setNotes(data || []));

    // Subscribe to changes
    const channel = supabase
      .channel('notes-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notes',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Change received:', payload);

          if (payload.eventType === 'INSERT') {
            setNotes(prev => [payload.new, ...prev]);
          }

          if (payload.eventType === 'UPDATE') {
            setNotes(prev =>
              prev.map(note =>
                note.id === payload.new.id ? payload.new : note
              )
            );
          }

          if (payload.eventType === 'DELETE') {
            setNotes(prev =>
              prev.filter(note => note.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    // Cleanup
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return <NotesList notes={notes} />;
}
```

### Realtime Organization

```
lib/supabase/realtimes/
├── notes.realtime.ts
└── messages.realtime.ts
```

```typescript
// lib/supabase/realtimes/notes.realtime.ts
import { supabase } from '@/lib/supabase/core/client';

export function subscribeToNotes(
  userId: string,
  callback: (payload: any) => void,
) {
  const channel = supabase
    .channel(`notes-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${userId}`,
      },
      callback,
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
```

**Usage:**

```typescript
useEffect(() => {
  const unsubscribe = subscribeToNotes(userId, (payload) => {
    // Handle change
  });

  return unsubscribe;
}, [userId]);
```

## 📁 Storage

Upload and manage files with Supabase Storage.

### Storage Organization

```
lib/supabase/
└── storage.ts
```

```typescript
// lib/supabase/storage.ts
import { supabase } from '@/lib/supabase/core/client';

export class StorageService {
  /**
   * Upload a file to a bucket
   */
  static async uploadFile(bucket: string, path: string, file: File) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) throw error;
    return data;
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage.from(bucket).getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Delete a file
   */
  static async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage.from(bucket).remove([path]);

    if (error) throw error;
  }
}
```

**Usage:**

```typescript
// Upload avatar
const file = event.target.files[0];
const path = `avatars/${userId}/${file.name}`;

await StorageService.uploadFile('avatars', path, file);
const url = StorageService.getPublicUrl('avatars', path);
```

## 🔐 Authentication

The starter includes complete authentication setup. See `use-auth` hook for details.

### Common Auth Patterns

```typescript
import { createClient } from '@/lib/supabase/core/server';

// Check if user is authenticated (Server Component)
export async function requireAuth() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  return user;
}

// Use in protected pages
export default async function ProtectedPage() {
  const user = await requireAuth();
  return <div>Welcome, {user.email}</div>;
}
```

## ❌ Error Handling

### RPC Error Handling

```typescript
try {
  const { data, error } = await supabase.rpc('create_note', params);

  if (error) {
    // Handle Supabase error
    if (error.code === 'PGRST116') {
      throw new Error('Function not found');
    }
    throw new Error(error.message);
  }

  return data;
} catch (error) {
  // Handle application error
  console.error('Failed to create note:', error);
  throw error;
}
```

### Custom Error Types

```typescript
// lib/supabase/errors.ts
export class SupabaseError extends Error {
  constructor(
    message: string,
    public code?: string,
    public details?: any,
  ) {
    super(message);
    this.name = 'SupabaseError';
  }
}

export function handleSupabaseError(error: any): never {
  if (error.code) {
    throw new SupabaseError(error.message, error.code, error.details);
  }
  throw new Error(error.message || 'Unknown error');
}
```

## 📚 Best Practices Summary

1. **✅ Use RPC for all complex operations**
   - Encapsulate logic in PostgreSQL functions
   - Call functions via `supabase.rpc()`

2. **✅ Use appropriate client**
   - Server client for server components
   - Browser client for client components
   - Anonymous client for public data

3. **✅ Type your RPC functions**
   - Define TypeScript interfaces for parameters and results
   - Use type assertions for type safety

4. **✅ Handle errors properly**
   - Check for errors after every operation
   - Provide meaningful error messages
   - Use try-catch for async operations

5. **✅ Organize your code**
   - Keep RPC calls in service layer
   - Group related functions
   - Document function parameters

6. **✅ Secure your functions**
   - Use `SECURITY DEFINER` carefully
   - Validate all inputs
   - Implement Row Level Security (RLS)

7. **❌ Avoid direct queries when possible**
   - Don't expose complex queries to client
   - Refactor complex queries to RPC functions

## 🔗 Additional Resources

- [Supabase RPC Documentation](https://supabase.com/docs/reference/javascript/rpc)
- [PostgreSQL Functions](https://www.postgresql.org/docs/current/sql-createfunction.html)
- [Supabase Auth](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

**Next**: [Custom Hooks →](./HOOKS.md)
