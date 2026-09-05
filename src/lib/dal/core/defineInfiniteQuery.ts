import type { SupabaseClient } from '@supabase/supabase-js';
import type { z } from 'zod';

import type { Database } from '@/lib/supabase/database.types';

import type { ClientStrategy, SupabaseQueryResult } from './defineQuery';

const infiniteQueryDefBrand = Symbol('dal.InfiniteQueryDef');

/**
 * Unbranded shape accepted only by {@link defineInfiniteQuery}.
 * `TPage` is one page (typically {@link PageEnvelope}); `TPageParam` is the
 * cursor / offset RQ passes as `pageParam`.
 */
export type InfiniteQueryDefInput<
  TArgs extends unknown[],
  TPage,
  TPageParam,
> = {
  readonly key: (...args: TArgs) => readonly unknown[];
  readonly schema: z.ZodType<TPage>;
  readonly initialPageParam: TPageParam;
  readonly getNextPageParam: (
    lastPage: TPage,
    allPages: TPage[],
    lastPageParam: TPageParam,
    allPageParams: TPageParam[],
  ) => TPageParam | undefined | null;
  readonly getPreviousPageParam?: (
    firstPage: TPage,
    allPages: TPage[],
    firstPageParam: TPageParam,
    allPageParams: TPageParam[],
  ) => TPageParam | undefined | null;
  /** Optional RQ `maxPages` — drop oldest/newest pages when exceeded. */
  readonly maxPages?: number;
  readonly execute: (
    client: SupabaseClient<Database>,
    pageParam: TPageParam,
    ...args: TArgs
  ) => SupabaseQueryResult | PromiseLike<SupabaseQueryResult>;
  readonly client?: ClientStrategy;
};

/**
 * Opaque infinite-query definition. Construct only via
 * {@link defineInfiniteQuery} — hand-rolled objects are not assignable to
 * {@link queryInfinite} / {@link toInfiniteQueryOptions}.
 */
export type InfiniteQueryDef<
  TArgs extends unknown[],
  TPage,
  TPageParam,
> = InfiniteQueryDefInput<TArgs, TPage, TPageParam> & {
  readonly [infiniteQueryDefBrand]: true;
};

/**
 * Brands an infinite query definition so only factory-built defs pass
 * {@link queryInfinite} / {@link toInfiniteQueryOptions}.
 */
export function defineInfiniteQuery<
  const TArgs extends unknown[],
  TPage,
  TPageParam,
>(
  def: InfiniteQueryDefInput<TArgs, TPage, TPageParam>,
): InfiniteQueryDef<TArgs, TPage, TPageParam> {
  return { ...def, [infiniteQueryDefBrand]: true };
}
