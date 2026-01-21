# createParallelQueries Examples

This document provides comprehensive examples, migration patterns, and framework integration guides for `createParallelQueries`.

## Table of Contents

- [Basic Parallel Queries](#basic-parallel-queries)
- [Conditional Queries](#conditional-queries)
- [Required Queries](#required-queries-automatic-error-handling)
- [Mixed Query Types](#mixed-query-types)
- [Complete Example](#complete-example)
- [Migration Guide](#migration-guide)
- [Framework Integration](#framework-integration)
- [Implementation Pattern](#implementation-pattern)

## Basic Parallel Queries

### Before (Promise.all)

```typescript
const [usersResult, postsResult] = await Promise.all([
  userService.getUsers(),
  postService.getPosts(),
]);

const users = usersResult.success ? usersResult.data : [];
const posts = postsResult.success ? postsResult.data : [];
```

### After (createParallelQueries)

```typescript
const data = await createParallelQueries({
  users: {
    query: () => userService.getUsers(),
    defaultValue: [],
  },
  posts: {
    query: () => postService.getPosts(),
    defaultValue: [],
  },
});

// Type-safe access
const users = data.users;
const posts = data.posts;
```

## Conditional Queries

### Before

```typescript
const [profileResult, settingsResult] = await Promise.all([
  user.profileId !== null
    ? profileService.getProfile(user.profileId)
    : Promise.resolve({ success: false, error: 'No profile ID' } as const),
  user.hasSettings
    ? settingsService.getSettings(user.id)
    : Promise.resolve({ success: false, error: 'No settings' } as const),
]);

const profile = profileResult.success ? profileResult.data : null;
const settings = settingsResult.success ? settingsResult.data : null;
```

### After

```typescript
const data = await createParallelQueries({
  profile: {
    condition: user.profileId !== null,
    query: () => profileService.getProfile(user.profileId!),
    defaultValue: null,
  },
  settings: {
    condition: user.hasSettings,
    query: () => settingsService.getSettings(user.id),
    defaultValue: null,
  },
});

const profile = data.profile;
const settings = data.settings;
```

## Required Queries (Automatic Error Handling)

### Before

```typescript
const userResult = await userService.getById(id);
if (!userResult.success) {
  notFound(); // Manual error handling
}
const user = userResult.data;
```

### After

```typescript
const data = await createParallelQueries({
  user: {
    query: () => userService.getById(id),
    required: true, // Automatically calls resolveActionResult()
  },
});

// If query fails, resolveActionResult() is called (throws notFound/forbidden)
// If successful, data.user is available
const user = data.user;
```

## Mixed Query Types

```typescript
const data = await createParallelQueries({
  // Required query - will call resolveActionResult() if fails
  organization: {
    query: () => orgService.getById(id),
    required: true,
  },
  // Optional query with default
  metadata: {
    query: () => metadataService.getMetadata(id),
    defaultValue: null,
  },
  // Conditional query
  preferences: {
    condition: user.hasPreferences,
    query: () => preferencesService.getPreferences(user.id),
    defaultValue: null,
  },
  // Always executed with default
  comments: {
    query: () => commentService.getByPostId(id),
    defaultValue: [],
  },
});
```

## Complete Example

```typescript
// Fetching user profile page data
const data = await createParallelQueries({
  // Required - page fails if user not found
  user: {
    query: () => userService.getById(userId),
    required: true,
  },
  // Optional with default
  posts: {
    query: () => postService.getByUserId(userId),
    defaultValue: [],
  },
  // Conditional - only if user has profile
  profile: {
    condition: user.profileId !== null,
    query: () => profileService.getById(user.profileId!),
    defaultValue: null,
  },
  // Conditional - only if user has settings
  settings: {
    condition: user.hasSettings,
    query: () => settingsService.getByUserId(userId),
    defaultValue: null,
  },
  // Always fetch with default
  stats: {
    query: () => statsService.getUserStats(userId),
    defaultValue: { views: 0, likes: 0 },
  },
});

// Clean, type-safe access - no null checks needed
return <ProfilePage user={data.user} posts={data.posts} profile={data.profile} />;
```

## Migration Guide

### Step 1: Import

```typescript
import { createParallelQueries } from '@/lib/supabase/query';
```

### Step 2: Replace Promise.all

**Convert from:**
```typescript
const [result1, result2] = await Promise.all([query1(), query2()]);
const data1 = result1.success ? result1.data : defaultValue1;
const data2 = result2.success ? result2.data : defaultValue2;
```

**To:**
```typescript
const data = await createParallelQueries({
  data1: { query: () => query1(), defaultValue: defaultValue1 },
  data2: { query: () => query2(), defaultValue: defaultValue2 },
});
```

### Step 3: Replace Conditional Queries

**Convert from:**
```typescript
const result = await Promise.all([
  condition ? query() : Promise.resolve({ success: false, error: '...' }),
]);
```

**To:**
```typescript
const data = await createParallelQueries({
  result: {
    condition: condition,
    query: () => query(),
    defaultValue: null,
  },
});
```

### Step 4: Replace Required Query Error Handling

**Convert from:**
```typescript
const result = await query();
if (!result.success) {
  handleError(result); // e.g., notFound(), throw, etc.
}
const data = result.data;
```

**To:**
```typescript
const data = await createParallelQueries({
  result: {
    query: () => query(),
    required: true, // Automatically handles errors via resolveActionResult()
  },
});
// data.result is available if query succeeds
```

## Framework Integration

### Next.js App Router (Current Implementation)

The project uses `resolveActionResult()` from `@/lib/server` which handles errors automatically:

```typescript
// src/lib/server.ts
export function resolveActionResult<T>(result: ActionResult<T>): T {
  if (result.success) {
    return result.data;
  }

  if (process.env.NODE_ENV === "development") {
    console.error(result);
  }

  switch (result.status) {
    case 404:
      notFound();
    case 403:
      forbidden();
    case 400:
      throw new Error("Something went wrong. Please try again later.");
    default:
      throw new Error("Something went wrong. Please try again later.");
  }
}
```

`createParallelQueries` automatically calls `resolveActionResult()` for required queries that fail.

### Express.js

If using Express.js, you would need to create a custom error handler:

```typescript
function handleError(result: Error, res: Response) {
  if (result.status === 404) {
    return res.status(404).json({ error: result.error });
  }
  if (result.status === 403) {
    return res.status(403).json({ error: result.error });
  }
  return res.status(result.status || 500).json({ error: result.error });
}
```

Then modify `createParallelQueries` to use your custom handler, or wrap it:

```typescript
const data = await createParallelQueries({
  user: {
    query: () => userService.getById(id),
    required: true,
  },
});

// Handle errors manually if needed
if (!data.user) {
  handleError(result, res);
}
```

### Generic Error Handling

For a generic implementation:

```typescript
function handleError(result: Error) {
  throw new Error(result.error);
}
```

## Implementation Pattern

The function follows this pattern (simplified):

```typescript
export async function createParallelQueries<T extends QuerySchema>(
  schema: T,
): Promise<QueryResults<T>> {
  // 1. Filter queries based on conditions
  const activeQueries = Object.entries(schema)
    .filter(([_, def]) => {
      if ('condition' in def) {
        return def.condition;
      }
      return true;
    })
    .map(([key, def]) => ({
      key,
      query: def.query,
      required: def.required ?? false,
      defaultValue: def.defaultValue,
      statusCode: def.statusCode,
    }));

  // 2. Execute all queries in parallel
  const results = await Promise.all(
    activeQueries.map(async ({ key, query, required, defaultValue, statusCode }) => {
      const result = await query();
      const actionResult = toActionResult(result, statusCode);
      return { key, result: actionResult, required, defaultValue };
    }),
  );

  // 3. Process results and handle errors
  const output = {} as QueryResults<T>;

  for (const { key, result, required, defaultValue } of results) {
    if (required && !result.success) {
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to execute required query:', key, result);
      }
      resolveActionResult(result); // Calls notFound()/forbidden() or throws
    }

    output[key as keyof T] = (result.success
      ? result.data
      : defaultValue ?? null) as ExtractResultType<T[typeof key]>;
  }

  return output;
}
```

## Implementation Details

- **Status Codes**: Errors should include status codes (400, 403, 404, 500) which are preserved
- **Type Extraction**: Uses TypeScript conditional types to extract result types from query configs
- **Error Logging**: In development, failed required queries are logged to console
- **Performance**: All queries execute in parallel, same as `Promise.all`, but with better ergonomics
- **Error Handler**: Uses `resolveActionResult()` from `@/lib/server` which integrates with Next.js App Router
