'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import {
  getTeamsByOrganizationId,
  createTeam,
  updateTeam,
  deleteTeam,
} from '../../teams-actions';
import { organizationsKeys } from '../../groups/hooks/use-groups-mutations';
import type { Team } from '@/lib/supabase/schemas/teams';
import type { Organization } from '@/lib/supabase/schemas/organizations';

/**
 * Mutation hook for getting teams by organization ID
 */
export function useGetTeamsByOrganizationId() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (organizationId: string) => {
      const result = await getTeamsByOrganizationId(organizationId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to get teams');
      }

      return result.data;
    },
    onSuccess: (teams, organizationId) => {
      // Update organization with teams data in cache
      queryClient.setQueryData<Organization[]>(
        organizationsKeys.all,
        (old) => {
          if (!old) return old;
          return old.map((org) =>
            org.id === organizationId
              ? {
                  ...org,
                  teams,
                  teams_count: teams.length,
                }
              : org,
          );
        },
      );
    },
  });
}

/**
 * Mutation hook for creating a team
 * Includes optimistic updates and error rollback
 */
export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      organizationId,
      name,
      description,
    }: {
      organizationId: string;
      name: string;
      description?: string | null;
    }) => {
      const result = await createTeam(organizationId, name, description);

      if (!result.success) {
        throw new Error(result.error || 'Failed to create team');
      }

      return result.data;
    },
    onMutate: async ({ organizationId }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationsKeys.all });

      // Snapshot previous value
      const previousData =
        queryClient.getQueryData<Organization[]>(organizationsKeys.all);

      return { previousData, organizationId };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(organizationsKeys.all, context.previousData);
      }
      toast.error(error.message || 'Failed to create team');
    },
    onSuccess: async (team, { organizationId }) => {
      // Fetch updated teams for this organization
      const teamsResult = await getTeamsByOrganizationId(organizationId);
      if (teamsResult.success) {
        // Update organization with teams data
        queryClient.setQueryData<Organization[]>(
          organizationsKeys.all,
          (old) => {
            if (!old) return old;
            return old.map((org) =>
              org.id === organizationId
                ? {
                    ...org,
                    teams: teamsResult.data,
                    teams_count: teamsResult.data.length,
                  }
                : org,
            );
          },
        );
      }
      toast.success('Team created successfully');
    },
  });
}

/**
 * Mutation hook for updating a team
 * Includes optimistic updates and error rollback
 */
export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Team> }) => {
      const result = await updateTeam(id, data);

      if (!result.success) {
        throw new Error(result.error || 'Failed to update team');
      }

      return result.data;
    },
    onMutate: async ({ id, data }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationsKeys.all });

      // Snapshot previous value
      const previousData =
        queryClient.getQueryData<Organization[]>(organizationsKeys.all);

      // Optimistically update team in organization's teams array
      queryClient.setQueryData<Organization[]>(
        organizationsKeys.all,
        (old) => {
          if (!old) return old;
          return old.map((org) => {
            const teamIndex = org.teams?.findIndex((t) => t.id === id);
            if (teamIndex !== undefined && teamIndex >= 0 && org.teams) {
              const updatedTeams = [...org.teams];
              updatedTeams[teamIndex] = { ...updatedTeams[teamIndex], ...data };
              return { ...org, teams: updatedTeams };
            }
            return org;
          });
        },
      );

      return { previousData, teamId: id };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(organizationsKeys.all, context.previousData);
      }
      toast.error(error.message || 'Failed to update team');
    },
    onSuccess: async (_team, { id }, context) => {
      // Find organization that contains this team
      const organizations =
        queryClient.getQueryData<Organization[]>(organizationsKeys.all);
      const orgWithTeam = organizations?.find((org) =>
        org.teams?.some((t) => t.id === id),
      );

      if (orgWithTeam) {
        // Refetch teams for this organization to update the cache
        const teamsResult = await getTeamsByOrganizationId(orgWithTeam.id);
        if (teamsResult.success) {
          queryClient.setQueryData<Organization[]>(
            organizationsKeys.all,
            (old) => {
              if (!old) return old;
              return old.map((o) =>
                o.id === orgWithTeam.id
                  ? {
                      ...o,
                      teams: teamsResult.data,
                      teams_count: teamsResult.data.length,
                    }
                  : o,
              );
            },
          );
        }
      }
    },
  });
}

/**
 * Mutation hook for deleting a team
 * Includes optimistic updates and error rollback
 */
export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (teamId: string) => {
      const result = await deleteTeam(teamId);

      if (!result.success) {
        throw new Error(result.error || 'Failed to delete team');
      }

      return teamId;
    },
    onMutate: async (teamId) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: organizationsKeys.all });

      // Snapshot previous value
      const previousData =
        queryClient.getQueryData<Organization[]>(organizationsKeys.all);

      // Optimistically remove team from organization's teams array
      queryClient.setQueryData<Organization[]>(
        organizationsKeys.all,
        (old) => {
          if (!old) return old;
          return old.map((org) => {
            const updatedTeams = org.teams?.filter((t) => t.id !== teamId);
            return {
              ...org,
              teams: updatedTeams,
              teams_count: updatedTeams?.length || 0,
            };
          });
        },
      );

      return { previousData, teamId };
    },
    onError: (error, _variables, context) => {
      // Rollback on error
      if (context?.previousData) {
        queryClient.setQueryData(organizationsKeys.all, context.previousData);
      }
      toast.error(error.message || 'Failed to delete team');
    },
    onSuccess: async (_teamId, _variables, context) => {
      // Find organization that contained this team
      const organizations =
        queryClient.getQueryData<Organization[]>(organizationsKeys.all);
      const orgWithTeam = organizations?.find((org) =>
        org.teams?.some((t) => t.id === context?.teamId),
      );

      if (orgWithTeam) {
        // Refetch teams for this organization to update the cache
        const teamsResult = await getTeamsByOrganizationId(orgWithTeam.id);
        if (teamsResult.success) {
          queryClient.setQueryData<Organization[]>(
            organizationsKeys.all,
            (old) => {
              if (!old) return old;
              return old.map((o) =>
                o.id === orgWithTeam.id
                  ? {
                      ...o,
                      teams: teamsResult.data,
                      teams_count: teamsResult.data.length,
                    }
                  : o,
              );
            },
          );
        }
      }
      toast.success('Team deleted successfully');
    },
  });
}
