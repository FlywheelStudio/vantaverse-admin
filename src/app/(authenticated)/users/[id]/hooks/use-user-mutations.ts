'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { assignProgramToUser } from '../actions';
import toast from 'react-hot-toast';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import { addUserToOrganization } from '@/app/(authenticated)/groups/actions';

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
  programName?: string;
}

type UserDirectorySnapshot = Array<
  [readonly unknown[], ProfileWithStats[] | undefined]
>;

const snapshotUserDirectory = (
  queryClient: ReturnType<typeof useQueryClient>,
): UserDirectorySnapshot => [
  ...queryClient.getQueriesData<ProfileWithStats[]>({ queryKey: ['users'] }),
  ...queryClient.getQueriesData<ProfileWithStats[]>({
    queryKey: ['members-filtered'],
  }),
];

const restoreUserDirectory = (
  queryClient: ReturnType<typeof useQueryClient>,
  snapshot: UserDirectorySnapshot,
): void => {
  snapshot.forEach(([queryKey, data]) => {
    queryClient.setQueryData(queryKey, data);
  });
};

const patchUserDirectoryProgram = ({
  queryClient,
  userId,
  programAssignmentId,
  programName,
}: {
  queryClient: ReturnType<typeof useQueryClient>;
  userId: string;
  programAssignmentId: string;
  programName: string;
}): UserDirectorySnapshot => {
  const snapshot = snapshotUserDirectory(queryClient);

  const patchRow = (
    list: ProfileWithStats[] | undefined,
  ): ProfileWithStats[] | undefined => {
    if (!list) return list;
    return list.map((profile) => {
      if (profile.id !== userId) return profile;
      return {
        ...profile,
        program_assignment_id: programAssignmentId,
        program_assignment_name: programName,
        program_due_date: null,
        program_completion_percentage: 0,
      };
    });
  };

  for (const [queryKey] of snapshot) {
    queryClient.setQueryData<ProfileWithStats[]>(queryKey, (old) =>
      patchRow(old),
    );
  }

  return snapshot;
};

/**
 * Mutation hook for assigning a program to a user.
 * Optimistically patches `/users` list caches so the Program column updates immediately.
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
    onMutate: async ({ templateAssignmentId, programName }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: detailKey }),
        queryClient.cancelQueries({ queryKey: assignmentKey }),
        queryClient.cancelQueries({ queryKey: ['users'] }),
        queryClient.cancelQueries({ queryKey: ['members-filtered'] }),
      ]);

      const previousDetailData =
        queryClient.getQueryData<ProgramAssignmentWithTemplate | null>(
          detailKey,
        );
      const previousAssignmentData =
        queryClient.getQueryData<ProgramAssignmentWithTemplate | null>(
          assignmentKey,
        );

      const resolvedName = programName?.trim() || 'Program';
      const directorySnapshot = patchUserDirectoryProgram({
        queryClient,
        userId,
        // Temporary id until the server returns the cloned assignment id.
        programAssignmentId: templateAssignmentId,
        programName: resolvedName,
      });

      return {
        previousDetailData,
        previousAssignmentData,
        directorySnapshot,
      };
    },
    onError: (error, _variables, context) => {
      if (context?.previousDetailData !== undefined) {
        queryClient.setQueryData(detailKey, context.previousDetailData);
      }
      if (context?.previousAssignmentData !== undefined) {
        queryClient.setQueryData(assignmentKey, context.previousAssignmentData);
      }
      if (context?.directorySnapshot) {
        restoreUserDirectory(queryClient, context.directorySnapshot);
      }
      toast.error(error.message || 'Failed to assign program');
    },
    onSuccess: (data, variables) => {
      if (data?.id) {
        patchUserDirectoryProgram({
          queryClient,
          userId,
          programAssignmentId: data.id,
          programName: variables.programName?.trim() || 'Program',
        });
      }

      void queryClient.invalidateQueries({ queryKey: assignmentsKey });
      void queryClient.invalidateQueries({ queryKey: assignmentKey });
      void queryClient.invalidateQueries({ queryKey: detailKey });
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['members-filtered'] });
      void queryClient.invalidateQueries({ queryKey: ['member-filter-counts'] });
      toast.success('Program assigned successfully');
    },
  });
}

interface AddUserToOrganizationInput {
  organizationId: string;
  organizationName?: string;
}

/**
 * Mutation hook for adding a user to an organization (patient role).
 * Optimistically patches `/users` list caches so the Groups column updates immediately.
 */
export function useAddUserToOrganization(userId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ organizationId }: AddUserToOrganizationInput) => {
      const result = await addUserToOrganization(organizationId, userId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to assign group');
      }

      return result.data;
    },
    onMutate: async ({ organizationId, organizationName }) => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['users'] }),
        queryClient.cancelQueries({ queryKey: ['members-filtered'] }),
      ]);

      const orgs = queryClient.getQueryData<Organization[]>(['organizations']);
      const resolvedName =
        organizationName ??
        orgs?.find((org) => org.id === organizationId)?.name ??
        'Group';

      const snapshot: UserDirectorySnapshot = [
        ...queryClient.getQueriesData<ProfileWithStats[]>({
          queryKey: ['users'],
        }),
        ...queryClient.getQueriesData<ProfileWithStats[]>({
          queryKey: ['members-filtered'],
        }),
      ];

      const patchMembership = (
        list: ProfileWithStats[] | undefined,
      ): ProfileWithStats[] | undefined => {
        if (!list) return list;
        return list.map((profile) => {
          if (profile.id !== userId) return profile;
          const existing = profile.orgMemberships ?? [];
          const withoutTarget = existing.filter(
            (membership) => membership.orgId !== organizationId,
          );
          return {
            ...profile,
            orgMemberships: [
              ...withoutTarget,
              { orgId: organizationId, orgName: resolvedName },
            ],
          };
        });
      };

      for (const [queryKey] of snapshot) {
        queryClient.setQueryData<ProfileWithStats[]>(queryKey, (old) =>
          patchMembership(old),
        );
      }

      return { snapshot };
    },
    onError: (error, _variables, context) => {
      context?.snapshot.forEach(([queryKey, data]) => {
        queryClient.setQueryData(queryKey, data);
      });
      toast.error(error.message || 'Failed to assign group');
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['users'] });
      void queryClient.invalidateQueries({ queryKey: ['members-filtered'] });
      void queryClient.invalidateQueries({ queryKey: ['member-filter-counts'] });
      toast.success('Group assigned successfully');
    },
  });
}
