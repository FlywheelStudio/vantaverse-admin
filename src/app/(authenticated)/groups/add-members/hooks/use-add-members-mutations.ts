'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { updateOrganizationMembers, assignPhysiologist } from '../../actions';
import { updateTeamMembers } from '../../teams-actions';
import { groupsKeys } from '../../[id]/hooks/use-group-mutations';
import toast from 'react-hot-toast';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import type { ProfileWithMemberships } from '@/lib/supabase/queries/profiles';

/**
 * Build member objects from user IDs using profiles map
 */
function buildMemberObjects(
  userIds: string[],
  profilesMap: Map<string, ProfileWithMemberships>,
) {
  return userIds
    .map((userId) => {
      const profile = profilesMap.get(userId);
      if (!profile) return null;
      return {
        id: `temp-${userId}`,
        user_id: userId,
        role: 'patient' as const,
        profile: {
          id: profile.id,
          avatar_url: profile.avatar_url,
          first_name: profile.first_name,
          last_name: profile.last_name,
          email: profile.email,
        },
      };
    })
    .filter((m): m is NonNullable<typeof m> => m !== null);
}

/**
 * Format success message for member updates
 */
function formatMemberUpdateMessage(
  added: number,
  removed: number,
  name: string,
): string {
  let message = 'Success! ';
  if (added > 0 && removed > 0) {
    message += `${added} members added, ${removed} members removed from ${name}`;
  } else if (added > 0) {
    message += `${added} members added to ${name}`;
  } else if (removed > 0) {
    message += `${removed} members removed from ${name}`;
  }
  return message;
}

interface UseAddOrganizationMembersParams {
  userIds: string[];
  profilesMap: Map<string, ProfileWithMemberships>;
  name: string;
}

/**
 * Mutation hook for adding/updating organization members
 * Includes optimistic updates and error rollback
 */
export function useAddOrganizationMembers(organizationId: string) {
  const queryClient = useQueryClient();
  const membersKey = groupsKeys.members(organizationId);
  const organizationsKey = ['organizations'];

  return useMutation({
    mutationFn: async (params: UseAddOrganizationMembersParams) => {
      const result = await updateOrganizationMembers(
        organizationId,
        params.userIds,
      );

      if (!result.success) {
        throw new Error(result.error || 'Failed to update members');
      }

      return { ...result.data, name: params.name };
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: membersKey });
      await queryClient.cancelQueries({ queryKey: organizationsKey });

      // Snapshot previous values
      const previousMembersData =
        queryClient.getQueryData<string[]>(membersKey);
      const previousOrganizationsData =
        queryClient.getQueryData<Organization[]>(organizationsKey);

      // Optimistically update members cache
      queryClient.setQueryData<string[]>(membersKey, () => variables.userIds);

      // Optimistically update organizations cache
      if (previousOrganizationsData) {
        queryClient.setQueryData<Organization[]>(
          organizationsKey,
          (old) => {
            if (!old) return old;

            return old.map((org) => {
              if (org.id === organizationId) {
                const newMembers = buildMemberObjects(
                  variables.userIds,
                  variables.profilesMap,
                );
                const existingAdmins = (org.members || []).filter(
                  (m) => m.role === 'admin',
                );
                const mergedMembers = [...existingAdmins, ...newMembers];

                return {
                  ...org,
                  members:
                    mergedMembers.length > 0 ? mergedMembers : undefined,
                  members_count: mergedMembers.length,
                  member_ids:
                    variables.userIds.length > 0 ? variables.userIds : undefined,
                };
              }
              return org;
            });
          },
        );
      }

      return { previousMembersData, previousOrganizationsData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousMembersData) {
        queryClient.setQueryData(membersKey, context.previousMembersData);
      }
      if (context?.previousOrganizationsData) {
        queryClient.setQueryData(
          organizationsKey,
          context.previousOrganizationsData,
        );
      }
      toast.error(error.message || 'Failed to update members');
    },
    onSuccess: (data, variables) => {
      const message = formatMemberUpdateMessage(
        data.added,
        data.removed,
        variables.name,
      );
      toast.success(message);

      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: membersKey,
      });
      queryClient.invalidateQueries({
        queryKey: groupsKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: organizationsKey,
      });
      queryClient.invalidateQueries({
        queryKey: ['profiles-with-memberships'],
      });
    },
  });
}

interface UseAddTeamMembersParams {
  userIds: string[];
  profilesMap: Map<string, ProfileWithMemberships>;
  name: string;
}

