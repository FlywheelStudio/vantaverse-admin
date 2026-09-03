import type { DalError } from './errors';

/** Minimum shape every DAL error channel must satisfy. */
export type DalErrorShape = {
  kind: string;
  code: string;
  message: string;
};

/**
 * Exclusive Result: either an error and no data, or data and no error.
 * Error-first tuple — destructure as `const [err, data] = await query(...)`.
 */
export type DalResult<S, E extends DalErrorShape = DalError> =
  | [E, null]
  | [null, S];

/** Build a success {@link DalResult}: `[null, data]`. */
export function success<S>(data: S): DalResult<S, never> {
  return [null, data];
}

/** Build a failure {@link DalResult}: `[err, null]`. */
export function error<E extends DalErrorShape>(err: E): DalResult<never, E> {
  return [err, null];
}
