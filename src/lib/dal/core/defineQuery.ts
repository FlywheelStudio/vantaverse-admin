import type { SupabaseClient } from '@supabase/supabase-js';
import type { z } from 'zod';

import type { Database } from '@/lib/supabase/database.types';

import type { PostgrestErrorLike } from './errors';

/**
 * Which Supabase client `query` / `mutate` resolve when no client is injected.
 * - `authenticated` — browser cookie client; requires an active session
 *   (`getSession()`). On the server, inject via `{ client }` (caller owns session).
 * - `anonymous` — module-singleton anon key (no user session).
 * - `admin` — service-role key; server-only.
 */
export type ClientStrategy = 'authenticated' | 'anonymous' | 'admin';

/** Raw PostgREST-shaped return from a QueryDef/MutationDef `execute`. */
export type SupabaseQueryResult = {
  data: unknown;
  error: PostgrestErrorLike | null;
};

const queryDefBrand = Symbol('dal.QueryDef');

/** Unbranded shape accepted only by `defineQuery`. */
export type QueryDefInput<TArgs extends unknown[], TData> = {
  readonly key: (...args: TArgs) => readonly unknown[];
  readonly schema: z.ZodType<TData>;
  readonly execute: (
    client: SupabaseClient<Database>,
    ...args: TArgs
  ) => SupabaseQueryResult | PromiseLike<SupabaseQueryResult>;
  readonly client?: ClientStrategy;
};

/**
 * Opaque query definition. Construct only via {@link defineQuery} —
 * hand-rolled objects are not assignable to `query` / `toQueryOptions`.
 */
export type QueryDef<TArgs extends unknown[], TData> = QueryDefInput<
  TArgs,
  TData
> & {
  readonly [queryDefBrand]: true;
};

/**
 * Brands a query definition so only factory-built defs pass `query` /
 * `toQueryOptions`. Pass `key`, Zod `schema`, and `execute(client, ...args)`.
 */
export function defineQuery<const TArgs extends unknown[], TData>(
  def: QueryDefInput<TArgs, TData>,
): QueryDef<TArgs, TData> {
  return { ...def, [queryDefBrand]: true };
}
