import { useMemo } from 'react';
import {
  useAddOrganizationMembers,
  useAddTeamMembers,
  useAssignPhysiologist,
} from './use-add-members-mutations';
import type { ProfileWithMemberships } from '@/lib/supabase/queries/profiles';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';

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
  const addOrganizationMembers = useAddOrganizationMembers(id);
  const addTeamMembers = useAddTeamMembers(
    id,
    organizationId || '',
  );
  const assignPhysiologist = useAssignPhysiologist(id);

  const profilesMap = useMemo(
    () =>
      new Map(
        profilesData?.success && profilesData.data
          ? profilesData.data.map((p) => [p.id, p])
          : [],
      ),
    [profilesData],
  );

  const handleSave = async () => {
    if (!hasChanges) return;

    if (selectedRole === 'admin') {
      if (type !== 'organization' || !selectedPhysiologistId) {
        return;
      }

      assignPhysiologist.mutate(selectedPhysiologistId, {
        onSuccess: () => {
          onSuccess();
        },
      });
    } else {
      const userIds = Array.from(selectedMemberIds);

      if (type === 'organization') {
        addOrganizationMembers.mutate(
          {
            userIds,
            profilesMap,
            name,
          },
          {
            onSuccess: () => {
              onSuccess();
            },
          },
        );
      } else {
        if (!organizationId) return;

        addTeamMembers.mutate(
          {
            userIds,
            profilesMap,
            name,
          },
          {
            onSuccess: () => {
              onSuccess();
            },
          },
        );
      }
    }
  };

  const isPending =
    addOrganizationMembers.isPending ||
    addTeamMembers.isPending ||
    assignPhysiologist.isPending;

  return {
    handleSave,
    isPending,
  };
}
