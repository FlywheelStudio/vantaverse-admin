---
name: parallel-supabase-queries
description: Use createParallelQueries for type-safe parallel execution of multiple async operations with conditional execution, automatic error handling, and clean result extraction. Apply when refactoring Promise.all patterns or when executing multiple Supabase queries in parallel.
---

# Parallel Query Execution with createParallelQueries

## Overview

The `createParallelQueries` function provides a type-safe, declarative way to execute multiple async operations in parallel with support for conditional execution, automatic error handling, and clean result extraction.

**📚 See [EXAMPLES.md](./EXAMPLES.md) for comprehensive usage examples and migration guide.**

## Key Features

- **Type-safe parallel execution**: All queries execute in parallel using `Promise.all`
- **Conditional queries**: Skip queries based on runtime conditions
- **Automatic error handling**: Required queries automatically call `resolveActionResult()` (handles 404/403/400)
- **Default values**: Specify fallback values for failed optional queries
- **Clean result extraction**: No manual `result.success ? result.data : defaultValue` checks

## Prerequisites

Your queries must return the Result type pattern:
```typescript
type SupabaseSuccess<T> = { success: true; data: T };
type SupabaseError = { success: false; error: string; status?: number };
type Result<T> = SupabaseSuccess<T> | SupabaseError;
```

## Configuration Types

### QueryConfig<T>
```typescript
{
  query: () => Promise<Result<T>>;
  required?: boolean;        // Default: false - calls resolveActionResult() if fails
  defaultValue?: T;          // Fallback value if query fails
  statusCode?: number;        // Custom status code for error (default: 500)
}
```

### ConditionalQueryConfig<T>
```typescript
QueryConfig<T> & {
  condition: boolean;         // If false, query is skipped entirely
}
```

## Quick Start

```typescript
import { createParallelQueries } from '@/lib/supabase/query';

const data = await createParallelQueries({
  user: {
    query: () => userService.getById(id),
    required: true, // Automatically handles 404/403 errors
  },
  posts: {
    query: () => postService.getByUserId(id),
    defaultValue: [],
  },
});

// Type-safe access - no null checks needed
return <ProfilePage user={data.user} posts={data.posts} />;
```

## How It Works

1. **Filtering**: Queries with `condition: false` are filtered out before execution
2. **Parallel Execution**: Remaining queries execute in parallel via `Promise.all`
3. **Result Conversion**: Each result is converted to `ActionResult` format with status codes via `toActionResult()`
4. **Error Handling**: Required queries that fail automatically call `resolveActionResult()` (from `@/lib/server`) which:
   - Calls `notFound()` for 404 errors
   - Calls `forbidden()` for 403 errors
   - Throws for other errors
5. **Result Extraction**: Results are extracted with fallback to `defaultValue` or `null`

## Best Practices

1. **Use `required: true`** for queries critical to the page/function
   - Automatically handles 404/403 errors properly
   - No need for manual `notFound()` calls

2. **Always provide `defaultValue`** for optional queries
   - Makes the code more predictable
   - Avoids `null` checks later

3. **Use `condition`** instead of ternary operators in Promise.all
   - Cleaner code
   - Queries are skipped entirely (not executed with error)

4. **Group related queries** in the same `createParallelQueries` call
   - Better performance (all execute in parallel)
   - Easier to reason about

5. **Type safety**: The return type is automatically inferred from your schema
   - `data.appointments` has the correct type
   - TypeScript will catch errors

## Implementation

See `src/lib/supabase/query.ts` for the full implementation.

## Examples

**📚 Comprehensive examples, migration guide, and framework integration available in [EXAMPLES.md](./EXAMPLES.md)**
