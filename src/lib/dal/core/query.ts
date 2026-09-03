import type { SupabaseClient } from '@supabase/supabase-js';
import type { z } from 'zod';

import type { Database } from '@/lib/supabase/database.types';

import { resolveClient } from './clientStrategy';
import type { ClientStrategy } from './defineQuery';
import type { InfiniteQueryDef } from './defineInfiniteQuery';
import type { QueryDef } from './defineQuery';
import { fromPostgrestError, fromZodError, unknownError } from './errors';
import { error, success, type DalResult } from './result';

/**
 * Optional trailing arg for `query` / `mutate` / `queryInfinite`: inject a
 * Supabase client (tests, SSR cookie session) instead of resolving via
 * {@link ClientStrategy}.
 */
export type QueryCallOptions = {
  client?: SupabaseClient<Database>;
};

function isQueryCallOptions(value: unknown): value is QueryCallOptions {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  return Object.keys(value).every((key) => key === 'client');
}

function splitArgs<TArgs extends unknown[]>(
  allArgs: [...TArgs] | [...TArgs, QueryCallOptions],
): { runtimeArgs: TArgs; options?: QueryCallOptions } {
  if (allArgs.length === 0) {
    return { runtimeArgs: [] as unknown as TArgs };
  }

  const last = allArgs[allArgs.length - 1];
  if (isQueryCallOptions(last)) {
    return {
      runtimeArgs: allArgs.slice(0, -1) as TArgs,
      options: last,
    };
  }

  return { runtimeArgs: allArgs as TArgs };
}

async function runParsedExecute<TData>(
  strategy: ClientStrategy | undefined,
  schema: z.ZodType<TData>,
  execute: (
    client: SupabaseClient<Database>,
  ) =>
    | { data: unknown; error: Parameters<typeof fromPostgrestError>[0] | null }
    | PromiseLike<{
        data: unknown;
        error: Parameters<typeof fromPostgrestError>[0] | null;
      }>,
  options?: QueryCallOptions,
): Promise<DalResult<TData>> {
  const resolved = await resolveClient(strategy, options?.client);
  if (!resolved.success) {
    return error(resolved.error);
  }

  let rawResult: {
    data: unknown;
    error: Parameters<typeof fromPostgrestError>[0] | null;
  };

  try {
    rawResult = await Promise.resolve(execute(resolved.client));
  } catch (cause) {
    return error(
      unknownError(
        cause instanceof Error ? cause.message : 'Query execution failed',
        cause,
      ),
    );
  }

  if (rawResult.error) {
    return error(fromPostgrestError(rawResult.error));
  }

  const parsed = schema.safeParse(rawResult.data);
  if (!parsed.success) {
    return error(fromZodError(parsed.error));
  }

  return success(parsed.data);
}

/**
 * Runs a branded {@link QueryDef}: resolve client → execute → Zod-parse →
 * {@link DalResult} tuple. Destructure `const [err, data] = await query(...)`.
 * Trailing {@link QueryCallOptions} injects a client when present.
 */
export async function query<TArgs extends unknown[], TData>(
  def: QueryDef<TArgs, TData>,
  ...allArgs: [...TArgs] | [...TArgs, QueryCallOptions]
): Promise<DalResult<TData>> {
  const { runtimeArgs, options } = splitArgs(allArgs);

  return runParsedExecute(
    def.client,
    def.schema,
    (client) => def.execute(client, ...runtimeArgs),
    options,
  );
}

/**
 * Runs one page of a branded {@link InfiniteQueryDef} (same Result contract as
 * {@link query}). Prefer {@link toInfiniteQueryOptions} at React call sites.
 */
export async function queryInfinite<TArgs extends unknown[], TPage, TPageParam>(
  def: InfiniteQueryDef<TArgs, TPage, TPageParam>,
  pageParam: TPageParam,
  ...allArgs: [...TArgs] | [...TArgs, QueryCallOptions]
): Promise<DalResult<TPage>> {
  const { runtimeArgs, options } = splitArgs(allArgs);

  return runParsedExecute(
    def.client,
    def.schema,
    (client) => def.execute(client, pageParam, ...runtimeArgs),
    options,
  );
}
