'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { removeMemberFromOrganization } from '../actions';
import {
  addAdminToOrganization,
  removeAdminFromOrganization,
  type SuperAdminGroupUser,
} from '../actions';
import toast from 'react-hot-toast';
import type { GroupMemberWithProgram } from '../actions';

/**
 * Query key factory for groups
 */
export const groupsKeys = {
  all: ['groups'] as const,
  detail: (id: string | null | undefined) =>
    [...groupsKeys.all, 'detail', id] as const,
  members: (id: string | null | undefined) =>
    [...groupsKeys.detail(id), 'members'] as const,
  memberIds: (id: string | null | undefined) =>
    [...groupsKeys.detail(id), 'member-ids'] as const,
  programs: (id: string | null | undefined) =>
    [...groupsKeys.detail(id), 'programs'] as const,
  physiologist: (id: string | null | undefined) =>
    [...groupsKeys.detail(id), 'physiologist'] as const,
  teamMembers: (teamId: string | null | undefined) =>
    [...groupsKeys.all, 'team', 'members', teamId] as const,
};


/**
 * Mutation hook for removing a member from organization
 * Includes optimistic updates and error rollback
 */
export function useRemoveGroupMember(organizationId: string) {
  const queryClient = useQueryClient();
  const membersKey = groupsKeys.members(organizationId);

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await removeMemberFromOrganization(organizationId, userId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to remove member');
      }

      return userId;
    },
    onMutate: async (userId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: membersKey });

      // Snapshot previous value
      const previousData =
        queryClient.getQueryData<GroupMemberWithProgram[]>(membersKey);

      // Optimistically remove the member from cache (never write undefined)
      queryClient.setQueryData<GroupMemberWithProgram[]>(membersKey, (old) =>
        (old ?? []).filter((member) => member.user_id !== userId),
      );

      // Show toast immediately
      toast.success('Member removed');

      return { previousData };
    },
    onError: (error, _userId, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(membersKey, context.previousData);
      }
      toast.error(error.message || 'Failed to remove member');
    },
    onSuccess: () => {
      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: membersKey,
      });
    },
  });
}

export function useAddGroupAdmin(organizationId: string) {
  const queryClient = useQueryClient();
  const membersKey = groupsKeys.members(organizationId);

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await addAdminToOrganization(organizationId, userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to add admin');
      }
      return userId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey });
      toast.success('Admin assigned');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to assign admin');
    },
  });
}

export function useRemoveGroupAdmin(organizationId: string) {
  const queryClient = useQueryClient();
  const membersKey = groupsKeys.members(organizationId);

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await removeAdminFromOrganization(organizationId, userId);
      if (!result.success) {
        throw new Error(result.error || 'Failed to remove admin');
      }
      return userId;
    },
    onMutate: async (userId) => {
      await queryClient.cancelQueries({ queryKey: membersKey });

      const previous =
        queryClient.getQueryData<SuperAdminGroupUser[]>(membersKey);

      // Optimistically remove admin; full list will be refetched (never write undefined).
      queryClient.setQueryData<SuperAdminGroupUser[]>(membersKey, (old) =>
        (old ?? []).filter((u) => u.user_id !== userId),
      );

      toast.success('Admin removed');

      return { previous };
    },
    onError: (error, _userId, context) => {
      if (context?.previous) {
        queryClient.setQueryData(membersKey, context.previous);
      }
      toast.error(error.message || 'Failed to remove admin');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: membersKey });
    },
  });
}
