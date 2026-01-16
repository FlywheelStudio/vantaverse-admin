import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { updateOrganizationMembers, assignPhysiologist } from '../../actions';
import { updateTeamMembers } from '../../teams-actions';
import type { Organization } from '@/lib/supabase/schemas/organizations';
import type { ProfileWithMemberships } from '@/lib/supabase/queries/profiles';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';

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

interface UseSaveMembersParams {
  type: 'organization' | 'team';
  id: string;
  name: string;
  organizationId?: string;
  selectedRole: MemberRole;
  selectedMemberIds: Set<string>;
  selectedPhysiologistId: string | null;
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
  selectedRole,
  selectedMemberIds,
  selectedPhysiologistId,
  hasChanges,
  profilesData,
  onSuccess,
}: UseSaveMembersParams) {
  const queryClient = useQueryClient();
  const [isSaving, setIsSaving] = useState(false);

  const handlePhysiologistSave = async () => {
    if (type !== 'organization' || !selectedPhysiologistId) {
      toast.error('Invalid physiologist assignment');
      setIsSaving(false);
      return;
    }

    const result = await assignPhysiologist(id, selectedPhysiologistId);

    if (result.success && result.data) {
      toast.success(
        result.data.replaced
          ? 'Physiologist replaced successfully'
          : 'Physiologist assigned successfully',
      );

      queryClient.invalidateQueries({
        queryKey: ['organizations'],
      });
      queryClient.invalidateQueries({
        queryKey: ['current-physiologist', id],
      });
      queryClient.invalidateQueries({
        queryKey: ['profiles-with-memberships'],
      });

      onSuccess();
    } else if (!result.success) {
      toast.error(result.error || 'Failed to assign physiologist');
    }
  };

  const handleMemberSave = async (
    previousData: Organization[] | undefined,
    profilesMap: Map<string, ProfileWithMemberships>,
  ) => {
    const userIds = Array.from(selectedMemberIds);

    // Optimistically update cache for members
    if (previousData) {
      queryClient.setQueryData<Organization[]>(['organizations'], (old) => {
        if (!old) return old;

        return old.map((org) => {
          if (type === 'organization' && org.id === id) {
            const newMembers = buildMemberObjects(userIds, profilesMap);

            return {
              ...org,
              members: newMembers.length > 0 ? newMembers : undefined,
              members_count: newMembers.length,
              member_ids: userIds.length > 0 ? userIds : undefined,
            };
          } else if (type === 'team' && org.id === organizationId) {
            const updatedTeams = org.teams?.map((team) => {
              if (team.id === id) {
                const newMembers = buildMemberObjects(userIds, profilesMap);

                return {
                  ...team,
                  members: newMembers.length > 0 ? newMembers : undefined,
                  members_count: newMembers.length,
                  member_ids: userIds.length > 0 ? userIds : undefined,
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

      queryClient.invalidateQueries({
        queryKey: ['organizations'],
      });
      queryClient.invalidateQueries({
        queryKey: ['profiles-with-memberships'],
      });

      onSuccess();
    } else if (!result.success) {
      // Rollback on error
      if (previousData) {
        queryClient.setQueryData(['organizations'], previousData);
      }
      toast.error(result.error || 'Failed to update members');
    }
  };

  const handleSave = async () => {
    if (!hasChanges || isSaving) return;

    setIsSaving(true);

    const previousData = queryClient.getQueryData<Organization[]>([
      'organizations',
    ]);

    const profilesMap = new Map(
      profilesData?.success && profilesData.data
        ? profilesData.data.map((p) => [p.id, p])
        : [],
    );

    try {
      if (selectedRole === 'admin') {
        await handlePhysiologistSave();
      } else {
        await handleMemberSave(previousData, profilesMap);
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
