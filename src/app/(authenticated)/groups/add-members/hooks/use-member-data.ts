import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAllProfilesWithMemberships,
  getOrganizationMemberUserIds,
  getCurrentPhysiologist,
} from '../../actions';
import { getTeamMemberUserIds } from '../../teams-actions';

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
    queryKey: [type === 'organization' ? 'org-members' : 'team-members', id],
    queryFn: () =>
      type === 'organization'
        ? getOrganizationMemberUserIds(id)
        : getTeamMemberUserIds(id),
    enabled: open,
  });

  // Get current physiologist (only for organizations)
  const orgIdForPhysiologist = type === 'organization' ? id : organizationId;
  const { data: currentPhysiologistData } = useQuery({
    queryKey: ['current-physiologist', orgIdForPhysiologist],
    queryFn: () => getCurrentPhysiologist(orgIdForPhysiologist!),
    enabled: open && !!orgIdForPhysiologist && type === 'organization',
  });

  const initialMemberIds = useMemo(() => {
    if (currentMembersData?.success && currentMembersData.data) {
      return new Set(currentMembersData.data);
    }
    return new Set<string>();
  }, [currentMembersData]);

  const initialPhysiologistId = useMemo(() => {
    if (
      currentPhysiologistData?.success &&
      currentPhysiologistData.data?.userId
    ) {
      return currentPhysiologistData.data.userId;
    }
    return null;
  }, [currentPhysiologistData]);

  return {
    profilesData,
    profilesLoading,
    membersLoading,
    initialMemberIds,
    initialPhysiologistId,
    currentPhysiologist: currentPhysiologistData?.success
      ? currentPhysiologistData.data
      : null,
  };
}
