import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateOrganizationMembers } from '../../actions';
import { updateTeamMembers } from '../../teams-actions';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import type { ProfileWithMemberships } from '@/lib/supabase/queries/profiles';

interface UseSaveMembersParams {
  type: 'organization' | 'team';
  id: string;
  name: string;
  organizationId?: string;
  selectedUserIds: Set<string>;
  hasChanges: boolean;
  profilesData:
    | { success: true; data: ProfileWithMemberships[] }
    | { success: false; error: string }
    | undefined;
  onSuccess: () => void;
}

export function useSaveMembers({
  type,
  id,
  name,
  organizationId,
  selectedUserIds,
  hasChanges,
  profilesData,
  onSuccess,
}: UseSaveMembersParams) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);

    // Get current organizations data for optimistic update
    const previousData = queryClient.getQueryData<Organization[]>([
      'organizations',
    ]);

    // Build member objects from profiles data
    const profilesMap = new Map(
      profilesData?.success && profilesData.data
        ? profilesData.data.map((p) => [p.id, p])
        : [],
    );

    // Optimistically update cache
    if (previousData) {
      queryClient.setQueryData<Organization[]>(['organizations'], (old) => {
        if (!old) return old;

        return old.map((org) => {
          if (type === 'organization' && org.id === id) {
            // Update organization members
            const newMemberIds = Array.from(selectedUserIds);
            const newMembers = newMemberIds
              .map((userId) => {
                const profile = profilesMap.get(userId);
                if (!profile) return null;
                return {
                  id: `temp-${userId}`, // Temporary ID, will be replaced on refetch
                  user_id: userId,
                  profile: profile
                    ? {
                        id: profile.id,
                        avatar_url: profile.avatar_url,
                        first_name: profile.first_name,
                        last_name: profile.last_name,
                        email: profile.email,
                      }
                    : null,
                };
              })
              .filter((m): m is NonNullable<typeof m> => m !== null);

            return {
              ...org,
              members: newMembers.length > 0 ? newMembers : undefined,
              members_count: newMembers.length,
              member_ids: newMemberIds.length > 0 ? newMemberIds : undefined,
            };
          } else if (type === 'team' && org.id === organizationId) {
            // Update team members within organization
            const updatedTeams = org.teams?.map((team) => {
              if (team.id === id) {
                const newMemberIds = Array.from(selectedUserIds);
                const newMembers = newMemberIds
                  .map((userId) => {
                    const profile = profilesMap.get(userId);
                    if (!profile) return null;
                    return {
                      id: `temp-${userId}`, // Temporary ID
                      user_id: userId,
                      profile: profile
                        ? {
                            id: profile.id,
                            avatar_url: profile.avatar_url,
                            first_name: profile.first_name,
                            last_name: profile.last_name,
                            email: profile.email,
                          }
                        : null,
                    };
                  })
                  .filter((m): m is NonNullable<typeof m> => m !== null);

                return {
                  ...team,
                  members: newMembers.length > 0 ? newMembers : undefined,
                  members_count: newMembers.length,
                  member_ids:
                    newMemberIds.length > 0 ? newMemberIds : undefined,
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
      });
    }

    try {
      const userIds = Array.from(selectedUserIds);
      const result =
        type === 'organization'
          ? await updateOrganizationMembers(id, userIds)
          : await updateTeamMembers(id, userIds);

      if (result.success && result.data) {
        const { added, removed } = result.data;
        let message = 'Success! ';
        if (added > 0 && removed > 0) {
          message += `${added} members added, ${removed} members removed from ${name}`;
        } else if (added > 0) {
          message += `${added} members added to ${name}`;
        } else if (removed > 0) {
          message += `${removed} members removed from ${name}`;
        }

        toast.success(message);

        // Invalidate to get fresh data (optimistic update already shows correct state)
        queryClient.invalidateQueries({
          queryKey: ['organizations'],
        });

        onSuccess();
      } else if (!result.success) {
        // Rollback on error
        if (previousData) {
          queryClient.setQueryData(['organizations'], previousData);
        }
        toast.error(result.error || 'Failed to update members');
      }
    } catch (error) {
      // Rollback on error
      if (previousData) {
        queryClient.setQueryData(['organizations'], previousData);
      }
      console.error('Error updating members:', error);
      toast.error('Failed to update members');
    } finally {
      setIsSaving(false);
    }
  };

  return {
    handleSave,
    isSaving,
  };
}
