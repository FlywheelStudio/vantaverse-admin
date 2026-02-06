---
name: supabase-query-system
description: Documents the project's Supabase setup: core clients, Zod schemas, SupabaseQuery classes, realtime broadcast subscriptions, and SupabaseStorage. Use when creating or modifying schemas, queries, realtime channels, or storage in src/lib/supabase or server actions that call Supabase.
---

# Supabase Query System

Index. Full details, examples, and patterns: **[reference.md](reference.md)**.

## Core (`src/lib/supabase/core`)

- **client.ts** – Browser client (`'use client'`). Used by realtime. Do not use in queries.
- **server.ts** – `createClient()` with cookies; use in server components/actions. Queries get this via `SupabaseQuery.getClient('authenticated_user')`.
- **admin.ts** – `createAdminClient()` (service role, bypasses RLS). Server-only. Queries use via `getClient('service_role')`; storage uses it internally.
- **anonymous.ts** – No cookies; for static/ISR when no session.

Queries never import core directly; they extend `SupabaseQuery` and call `getClient(role)`.

## Schemas (`src/lib/supabase/schemas`)

One file per entity. Zod `z.object()` + `z.infer` for types. Optional: align enums with `database.types.ts`. See [reference.md](reference.md#schemas).

## Queries (`src/lib/supabase/queries`)

Class extends `SupabaseQuery`. Methods return `SupabaseSuccess<T> | SupabaseError`. Use `getClient('authenticated_user')` or `getClient('service_role')`; validate responses with schemas; use `parseResponsePostgresError` / `parseResponseZodError`. In server actions, use `resolveActionResult(result)` from `@/lib/server` when data is required. See [reference.md](reference.md#queries).

## Realtime (`src/lib/supabase/realtime.ts`, `realtime/*`)

Broadcast only (no postgres_changes). DB triggers call `realtime.send()`; client extends `SupabaseRealtime`, uses `createChannel` → `onBroadcast` → `subscribe`, and calls `cleanup()` on unmount. Topic: `scope:id:entity`; events: snake_case. See [reference.md](reference.md#realtime) and `src/lib/supabase/realtime/README.md` for triggers.

## Storage (`src/lib/supabase/storage.ts`)

`SupabaseStorage` class (uses admin client). Methods: `upload`, `list`, `createSignedUrl`, `delete`. All return `SupabaseSuccess<T> | SupabaseError`. Use in server actions; for private buckets use `getPublicUrl: false` then `createSignedUrl`. See [reference.md](reference.md#storage).
