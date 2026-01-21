'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { upsertExerciseTemplate } from '@/app/(authenticated)/builder/actions';
import { exercisesKeys } from './use-exercises';
import toast from 'react-hot-toast';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';

interface UpdateExerciseTemplateData {
  exerciseId: number;
  sets?: number;
  rep?: number;
  time?: number;
  distance?: string;
  weight?: string;
  rest_time?: number;
  tempo?: string[];
  rep_override?: number[];
  time_override?: number[];
  distance_override?: string[];
  weight_override?: string[];
  rest_time_override?: number[];
}

interface UseUpdateExerciseTemplateOptions {
  onSuccess?: () => void;
  onMutate?: (data: UpdateExerciseTemplateData) => void;
}

/**
 * Mutation hook for updating an exercise template
 */
export function useUpdateExerciseTemplate(
  options?: UseUpdateExerciseTemplateOptions,
) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateExerciseTemplateData) => {
      const result = await upsertExerciseTemplate({
        p_exercise_id: data.exerciseId,
        p_sets: data.sets,
        p_rep: data.rep,
        p_time: data.time,
        p_distance: data.distance,
        p_weight: data.weight,
        p_rest_time: data.rest_time,
        p_tempo: data.tempo,
        p_rep_override: data.rep_override,
        p_time_override: data.time_override,
        p_distance_override: data.distance_override,
        p_weight_override: data.weight_override,
        p_rest_time_override: data.rest_time_override,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update exercise template');
      }

      return result.data;
    },
    onMutate: async (variables) => {
      // Call optional onMutate callback for optimistic UI updates
      options?.onMutate?.(variables);

      // Cancel outgoing refetches
      await queryClient.cancelQueries({
        queryKey: exercisesKeys.lists(),
      });

      // Snapshot previous value
      const previousData = queryClient.getQueriesData({
        queryKey: exercisesKeys.lists(),
      });

      // Optimistically update the cache for templatesInfinite queries
      queryClient.setQueriesData<{
        pages: Array<ExerciseTemplate[]>;
        pageParams: number[];
      }>(
        {
          queryKey: exercisesKeys.lists(),
        },
        (old) => {
          if (!old) return old;

          // For infinite queries, update all pages
          if ('pages' in old && Array.isArray(old.pages)) {
            return {
              ...old,
              pages: old.pages.map((page) => {
                if (!Array.isArray(page)) return page;

                return page.map((template) => {
                  if (template.exercise_id === variables.exerciseId) {
                    return {
                      ...template,
                      sets: variables.sets ?? template.sets,
                      rep: variables.rep ?? template.rep,
                      time: variables.time ?? template.time,
                      distance: variables.distance ?? template.distance,
                      weight: variables.weight ?? template.weight,
                      rest_time: variables.rest_time ?? template.rest_time,
                      tempo: variables.tempo ?? template.tempo,
                      rep_override: variables.rep_override ?? template.rep_override,
                      time_override: variables.time_override ?? template.time_override,
                      distance_override:
                        variables.distance_override ?? template.distance_override,
                      weight_override:
                        variables.weight_override ?? template.weight_override,
                      rest_time_override:
                        variables.rest_time_override ?? template.rest_time_override,
                    } as ExerciseTemplate;
                  }
                  return template;
                });
              }),
            };
          }

          return old;
        },
      );

      return { previousData };
    },
    onError: (error, __variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to update exercise template');
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: exercisesKeys.lists(),
      });
      toast.success('Template updated successfully');
      options?.onSuccess?.();
    },
  });
}
