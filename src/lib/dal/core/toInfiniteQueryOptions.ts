import { infiniteQueryOptions } from '@tanstack/react-query';

import type { InfiniteQueryDef } from './defineInfiniteQuery';
import { queryInfinite } from './query';

/**
 * TanStack `infiniteQueryOptions` adapter for a {@link InfiniteQueryDef}.
 * `queryFn` calls {@link queryInfinite} and **throws** {@link DalError} on
 * failure. `null` from `getNextPageParam` / `getPreviousPageParam` is coerced
 * to `undefined` (RQ “no more pages”).
 *
 * @example
 * ```ts
 * useInfiniteQuery(toInfiniteQueryOptions(listDalItemsInfinite, { pageSize: 2 }));
 * ```
 */
export function toInfiniteQueryOptions<
  TArgs extends unknown[],
  TPage,
  TPageParam,
>(def: InfiniteQueryDef<TArgs, TPage, TPageParam>, ...args: TArgs) {
  return infiniteQueryOptions({
    queryKey: def.key(...args),
    initialPageParam: def.initialPageParam,
    maxPages: def.maxPages,
    queryFn: async (context): Promise<TPage> => {
      const [err, data] = await queryInfinite(
        def,
        context.pageParam as TPageParam,
        ...args,
      );
      if (err) {
        throw err;
      }
      return data;
    },
    getNextPageParam: (
      lastPage: TPage,
      allPages: TPage[],
      lastPageParam: TPageParam,
      allPageParams: TPageParam[],
    ): TPageParam | undefined => {
      const next = def.getNextPageParam(
        lastPage,
        allPages,
        lastPageParam,
        allPageParams,
      );
      return next ?? undefined;
    },
    getPreviousPageParam: def.getPreviousPageParam
      ? (
          firstPage: TPage,
          allPages: TPage[],
          firstPageParam: TPageParam,
          allPageParams: TPageParam[],
        ): TPageParam | undefined => {
          const prev = def.getPreviousPageParam!(
            firstPage,
            allPages,
            firstPageParam,
            allPageParams,
          );
          return prev ?? undefined;
        }
      : undefined,
  });
}
