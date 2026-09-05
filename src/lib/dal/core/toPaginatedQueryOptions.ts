import {
  keepPreviousData,
  queryOptions,
  type UseQueryOptions,
} from '@tanstack/react-query';

import type { QueryDef } from './defineQuery';
import type { DalError } from './errors';
import { query } from './query';

/**
 * TanStack `queryOptions` adapter for lagged / page-style pagination.
 * Same contract as {@link toQueryOptions}, plus `placeholderData: keepPreviousData`
 * so the previous page stays visible while the next page loads.
 *
 * Prefer a {@link QueryDef} whose data is a {@link PageEnvelope} and whose key
 * includes the page cursor / page index.
 *
 * @example
 * ```ts
 * useQuery(toPaginatedQueryOptions(listDalItemsPage, { cursor, pageSize: 2 }));
 * ```
 */
export function toPaginatedQueryOptions<TArgs extends unknown[], TData>(
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
    placeholderData: keepPreviousData,
  });
}
