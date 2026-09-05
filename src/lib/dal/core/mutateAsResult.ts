import type { UseMutationResult } from '@tanstack/react-query';

import { unknownError, type DalError } from './errors';
import { error, success, type DalResult } from './result';

/** Type guard for plain-object {@link DalError} thrown by TanStack adapters. */
export function isDalError(value: unknown): value is DalError {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.kind === 'string' &&
    typeof candidate.code === 'string' &&
    typeof candidate.message === 'string'
  );
}

const UX_CATALOG: ReadonlyArray<{ needle: string; ux: string }> = [
  { needle: 'Already on the team', ux: 'This person is already active.' },
  {
    needle: 'Permission denied',
    ux: 'You do not have permission to do that.',
  },
  { needle: 'Not authenticated', ux: 'Sign in to continue.' },
  {
    needle: 'Cannot revoke tenant owner',
    ux: 'The tenant owner cannot be revoked.',
  },
];

function catalogUxMessage(message: string): string | undefined {
  if (message.includes('already used by')) {
    return message;
  }

  // RLS-style PostgREST text is lowercase; invite RAISE uses title case.
  if (/permission denied/i.test(message)) {
    return 'You do not have permission to do that.';
  }

  for (const { needle, ux } of UX_CATALOG) {
    if (needle === 'Permission denied') continue;
    if (message === needle || message.includes(needle)) {
      return ux;
    }
  }

  return undefined;
}

/** User-facing string for a {@link DalError}. */
export function formatDalError(
  err: DalError,
  fallback = 'Something went wrong.',
): string {
  const message = err.message.trim();
  if (message.length === 0) return fallback;

  const catalog = catalogUxMessage(message);
  if (catalog !== undefined) return catalog;

  return message;
}

/**
 * Runs `mutation.mutateAsync` and maps success/failure to a {@link DalResult}
 * tuple. Keeps adapter throw semantics for TanStack cache/optimism; call sites
 * branch on `err` instead of try/catch.
 */
export async function mutateAsResult<TData, TError, TVariables, TContext>(
  mutation: Pick<
    UseMutationResult<TData, TError, TVariables, TContext>,
    'mutateAsync'
  >,
  variables: TVariables,
): Promise<DalResult<TData>> {
  try {
    const data = await mutation.mutateAsync(variables);
    return success(data);
  } catch (cause) {
    if (isDalError(cause)) {
      return error(cause);
    }
    return error(
      unknownError(
        cause instanceof Error ? cause.message : 'Mutation failed',
        cause,
      ),
    );
  }
}
