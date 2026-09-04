import { ZodError } from 'zod';

export type ValidationIssue = {
  path: string;
  message: string;
};

/**
 * Discriminated DAL failure. Prefer matching on `kind`:
 * `validation` | `backend` | `auth` | `unknown`.
 * Thrown by TanStack adapters; returned in the error slot of {@link DalResult}.
 */
export type DalError =
  | {
      kind: 'validation';
      code: 'VALIDATION';
      message: string;
      issues: ValidationIssue[];
    }
  | {
      kind: 'backend';
      code: string;
      message: string;
      httpStatus?: number;
      cause?: unknown;
    }
  | {
      kind: 'auth';
      code: 'UNAUTHENTICATED' | 'FORBIDDEN';
      message: string;
    }
  | {
      kind: 'unknown';
      code: 'UNKNOWN';
      message: string;
      cause?: unknown;
    };

export type PostgrestErrorLike = {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  httpStatus?: number;
};

/** Map a Zod parse failure to `kind: "validation"` with path/message issues. */
export function fromZodError(
  error: ZodError,
  message = 'Response validation failed',
): DalError {
  return {
    kind: 'validation',
    code: 'VALIDATION',
    message,
    issues: error.issues.map((issue) => ({
      path: issue.path.length > 0 ? issue.path.join('.') : '(root)',
      message: issue.message,
    })),
  };
}

/**
 * Map PostgREST/GoTrue-ish errors to `auth` (401/JWT/RLS) or `backend`.
 */
export function fromPostgrestError(error: PostgrestErrorLike): DalError {
  const code = error.code ?? 'UNKNOWN';
  const message = error.message.trim();

  if (message === 'Not authenticated') {
    return {
      kind: 'auth',
      code: 'UNAUTHENTICATED',
      message,
    };
  }

  if (
    message === 'Permission denied' ||
    message.startsWith('Permission denied ')
  ) {
    return {
      kind: 'auth',
      code: 'FORBIDDEN',
      message,
    };
  }

  if (
    code === 'PGRST301' ||
    code === '401' ||
    /jwt|invalid claim/i.test(message)
  ) {
    return {
      kind: 'auth',
      code: 'UNAUTHENTICATED',
      message,
    };
  }

  if (code === '42501' || code === '403') {
    return {
      kind: 'auth',
      code: 'FORBIDDEN',
      message,
    };
  }

  return {
    kind: 'backend',
    code,
    message,
    httpStatus: error.httpStatus,
    cause: error,
  };
}

/** Catch-all for thrown/unexpected failures (`kind: "unknown"`). */
export function unknownError(message: string, cause?: unknown): DalError {
  return {
    kind: 'unknown',
    code: 'UNKNOWN',
    message,
    cause,
  };
}

/** Field validator helper for form error messages */
export function fieldErrorMessage(errors: unknown[]): string | undefined {
  const first = errors[0];
  return typeof first === 'string' ? first : undefined;
}
