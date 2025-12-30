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
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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
              cookieStore.set(name, value, options)
            );
          } catch {
            console.error('Error setting cookies');
          }
        },
      },
    }
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
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

## ⚡ Best Practice: RPC Pattern

### Why Use RPC Instead of Direct Queries?

**❌ Avoid Direct Queries:**

```typescript
// Bad: Direct query from client
const { data } = await supabase
  .from('users')
  .select('*, posts(*), comments(*)')
  .eq('id', userId)
  .order('created_at', { ascending: false });
```

**Problems:**
- Exposes database structure to client
- Complex logic in frontend
- Harder to maintain and test
- Security risks
- Performance issues with complex joins

**✅ Use RPC (Remote Procedure Calls):**

```typescript
// Good: Call PostgreSQL function via RPC
const { data } = await supabase.rpc('get_user_dashboard', {
  p_user_id: userId
});
```

**Benefits:**
- ✅ **Security**: Logic stays on server
- ✅ **Performance**: Complex operations run on database
- ✅ **Maintainability**: Single source of truth
- ✅ **Reusability**: Functions can be called from anywhere
- ✅ **Type Safety**: Defined input/output parameters
- ✅ **Testing**: Easier to test database logic

## 🗄️ Database Functions

### Creating PostgreSQL Functions

#### 1. Simple Function

```sql
-- In Supabase SQL Editor
CREATE OR REPLACE FUNCTION get_user_notes(p_user_id uuid)
RETURNS TABLE (
  id bigint,
  title text,
  content text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    n.id,
    n.title,
    n.content,
    n.created_at
  FROM notes n
  WHERE n.user_id = p_user_id
  AND n.deleted_at IS NULL
  ORDER BY n.created_at DESC;
END;
$$;
```

**Call from TypeScript:**

```typescript
const { data, error } = await supabase.rpc('get_user_notes', {
  p_user_id: userId
});
```

#### 2. Function with Complex Logic

```sql
CREATE OR REPLACE FUNCTION create_note(
  p_user_id uuid,
  p_title text,
  p_content text,
  p_tags text[]
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_note_id bigint;
  v_result json;
BEGIN
  -- Validate input
  IF p_title IS NULL OR p_title = '' THEN
    RAISE EXCEPTION 'Title is required';
  END IF;

  -- Insert note
  INSERT INTO notes (user_id, title, content)
  VALUES (p_user_id, p_title, p_content)
  RETURNING id INTO v_note_id;

  -- Add tags if provided
  IF p_tags IS NOT NULL AND array_length(p_tags, 1) > 0 THEN
    INSERT INTO note_tags (note_id, tag)
    SELECT v_note_id, unnest(p_tags);
  END IF;

  -- Return result with note data
  SELECT json_build_object(
    'id', n.id,
    'title', n.title,
    'content', n.content,
    'created_at', n.created_at,
    'tags', COALESCE(
      (SELECT array_agg(nt.tag) FROM note_tags nt WHERE nt.note_id = n.id),
      ARRAY[]::text[]
    )
  )
  INTO v_result
  FROM notes n
  WHERE n.id = v_note_id;

  RETURN v_result;
END;
$$;
```

**Call from TypeScript:**

```typescript
const { data, error } = await supabase.rpc('create_note', {
  p_user_id: user.id,
  p_title: 'My Note',
  p_content: 'Note content here',
  p_tags: ['important', 'todo']
});

if (error) {
  console.error('Error creating note:', error);
  return;
}

console.log('Created note:', data);
```

#### 3. Function with Aggregations

```sql
CREATE OR REPLACE FUNCTION get_dashboard_stats(p_user_id uuid)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stats json;
BEGIN
  SELECT json_build_object(
    'total_notes', COUNT(*),
    'notes_this_week', COUNT(*) FILTER (
      WHERE created_at >= NOW() - INTERVAL '7 days'
    ),
    'total_tags', (
      SELECT COUNT(DISTINCT tag)
      FROM note_tags nt
      JOIN notes n ON nt.note_id = n.id
      WHERE n.user_id = p_user_id
    ),
    'recent_notes', (
      SELECT json_agg(
        json_build_object(
          'id', id,
          'title', title,
          'created_at', created_at
        )
        ORDER BY created_at DESC
      )
      FROM (
        SELECT id, title, created_at
        FROM notes
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT 5
      ) recent
    )
  )
  INTO v_stats
  FROM notes
  WHERE user_id = p_user_id;

  RETURN v_stats;
END;
$$;
```

**Call from TypeScript:**

```typescript
const { data: stats, error } = await supabase.rpc('get_dashboard_stats', {
  p_user_id: user.id
});

if (error) throw error;

console.log('Total notes:', stats.total_notes);
console.log('Recent notes:', stats.recent_notes);
```

### Function Naming Conventions

Follow these conventions for consistency:

- **Prefix with action**: `get_`, `create_`, `update_`, `delete_`
- **Use snake_case**: `get_user_notes` not `getUserNotes`
- **Parameter prefix**: `p_` for parameters (`p_user_id`)
- **Variable prefix**: `v_` for variables (`v_note_id`)

### TypeScript Types for RPC Functions

Create types for your RPC functions:

```typescript
// lib/supabase/types/rpc.ts
export interface GetUserNotesParams {
  p_user_id: string;
}

export interface UserNote {
  id: number;
  title: string;
  content: string;
  created_at: string;
}

export interface CreateNoteParams {
  p_user_id: string;
  p_title: string;
  p_content: string;
  p_tags?: string[];
}

export interface DashboardStats {
  total_notes: number;
  notes_this_week: number;
  total_tags: number;
  recent_notes: Array<{
    id: number;
    title: string;
    created_at: string;
  }>;
}
```

**Use with type safety:**

```typescript
import type { UserNote, GetUserNotesParams } from '@/lib/supabase/types/rpc';

async function getUserNotes(userId: string) {
  const { data, error } = await supabase
    .rpc('get_user_notes', {
      p_user_id: userId
    } as GetUserNotesParams);

  if (error) throw error;
  return data as UserNote[];
}
```

## 🔧 Query Builder (Use Sparingly)

While RPC is recommended, sometimes simple queries are acceptable:

### When to Use Direct Queries

- Simple SELECT with basic filters
- Public data with no complex logic
- Prototyping (refactor to RPC later)

```typescript
// Acceptable for simple cases
const { data } = await supabase
  .from('posts')
  .select('*')
  .eq('published', true)
  .order('created_at', { ascending: false })
  .limit(10);
```

### Query Organization

If you must use direct queries, organize them:

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
  callback: (payload: any) => void
) {
  const channel = supabase
    .channel(`notes-${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notes',
        filter: `user_id=eq.${userId}`
      },
      callback
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
  static async uploadFile(
    bucket: string,
    path: string,
    file: File
  ) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) throw error;
    return data;
  }

  /**
   * Get public URL for a file
   */
  static getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);

    return data.publicUrl;
  }

  /**
   * Delete a file
   */
  static async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);

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
    public details?: any
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

