'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getProgramAssignmentsPaginated } from '@/app/(authenticated)/users/[id]/actions';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

export function useProgramAssignmentsInfinite(
  search?: string,
  showAssigned: boolean = false,
  pageSize: number = 25,
) {
  return useInfiniteQuery<ProgramAssignmentWithTemplate[], Error>({
    queryKey: [
      'program-assignments-infinite',
      search,
      showAssigned,
      pageSize,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const result = await getProgramAssignmentsPaginated(
        pageParam as number,
        pageSize,
        search,
        showAssigned,
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
