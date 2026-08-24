'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listTagCategories,
  searchTags,
  getExerciseTags,
  upsertTag,
  setExerciseTags,
  getAllTags,
} from '@/app/(authenticated)/exercises/actions';
import type { Tag } from '@/lib/supabase/schemas/tags';
import toast from 'react-hot-toast';

export const tagKeys = {
  all: ['tags'] as const,
  categories: ['tags', 'categories'] as const,
  catalog: ['tags', 'catalog'] as const,
  search: (category: string, q: string) =>
    ['tags', 'search', category, q] as const,
  exercise: (exerciseId: number) =>
    ['tags', 'exercise', exerciseId] as const,
};

/**
 * Global tag categories from list_tag_categories().
 */
export function useTagCategories() {
  return useQuery<string[], Error>({
    queryKey: tagKeys.categories,
    queryFn: async () => {
      const result = await listTagCategories();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}


/**
 * All catalog tags across all categories.
 */
export function useAllTags() {
  return useQuery<Tag[], Error>({
    queryKey: tagKeys.catalog,
    queryFn: async () => {
      const result = await getAllTags();
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Tags currently assigned to an exercise.
 */
export function useExerciseTags(exerciseId: number, enabled = true) {
  return useQuery<Tag[], Error>({
    queryKey: tagKeys.exercise(exerciseId),
    queryFn: async () => {
      const result = await getExerciseTags(exerciseId);
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled,
  });
}

/**
 * Debounced category-scoped tag search for combobox options.
 */
export function useSearchTags(params: {
  category: string;
  q: string;
  limit?: number;
  enabled?: boolean;
}) {
  return useQuery<Tag[], Error>({
    queryKey: tagKeys.search(params.category, params.q),
    queryFn: async () => {
      const result = await searchTags({
        q: params.q || undefined,
        category: params.category,
        limit: 20,
      });
      if (!result.success) throw new Error(result.error);
      return result.data;
    },
    enabled: params.enabled ?? true,
    staleTime: 30 * 1000,
  });
}

/**
 * Create or return existing tag in a category.
 */
export function useUpsertTag() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: { category: string; name: string }) => {
      const result = await upsertTag(input);
      if (!result.success) {
        throw new Error(result.error || 'Failed to create tag');
      }
      return result.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: tagKeys.search(variables.category, ''),
      });
      queryClient.invalidateQueries({ queryKey: tagKeys.categories });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to create tag');
    },
  });
}

/**
 * Replace-all assignment for an exercise.
 */
export function useSetExerciseTags(exerciseId: number) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (tagIds: number[]) => {
      const result = await setExerciseTags({ exerciseId, tagIds });
      if (!result.success) {
        throw new Error(result.error || 'Failed to update tags');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: tagKeys.exercise(exerciseId),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to update tags');
    },
  });
}
