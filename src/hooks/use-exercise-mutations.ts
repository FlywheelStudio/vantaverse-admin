'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
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

/**
 * Mutation hook for updating an exercise
 * Includes optimistic updates and error rollback
 */
export function useUpdateExercise(options?: UseUpdateExerciseOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateExerciseData) => {
      const result = await updateExercise(data.id, data.data);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update exercise');
      }

      return result.data;
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: exercisesKeys.all,
      });

      // Snapshot previous value
      const previousData = queryClient.getQueryData<Exercise[]>(
        exercisesKeys.all,
      );

      // Optimistically update the cache for main exercises list
      queryClient.setQueryData<Exercise[]>(exercisesKeys.all, (old) => {
        if (!old) return old;
        return old.map((exercise) =>
          exercise.id === variables.id
            ? { ...exercise, ...variables.data }
            : exercise,
        );
      });

      return { previousData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(exercisesKeys.all, context.previousData);
      }
      toast.error(error.message || 'Failed to update exercise');
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.all,
      });
      toast.success('Exercise updated successfully');
      options?.onSuccess?.();
    },
  });
}
