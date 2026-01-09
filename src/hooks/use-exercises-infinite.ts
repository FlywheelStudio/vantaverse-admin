'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getExercisesPaginated } from '@/app/(authenticated)/builder/actions';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

export function useExercisesInfinite(
  search?: string,
  sortBy: string = 'updated_at',
  sortOrder: 'asc' | 'desc' = 'desc',
  pageSize: number = 20,
) {
  return useInfiniteQuery<Exercise[], Error>({
    queryKey: ['exercises-infinite', search, sortBy, sortOrder, pageSize],
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
    getNextPageParam: (lastPage, allPages, lastPageParam) => {
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
