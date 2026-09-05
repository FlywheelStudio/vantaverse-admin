import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/database.types';

import { resolveClient } from './clientStrategy';
import type { DalEntity, MutationDef } from './defineMutation';
import { fromPostgrestError, fromZodError, unknownError } from './errors';
import type { QueryCallOptions } from './query';
import { error, success, type DalResult } from './result';

async function unwrapSupabaseResult(
  result: MutationDef<unknown, DalEntity>['execute'] extends (
    client: SupabaseClient<Database>,
    input: infer _I,
  ) => infer R
    ? R
    : never,
): Promise<{
  data: unknown;
  error: Parameters<typeof fromPostgrestError>[0] | null;
}> {
  return Promise.resolve(result);
}

/**
 * Runs a branded {@link MutationDef}: resolve client → optional input Zod →
 * execute → response Zod → {@link DalResult} tuple. Does not touch the TanStack
 * cache — use {@link toMutationOptions} for optimistic patches / invalidation.
 */
export async function mutate<TInput, TData extends DalEntity>(
  def: MutationDef<TInput, TData>,
  input: TInput,
  options?: QueryCallOptions,
): Promise<DalResult<TData>> {
  const resolved = await resolveClient(def.client, options?.client);
  if (!resolved.success) {
    return error(resolved.error);
  }

  let parsedInput = input;
  if (def.inputSchema) {
    const inputParsed = def.inputSchema.safeParse(input);
    if (!inputParsed.success) {
      return error(fromZodError(inputParsed.error, 'Invalid input'));
    }
    parsedInput = inputParsed.data;
  }

  let rawResult: {
    data: unknown;
    error: Parameters<typeof fromPostgrestError>[0] | null;
  };

  try {
    rawResult = await unwrapSupabaseResult(
      def.execute(resolved.client, parsedInput),
    );
  } catch (cause) {
    return error(
      unknownError(
        cause instanceof Error ? cause.message : 'Mutation execution failed',
        cause,
      ),
    );
  }

  if (rawResult.error) {
    return error(fromPostgrestError(rawResult.error));
  }

  const parsed = def.schema.safeParse(rawResult.data);
  if (!parsed.success) {
    return error(fromZodError(parsed.error));
  }

  return success(parsed.data);
}