/**
 * Mutation hook for adding/updating team members
 * Includes optimistic updates and error rollback
 */
export function useAddTeamMembers(teamId: string, organizationId: string) {
  const queryClient = useQueryClient();
  const teamMembersKey = groupsKeys.teamMembers(teamId);
  const organizationsKey = ['organizations'];

  return useMutation({
    mutationFn: async (params: UseAddTeamMembersParams) => {
      const result = await updateTeamMembers(teamId, params.userIds);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update members');
      }

      return { ...result.data, name: params.name };
    },
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: teamMembersKey });
      await queryClient.cancelQueries({ queryKey: organizationsKey });

      // Snapshot previous values
      const previousTeamMembersData =
        queryClient.getQueryData<string[]>(teamMembersKey);
      const previousOrganizationsData =
        queryClient.getQueryData<Organization[]>(organizationsKey);

      // Optimistically update team members cache
      queryClient.setQueryData<string[]>(teamMembersKey, () => variables.userIds);

      // Optimistically update organizations cache (nested teams array)
      if (previousOrganizationsData) {
        queryClient.setQueryData<Organization[]>(
          organizationsKey,
          (old) => {
            if (!old) return old;

            return old.map((org) => {
              if (org.id === organizationId) {
                const updatedTeams = org.teams?.map((team) => {
                  if (team.id === teamId) {
                    const newMembers = buildMemberObjects(
                      variables.userIds,
                      variables.profilesMap,
                    );

                    return {
                      ...team,
                      members: newMembers.length > 0 ? newMembers : undefined,
                      members_count: newMembers.length,
                      member_ids: variables.userIds.length > 0 ? variables.userIds : undefined,
                    };
                  }
                  return team;
                });

                return {
                  ...org,
                  teams: updatedTeams,
                };
              }
              return org;
            });
          },
        );
      }

      return { previousTeamMembersData, previousOrganizationsData };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousTeamMembersData) {
        queryClient.setQueryData(teamMembersKey, context.previousTeamMembersData);
      }
      if (context?.previousOrganizationsData) {
        queryClient.setQueryData(
          organizationsKey,
          context.previousOrganizationsData,
        );
      }
      toast.error(error.message || 'Failed to update members');
    },
    onSuccess: (data, variables) => {
      const message = formatMemberUpdateMessage(
        data.added,
        data.removed,
        variables.name,
      );
      toast.success(message);

      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: teamMembersKey,
      });
      queryClient.invalidateQueries({
        queryKey: organizationsKey,
      });
      queryClient.invalidateQueries({
        queryKey: ['profiles-with-memberships'],
      });
    },
  });
}

/**
 * Mutation hook for assigning/replacing physiologist
 * Includes optimistic updates and error rollback
 */
export function useAssignPhysiologist(organizationId: string) {
  const queryClient = useQueryClient();
  const physiologistKey = groupsKeys.physiologist(organizationId);
  const organizationsKey = ['organizations'];

  return useMutation({
    mutationFn: async (userId: string) => {
      const result = await assignPhysiologist(organizationId, userId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to assign physiologist');
      }

      return result.data;
    },
    onMutate: async () => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: physiologistKey });
      await queryClient.cancelQueries({ queryKey: organizationsKey });

      // Snapshot previous values
      const previousPhysiologistData =
        queryClient.getQueryData(physiologistKey);
      const previousOrganizationsData =
        queryClient.getQueryData<Organization[]>(organizationsKey);

      return { previousPhysiologistData, previousOrganizationsData };
    },
    onError: (error, _userId, context) => {
      // Rollback on error
      if (context?.previousPhysiologistData) {
        queryClient.setQueryData(physiologistKey, context.previousPhysiologistData);
      }
      if (context?.previousOrganizationsData) {
        queryClient.setQueryData(
          organizationsKey,
          context.previousOrganizationsData,
        );
      }
      toast.error(error.message || 'Failed to assign physiologist');
    },
    onSuccess: (data) => {
      const message = data.replaced
        ? 'Physiologist replaced successfully'
        : 'Physiologist assigned successfully';

      toast.success(message);

      // Invalidate queries to ensure consistency
      queryClient.invalidateQueries({
        queryKey: physiologistKey,
      });
      queryClient.invalidateQueries({
        queryKey: groupsKeys.all,
      });
      queryClient.invalidateQueries({
        queryKey: organizationsKey,
      });
      queryClient.invalidateQueries({
        queryKey: ['profiles-with-memberships'],
      });
    },
  });
}
