'use client';

import {
  useInfiniteQuery,
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import {
  getProgramAssignmentsPaginated,
  getProgramAssignmentById,
  deleteProgramAssignment,
} from '@/app/(authenticated)/builder/actions';
import toast from 'react-hot-toast';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

/**
 * Query key factory for program assignments
 */
export const programAssignmentsKeys = {
  all: ['program-assignments'] as const,
  lists: () => [...programAssignmentsKeys.all, 'list'] as const,
  list: (filters: {
    search?: string;
    weeks?: number;
    pageSize: number;
    showAssigned?: boolean;
  }) => [...programAssignmentsKeys.lists(), filters] as const,
  infinite: (filters: {
    search?: string;
    weeks?: number;
    pageSize: number;
    showAssigned?: boolean;
  }) => [...programAssignmentsKeys.lists(), 'infinite', filters] as const,
  detail: (id: string | null | undefined) =>
    [...programAssignmentsKeys.all, 'detail', id] as const,
};

/**
 * Infinite query options factory for program assignments
 * Uses infiniteQueryOptions helper for type safety and reusability
 */
export function programAssignmentsInfiniteQueryOptions(
  search?: string,
  weeks?: number,
  pageSize: number = 16,
  showAssigned: boolean = false,
  initialData?: {
    pages: Array<{
      data: ProgramAssignmentWithTemplate[];
      page: number;
      pageSize: number;
      total: number;
      hasMore: boolean;
    }>;
    pageParams: number[];
  },
) {
  return infiniteQueryOptions({
    queryKey: programAssignmentsKeys.infinite({
      search,
      weeks,
      pageSize,
      showAssigned,
    }),
    queryFn: async ({ pageParam }) => {
      const result = await getProgramAssignmentsPaginated(
        pageParam as number,
        pageSize,
        search,
        weeks,
        showAssigned,
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    getNextPageParam: (lastPage) => {
      if (lastPage.hasMore) {
        return lastPage.page + 1;
      }
      return undefined;
    },
    initialPageParam: 1,
    ...(initialData && { initialData }),
  });
}

/**
 * Query options factory for program assignment detail
 * Uses queryOptions helper for type safety and reusability
 */
export function programAssignmentQueryOptions(
  id: string | null | undefined,
  initialData?: ProgramAssignmentWithTemplate | null,
) {
  return queryOptions({
    queryKey: programAssignmentsKeys.detail(id),
    queryFn: async () => {
      if (!id) return null;
      const result = await getProgramAssignmentById(id);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!id,
    ...(initialData !== undefined && initialData !== null && { initialData }),
  });
}

export function useProgramAssignments(
  search?: string,
  weeks?: number,
  pageSize: number = 16,
  showAssigned: boolean = false,
  initialData?: {
    pages: Array<{
      data: ProgramAssignmentWithTemplate[];
      page: number;
      pageSize: number;
      total: number;
      hasMore: boolean;
    }>;
    pageParams: number[];
  },
) {
  const queryOptions = programAssignmentsInfiniteQueryOptions(
    search,
    weeks,
    pageSize,
    showAssigned,
    initialData,
  );

  const query = useInfiniteQuery(queryOptions);

  // Flatten pages for component consumption
  const flattenedData: ProgramAssignmentWithTemplate[] =
    query.data?.pages.flatMap((page) => page.data) ?? [];

  return {
    ...query,
    assignments: flattenedData,
  };
}

export function useProgramAssignment(
  id: string | null | undefined,
  initialData?: ProgramAssignmentWithTemplate | null,
) {
  return useQuery(programAssignmentQueryOptions(id, initialData));
}

export function useDeleteProgramAssignment(
  search?: string,
  weeks?: number,
  pageSize: number = 16,
  showAssigned: boolean = false,
) {
  const queryClient = useQueryClient();
  const queryKey = programAssignmentsKeys.infinite({
    search,
    weeks,
    pageSize,
    showAssigned,
  });

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const result = await deleteProgramAssignment(assignmentId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return assignmentId;
    },
    onMutate: async (assignmentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKey);

      // Optimistically remove the item from cache
      queryClient.setQueryData<{
        pages: Array<{
          data: ProgramAssignmentWithTemplate[];
          page: number;
          pageSize: number;
          total: number;
          hasMore: boolean;
        }>;
        pageParams: number[];
      }>(queryKey, (old) => {
        if (!old) return old;

        return {
          ...old,
          pages: old.pages.map((page) => ({
            ...page,
            data: page.data.filter((item) => item.id !== assignmentId),
            total: Math.max(0, page.total - 1),
          })),
        };
      });

      // Show toast immediately
      toast.success('Program deleted successfully');

      return { previousData };
    },
    onError: (error, assignmentId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      toast.error(error.message || 'Failed to delete program');
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: programAssignmentsKeys.lists(),
      });
    },
  });
}
