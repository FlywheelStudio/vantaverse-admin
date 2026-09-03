import type { DalError } from './errors';
import { formatDalError } from './mutateAsResult';

/** TanStack Form validator return shape (`errorMap` / field meta). */
export type FormSubmitErrors = {
  form?: string;
  fields?: Record<string, string>;
};

/**
 * Present a {@link DalError} for TanStack Form validators.
 * `kind: "validation"` with path issues → `{ fields }`; otherwise `{ form }`.
 */
export function toFormErrors(
  err: DalError,
  fallback = 'Something went wrong.',
): FormSubmitErrors {
  if (err.kind === 'validation' && err.issues.length > 0) {
    const fields: Record<string, string> = {};
    for (const issue of err.issues) {
      if (issue.path && issue.path !== '(root)' && !(issue.path in fields)) {
        fields[issue.path] = issue.message;
      }
    }
    if (Object.keys(fields).length > 0) {
      return { fields };
    }
  }
  return { form: formatDalError(err, fallback) };
}

/** Read the form-level banner from `errorMap.onSubmit`. */
export function formSubmitMessage(onSubmitError: unknown): string | undefined {
  if (typeof onSubmitError === 'string') return onSubmitError;
  if (
    onSubmitError &&
    typeof onSubmitError === 'object' &&
    'form' in onSubmitError &&
    typeof (onSubmitError as { form?: unknown }).form === 'string'
  ) {
    return (onSubmitError as { form: string }).form;
  }
  return undefined;
}
