import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAllProfilesWithMemberships,
  getOrganizationMemberUserIds,
  getCurrentPhysiologist,
} from '../../actions';
import { getTeamMemberUserIds } from '../../teams-actions';
import { groupsKeys } from '../../[id]/hooks/use-group-mutations';

export function useMemberData(
  open: boolean,
  type: 'organization' | 'team',
  id: string,
  organizationId?: string,
) {
  const { data: profilesData, isLoading: profilesLoading } = useQuery({
    queryKey: ['profiles-with-memberships'],
    queryFn: getAllProfilesWithMemberships,
    enabled: open,
  });

  const { data: currentMembersData, isLoading: membersLoading } = useQuery({
    queryKey:
      type === 'organization'
        ? groupsKeys.memberIds(id)
        : groupsKeys.teamMembers(id),
    queryFn: async () => {
      const result =
        type === 'organization'
          ? await getOrganizationMemberUserIds(id)
          : await getTeamMemberUserIds(id);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: open,
  });

  // Get current physiologist (only for organizations)
  const orgIdForPhysiologist = type === 'organization' ? id : organizationId;
  const { data: currentPhysiologistData } = useQuery({
    queryKey: groupsKeys.physiologist(orgIdForPhysiologist),
    queryFn: async () => {
      const result = await getCurrentPhysiologist(orgIdForPhysiologist!);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: open && !!orgIdForPhysiologist && type === 'organization',
  });

  const initialMemberIds = useMemo(() => {
    if (currentMembersData) {
      return new Set(currentMembersData);
    }
    return new Set<string>();
  }, [currentMembersData]);

  const initialPhysiologistId = useMemo(() => {
    if (currentPhysiologistData?.userId) {
      return currentPhysiologistData.userId;
    }
    return null;
  }, [currentPhysiologistData]);

  return {
    profilesData,
    profilesLoading,
    membersLoading,
    initialMemberIds,
    initialPhysiologistId,
    currentPhysiologist: currentPhysiologistData || null,
  };
}
