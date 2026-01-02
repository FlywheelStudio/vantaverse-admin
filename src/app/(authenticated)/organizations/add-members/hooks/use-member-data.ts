import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  getAllProfilesWithMemberships,
  getOrganizationMemberUserIds,
} from '../../actions';
import { getTeamMemberUserIds } from '../../teams-actions';

export function useMemberData(
  open: boolean,
  type: 'organization' | 'team',
  id: string,
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

  const initialMemberIds = useMemo(() => {
    if (currentMembersData?.success && currentMembersData.data) {
      return new Set(currentMembersData.data);
    }
    return new Set<string>();
  }, [currentMembersData]);

  return {
    profilesData,
    profilesLoading,
    membersLoading,
    initialMemberIds,
  };
}
