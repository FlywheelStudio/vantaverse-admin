'use client';

import { useMutation, useQuery, queryOptions, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  bulkAssignProgram,
  cancelMemberProgram,
  getOrganizationPrograms,
  replaceMemberProgram,
  type BulkAssignResult,
  type GroupProgramRowData,
} from '../actions';
import { groupsKeys } from './use-group-mutations';

/**
 * Query options factory for group programs
 */
function groupProgramsQueryOptions(
  organizationId: string | null | undefined,
  initialData?: GroupProgramRowData[],
) {
  return queryOptions({
    queryKey: groupsKeys.programs(organizationId),
    queryFn: async (): Promise<GroupProgramRowData[]> => {
      if (!organizationId) return [];
      const result = await getOrganizationPrograms(organizationId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!organizationId,
    ...(initialData !== undefined && { initialData }),
  });
}

/**
 * Query hook for the group Programs tab
 */
export function useGroupPrograms(
  organizationId: string | null | undefined,
  initialData?: GroupProgramRowData[],
) {
  return useQuery(groupProgramsQueryOptions(organizationId, initialData));
}

export type BulkAssignInput = {
  templateAssignmentId: string;
  userIds: string[];
  startDate: string; // YYYY-MM-DD
};

/** Bulk assign a program template to selected members. Result reported in-modal. */
export function useBulkAssignGroupProgram(organizationId: string) {
  const queryClient = useQueryClient();
  const programsKey = groupsKeys.programs(organizationId);

  return useMutation({
    mutationFn: async (input: BulkAssignInput): Promise<BulkAssignResult> => {
      const result = await bulkAssignProgram(
        organizationId,
        input.templateAssignmentId,
        input.userIds,
        input.startDate,
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to assign program');
      }
      return result.data;
    },
    onSuccess: (data) => {
      if (data.assignedCount > 0) {
        queryClient.invalidateQueries({ queryKey: programsKey });
        queryClient.invalidateQueries({
          queryKey: groupsKeys.members(organizationId),
        });
      }
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to assign program');
    },
  });
}

/** Cancel a member's current program and assign a replacement template. */
export function useReplaceGroupMemberProgram(organizationId: string) {
  const queryClient = useQueryClient();
  const programsKey = groupsKeys.programs(organizationId);

  return useMutation({
    mutationFn: async (input: {
      userId: string;
      templateAssignmentId: string;
      startDate: string;
    }) => {
      const result = await replaceMemberProgram(
        organizationId,
        input.userId,
        input.templateAssignmentId,
        input.startDate,
      );
      if (!result.success) {
        throw new Error(result.error || 'Failed to replace program');
      }
      return result.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programsKey });
      queryClient.invalidateQueries({
        queryKey: groupsKeys.members(organizationId),
      });
      toast.success('Program replaced');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to replace program');
    },
  });
}

/** Soft-cancel one member assignment. */
export function useCancelGroupMemberProgram(organizationId: string) {
  const queryClient = useQueryClient();
  const programsKey = groupsKeys.programs(organizationId);

  return useMutation({
    mutationFn: async (assignmentId: string) => {
      const result = await cancelMemberProgram(organizationId, assignmentId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove program');
      }
      return assignmentId;
    },
    onMutate: async (assignmentId) => {
      await queryClient.cancelQueries({ queryKey: programsKey });
      const previous =
        queryClient.getQueryData<GroupProgramRowData[]>(programsKey);

      // Optimistically drop the cancelled assignment from cache.
      queryClient.setQueryData<GroupProgramRowData[]>(programsKey, (old) =>
        (old ?? [])
          .map((program) => ({
            ...program,
            members: program.members.filter(
              (m) => m.assignment_id !== assignmentId,
            ),
          }))
          .filter((program) => program.members.length > 0),
      );

      toast.success('Member removed from program');
      return { previous };
    },
    onError: (error, _assignmentId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(programsKey, context.previous);
      }
      toast.error(error.message || 'Failed to remove program');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: programsKey });
    },
  });
}
