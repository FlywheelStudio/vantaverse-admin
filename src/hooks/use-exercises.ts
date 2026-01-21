'use client';

import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { getExercises } from '@/app/(authenticated)/exercises/actions';
import { getExercisesPaginated, getExerciseTemplatesPaginated } from '@/app/(authenticated)/builder/actions';
import type { Exercise } from '@/lib/supabase/schemas/exercises';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';

/**
 * Query key factory for exercises
 */
export const exercisesKeys = {
  all: ['exercises'] as const,
  lists: () => [...exercisesKeys.all, 'list'] as const,
  detail: (id: string) => [...exercisesKeys.all, 'detail', id] as const,
  infinite: (filters: { search?: string; sortBy: string; sortOrder: 'asc' | 'desc'; pageSize: number }) =>
    [...exercisesKeys.lists(), 'infinite', filters] as const,
  templatesInfinite: (filters: { search?: string; sortBy: string; sortOrder: 'asc' | 'desc'; pageSize: number }) =>
    [...exercisesKeys.lists(), 'templates-infinite', filters] as const,
};

export function useExercises(initialData?: Exercise[]) {
  return useQuery<Exercise[], Error>({
    queryKey: exercisesKeys.all,
    queryFn: async () => {
      const result = await getExercises();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    initialData,
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useExercisesInfinite(
  search?: string,
  sortBy: string = 'updated_at',
  sortOrder: 'asc' | 'desc' = 'desc',
  pageSize: number = 20,
) {
  return useInfiniteQuery<Exercise[], Error>({
    queryKey: exercisesKeys.infinite({ search, sortBy, sortOrder, pageSize }),
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getExercisesPaginated(
        pageParam as number,
        pageSize,
        search,
        sortBy,
        sortOrder,
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If last page has fewer items than pageSize, we've reached the end
      if (lastPage.length < pageSize) {
        return undefined;
      }
      // Otherwise, fetch next page
      return (lastPageParam as number) + 1;
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useExerciseTemplatesInfinite(
  search?: string,
  sortBy: string = 'updated_at',
  sortOrder: 'asc' | 'desc' = 'desc',
  pageSize: number = 20,
) {
  return useInfiniteQuery<ExerciseTemplate[], Error>({
    queryKey: exercisesKeys.templatesInfinite({ search, sortBy, sortOrder, pageSize }),
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getExerciseTemplatesPaginated(
        pageParam as number,
        pageSize,
        search,
        sortBy,
        sortOrder,
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data.data;
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If last page has fewer items than pageSize, we've reached the end
      if (lastPage.length < pageSize) {
        return undefined;
      }
      // Otherwise, fetch next page
      return (lastPageParam as number) + 1;
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
