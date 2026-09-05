import 'server-only';

import { createClient } from '@/lib/supabase/core/server';

import type { QueryDef } from './defineQuery';
import { query, type QueryCallOptions } from './query';
import type { DalResult } from './result';

/**
 * Server-side `query` that injects the cookie session client when the caller
 * does not pass `{ client }`. Safe to import from RSC / Route Handlers only.
 */
export async function queryWithSession<TArgs extends unknown[], TData>(
  def: QueryDef<TArgs, TData>,
  ...allArgs: [...TArgs] | [...TArgs, QueryCallOptions]
): Promise<DalResult<TData>> {
  const last = allArgs[allArgs.length - 1];
  const hasClient =
    typeof last === 'object' &&
    last !== null &&
    'client' in last &&
    (last as QueryCallOptions).client !== undefined;

  if (hasClient) {
    return query(def, ...(allArgs as [...TArgs, QueryCallOptions]));
  }

  const client = await createClient();
  return query(def, ...(allArgs as TArgs), { client });
}
