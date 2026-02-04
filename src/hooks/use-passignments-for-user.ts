'use client';

import { useInfiniteQuery } from '@tanstack/react-query';
import { getProgramAssignmentsPaginated } from '@/app/(authenticated)/users/[id]/actions';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

/**
 * Query key factory for program assignments for user
 */
export const programAssignmentsForUserKeys = {
  all: ['program-assignments-for-user'] as const,
  lists: () => [...programAssignmentsForUserKeys.all, 'list'] as const,
  infinite: (filters: {
    search?: string;
    showAssigned: boolean;
    pageSize: number;
  }) =>
    [...programAssignmentsForUserKeys.lists(), 'infinite', filters] as const,
};

export function useProgramAssignmentsInfinite(
  search?: string,
  showAssigned: boolean = false,
  pageSize: number = 25,
) {
  return useInfiniteQuery<ProgramAssignmentWithTemplate[], Error>({
    queryKey: programAssignmentsForUserKeys.infinite({
      search,
      showAssigned,
      pageSize,
    }),
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
    getNextPageParam: (lastPage, _allPages, lastPageParam) => {
      // If last page has fewer items than pageSize, we've reached the end
      if (lastPage.length < pageSize) {
        return undefined;
      }
      // Otherwise, fetch next page
      return (lastPageParam as number) + 1;
    },
  });
}
