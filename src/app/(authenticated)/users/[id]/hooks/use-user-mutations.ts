'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignProgramToUser, deleteProgram } from '../actions';
import toast from 'react-hot-toast';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

/**
 * Query key factory for user program assignments
 */
const userProgramKeys = {
  all: ['user-program'] as const,
  detail: (userId: string | null | undefined) =>
    [...userProgramKeys.all, 'detail', userId] as const,
  assignments: () => [...userProgramKeys.all, 'assignments'] as const,
};

interface AssignProgramData {
  templateAssignmentId: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
}

/**
 * Mutation hook for assigning a program to a user
 * Includes optimistic updates and error rollback
 */
export function useAssignProgramToUser(userId: string) {
  const queryClient = useQueryClient();
  const detailKey = userProgramKeys.detail(userId);
  const assignmentsKey = ['program-assignments'];
  const assignmentKey = ['program-assignment', userId];

  return useMutation({
    mutationFn: async (data: AssignProgramData) => {
      const result = await assignProgramToUser(
        data.templateAssignmentId,
        userId,
        data.startDate,
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to assign program');
      }

      return result.data;
    },
    onMutate: async (_variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: detailKey });
      await queryClient.cancelQueries({ queryKey: assignmentKey });

      // Snapshot previous values
      const previousDetailData =
        queryClient.getQueryData<ProgramAssignmentWithTemplate | null>(
          detailKey,
        );
      const previousAssignmentData =
        queryClient.getQueryData<ProgramAssignmentWithTemplate | null>(
          assignmentKey,
        );

      return { previousDetailData, previousAssignmentData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousDetailData !== undefined) {
        queryClient.setQueryData(detailKey, context.previousDetailData);
      }
      if (context?.previousAssignmentData !== undefined) {
        queryClient.setQueryData(assignmentKey, context.previousAssignmentData);
      }
      toast.error(error.message || 'Failed to assign program');
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: assignmentsKey,
      });
      queryClient.invalidateQueries({
        queryKey: assignmentKey,
      });
      queryClient.invalidateQueries({
        queryKey: detailKey,
      });
      toast.success('Program assigned successfully');
    },
  });
}

/**
 * Mutation hook for deleting a program assignment
 * Includes optimistic updates and error rollback
 */
export function useDeleteProgram(userId: string) {
  const queryClient = useQueryClient();
  const detailKey = userProgramKeys.detail(userId);
  const assignmentsKey = ['program-assignments'];
  const assignmentKey = ['program-assignment', userId];

  return useMutation({
    mutationFn: async (programAssignmentId: string) => {
      const result = await deleteProgram(programAssignmentId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete program');
      }

      return programAssignmentId;
    },
    onMutate: async (_programAssignmentId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: detailKey });
      await queryClient.cancelQueries({ queryKey: assignmentKey });

      // Snapshot previous values
      const previousDetailData =
        queryClient.getQueryData<ProgramAssignmentWithTemplate | null>(
          detailKey,
        );
      const previousAssignmentData =
        queryClient.getQueryData<ProgramAssignmentWithTemplate | null>(
          assignmentKey,
        );

      // Optimistically remove the program assignment
      queryClient.setQueryData<ProgramAssignmentWithTemplate | null>(
        detailKey,
        null,
      );
      queryClient.setQueryData<ProgramAssignmentWithTemplate | null>(
        assignmentKey,
        null,
      );

      return { previousDetailData, previousAssignmentData };
    },
    onError: (error, _programAssignmentId, context) => {
      // Rollback on error
      if (context?.previousDetailData !== undefined) {
        queryClient.setQueryData(detailKey, context.previousDetailData);
      }
      if (context?.previousAssignmentData !== undefined) {
        queryClient.setQueryData(assignmentKey, context.previousAssignmentData);
      }
      toast.error(error.message || 'Failed to delete program');
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: assignmentsKey,
      });
      queryClient.invalidateQueries({
        queryKey: assignmentKey,
      });
      queryClient.invalidateQueries({
        queryKey: detailKey,
      });
      toast.success('Program deleted successfully');
    },
  });
}
