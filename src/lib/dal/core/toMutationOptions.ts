import {
  mutationOptions,
  type QueryClient,
  type QueryKey,
} from '@tanstack/react-query';

import type { DalEntity, MutationDef } from './defineMutation';
import { mutate } from './mutate';
import type { QueryCallOptions } from './query';
import {
  findExistingEntity,
  removeEntity,
  restoreSnapshots,
  snapshotKeys,
  swapTempEntity,
  upsertEntity,
  type CacheSnapshot,
} from './optimisticCache';

type MutationContext = {
  snapshots: CacheSnapshot[];
  patchKeys: readonly QueryKey[];
  tempId?: string;
};

function guessExistingId(input: unknown): string | undefined {
  if (typeof input === 'string') {
    return input;
  }
  if (
    typeof input === 'object' &&
    input !== null &&
    'id' in input &&
    typeof (input as { id: unknown }).id === 'string'
  ) {
    return (input as { id: string }).id;
  }
  return undefined;
}

/**
 * TanStack `mutationOptions` adapter for a {@link MutationDef}.
 * `mutationFn` calls {@link mutate} and **throws** on error. When
 * `def.optimistic` is set, patches `optimistic.keys` on mutate, rolls back
 * on error, swaps temp ids on success, and always invalidates `targets` on settle.
 *
 * @example
 * ```ts
 * useMutation(toMutationOptions(createDalItem, queryClient));
 * ```
 */
export function toMutationOptions<TInput, TData extends DalEntity>(
  def: MutationDef<TInput, TData>,
  queryClient: QueryClient,
  callOptions?: QueryCallOptions,
) {
  return mutationOptions({
    mutationFn: async (input: TInput) => {
      const [err, data] = await mutate(def, input, callOptions);
      if (err) {
        throw err;
      }
      return data;
    },

    onMutate: async (input): Promise<MutationContext> => {
      const intent = def.optimistic;
      if (!intent) {
        return { snapshots: [], patchKeys: [] };
      }

      const patchKeys = intent.keys(input);
      await Promise.all(
        patchKeys.map((key) => queryClient.cancelQueries({ queryKey: key })),
      );

      const snapshots = snapshotKeys(queryClient, patchKeys);

      if (intent.remove) {
        const id = intent.remove(input);
        for (const key of patchKeys) {
          removeEntity(queryClient, key, id);
        }
        return { snapshots, patchKeys };
      }

      const tempId = crypto.randomUUID();
      const existing = findExistingEntity<TData>(
        queryClient,
        patchKeys,
        guessExistingId(input),
      );
      const predicted = intent.predict(input, {
        tempId,
        now: new Date().toISOString(),
        existing,
      });

      for (const key of patchKeys) {
        upsertEntity(queryClient, key, predicted);
      }

      return {
        snapshots,
        patchKeys,
        tempId: predicted.id === tempId ? tempId : undefined,
      };
    },

    onError: (_err, _input, context) => {
      if (context?.snapshots.length) {
        restoreSnapshots(queryClient, context.snapshots);
      }
    },

    onSuccess: (data, _input, context) => {
      if (context?.tempId) {
        for (const key of context.patchKeys) {
          swapTempEntity(queryClient, key, context.tempId, data);
        }
      }
    },

    onSettled: async (_data, _error, input) => {
      await Promise.all(
        def
          .targets(input)
          .map((key) => queryClient.invalidateQueries({ queryKey: key })),
      );
    },
  });
}
