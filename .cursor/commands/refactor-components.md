---
description: Refactor any components to use React Query mutations with optimistic updates and proper loading handling
---

# Refactor Workout Schedule to React Query

## Context

The user will provide components as context in the conversation. These components should be analyzed to understand the current implementation patterns and React Query conventions used in the codebase.

## Target Component

Refactor the user's components to use proper React Query conventions with:
- Mutations
- Optimistic updates
- Proper loading states
- Error handling

## Reference Implementation

Use `@src/app/(authenticated)/builder` directory as reference for:
- React Query mutation patterns
- Optimistic update implementations
- Loading state handling
- Error handling patterns
- Hook organization

## Documentation

Read and reference:
- `@React Query` - TanStack Query documentation
- `@React Query Blog` - TkDodo's blog for best practices
- `@NextJS` - Next.js documentation for App Router patterns

## Process

1. **Analyze Context Components**
   - Review provided components to understand current React Query patterns
   - Identify mutation hooks, query keys, and optimistic update patterns
   - Note loading state handling approaches

2. **Review Target Component**
   - Read the target components to understand current implementation
   - Identify direct action calls that should become mutations
   - Identify state management that should use React Query cache
   - Note any loading/error states that need improvement

3. **Review Reference Implementation**
   - Check `src/app/(authenticated)/builder/[id]/page.tsx` for query setup
   - Check `src/hooks/` for available mutation hooks
   - Check `src/hooks/` for query hooks and keys
   - Review other builder components for patterns
4. **Refactor Implementation**
   - Replace direct action calls with mutation hooks
   - Implement optimistic updates using `onMutate` callbacks
   - Add proper loading states using `isPending`/`isLoading` from mutations
   - Add error handling with rollback on error
   - Ensure query invalidation happens on success
   - Maintain existing functionality while improving data flow

6. **Verify**
   - Ensure all mutations use proper query key invalidation
   - Verify optimistic updates work correctly
   - Check loading states are properly displayed
   - Confirm error handling and rollback work as expected

## Key Requirements

- Use existing mutation hooks when possible
- Implement optimistic updates for better UX
- Show loading states during mutations
- Handle errors gracefully with rollback
- Invalidate queries appropriately on success
- Follow patterns established in the builder directory
- Maintain type safety throughout
