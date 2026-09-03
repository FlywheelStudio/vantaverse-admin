import { queryOptions } from '@tanstack/react-query';

import type { QueryDef } from './defineQuery';
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
) {
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
