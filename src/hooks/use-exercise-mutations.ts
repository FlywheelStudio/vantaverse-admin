'use client';

import {
  type QueryKey,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { updateExercise } from '@/app/(authenticated)/exercises/actions';
import { exercisesKeys } from './use-exercises';
import toast from 'react-hot-toast';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

interface UpdateExerciseData {
  id: number;
  data: Partial<Exercise>;
}

interface UseUpdateExerciseOptions {
  onSuccess?: () => void;
}

type MutationContext = {
  previousData: Array<[QueryKey, unknown]>;
};

function isExerciseRow(value: unknown): value is Exercise {
  return (
    typeof value === 'object' &&
    value !== null &&
    'id' in value &&
    'exercise_name' in value
  );
}

function sameExerciseId(exercise: Exercise, id: number): boolean {
  return Number(exercise.id) === Number(id);
}

function mergeExercise(exercise: Exercise, patch: Partial<Exercise>): Exercise {
  return { ...exercise, ...patch };
}

function patchExerciseList(
  list: unknown[],
  id: number,
  patch: Partial<Exercise>,
): unknown[] {
  return list.map((item) =>
    isExerciseRow(item) && sameExerciseId(item, id)
      ? mergeExercise(item, patch)
      : item,
  );
}

/**
 * Patch one exercise across flat lists and infinite-query page caches.
 */
function patchExerciseInCache(
  old: unknown,
  id: number,
  patch: Partial<Exercise>,
): unknown {
  if (!old) return old;

  if (Array.isArray(old)) {
    return patchExerciseList(old, id, patch);
  }

  if (
    typeof old === 'object' &&
    'pages' in old &&
    Array.isArray((old as { pages: unknown }).pages)
  ) {
    const infinite = old as { pages: unknown[]; pageParams: unknown[] };
    return {
      ...infinite,
      pages: infinite.pages.map((page) => {
        if (Array.isArray(page)) {
          return patchExerciseList(page, id, patch);
        }
        if (
          page &&
          typeof page === 'object' &&
          'data' in page &&
          Array.isArray((page as { data: unknown }).data)
        ) {
          const paginated = page as { data: unknown[] };
          return {
            ...paginated,
            data: patchExerciseList(paginated.data, id, patch),
          };
        }
        return page;
      }),
    };
  }

  if (isExerciseRow(old) && sameExerciseId(old, id)) {
    return mergeExercise(old, patch);
  }

  return old;
}

/**
 * Mutation hook for updating an exercise.
 * Patches library infinite pages and rolls back on error.
 */
export function useUpdateExercise(options?: UseUpdateExerciseOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateExerciseData): Promise<Exercise> => {
      const result = await updateExercise(data.id, data.data);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update exercise');
      }

      return result.data;
    },
    onMutate: async (variables): Promise<MutationContext> => {
      await queryClient.cancelQueries({
        queryKey: exercisesKeys.all,
      });

      const previousData = queryClient.getQueriesData({
        queryKey: exercisesKeys.all,
      });

      queryClient.setQueriesData({ queryKey: exercisesKeys.all }, (old) =>
        patchExerciseInCache(old, variables.id, {
          ...variables.data,
          updated_at: new Date().toISOString(),
        }),
      );

      return { previousData };
    },
    onError: (error, _variables, context) => {
      if (context?.previousData) {
        for (const [queryKey, data] of context.previousData) {
          queryClient.setQueryData(queryKey, data);
        }
      }
      toast.error(error.message || 'Failed to update exercise');
    },
    onSuccess: (data, variables) => {
      queryClient.setQueriesData({ queryKey: exercisesKeys.all }, (old) =>
        patchExerciseInCache(old, variables.id, data),
      );
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.all,
      });
      toast.success('Exercise updated successfully');
      options?.onSuccess?.();
    },
  });
}
