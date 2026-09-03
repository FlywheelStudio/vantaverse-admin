import { queryOptions, type UseQueryOptions } from '@tanstack/react-query';

import type { QueryDef } from './defineQuery';
import type { DalError } from './errors';
import { query } from './query';

/**
 * TanStack `queryOptions` adapter for a {@link QueryDef}.
 * `queryFn` calls {@link query} and **throws** {@link DalError} on failure
 * (RQ does not use the tuple Result encoding).
 *
 * @example
 * ```ts
 * useQuery(toQueryOptions(listDalItems));
 * ```
 */
export function toQueryOptions<TArgs extends unknown[], TData>(
  def: QueryDef<TArgs, TData>,
  ...args: TArgs
): UseQueryOptions<
  TData,
  DalError,
  TData,
  ReturnType<QueryDef<TArgs, TData>['key']>
> {
  return queryOptions({
    queryKey: def.key(...args),
    queryFn: async () => {
      const [err, data] = await query(def, ...args);
      if (err) {
        throw err;
      }
      return data;
    },
  });
}
