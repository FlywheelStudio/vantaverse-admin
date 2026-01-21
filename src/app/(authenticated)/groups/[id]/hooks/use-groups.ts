'use client';

import { useQuery, queryOptions } from '@tanstack/react-query';
import {
  getOrganizationMembersWithPrograms,
  type GroupMemberWithProgram,
} from '../actions';
import { getCurrentPhysiologist } from '@/app/(authenticated)/groups/actions';
import { groupsKeys } from './use-group-mutations';

export type PhysicianInfo = {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  description: string | null;
};

/**
 * Query options factory for group members
 */
function groupMembersQueryOptions(
  organizationId: string | null | undefined,
  initialData?: GroupMemberWithProgram[],
) {
  return queryOptions({
    queryKey: groupsKeys.members(organizationId),
    queryFn: async () => {
      if (!organizationId) return [];
      const result = await getOrganizationMembersWithPrograms(organizationId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...(initialData !== undefined && { initialData }),
  });
}

/**
 * Query hook for group members
 */
export function useGroupMembers(
  organizationId: string | null | undefined,
  initialData?: GroupMemberWithProgram[],
) {
  return useQuery(groupMembersQueryOptions(organizationId, initialData));
}

/**
 * Query options factory for group physiologist
 */
function groupPhysiologistQueryOptions(
  organizationId: string | null | undefined,
  initialData?: PhysicianInfo | null,
) {
  return queryOptions({
    queryKey: groupsKeys.physiologist(organizationId),
    queryFn: async () => {
      if (!organizationId) return null;
      const result = await getCurrentPhysiologist(organizationId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!organizationId,
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...(initialData !== undefined && { initialData }),
  });
}

/**
 * Query hook for group physiologist
 */
export function useGroupPhysiologist(
  organizationId: string | null | undefined,
  initialData?: PhysicianInfo | null,
) {
  return useQuery(groupPhysiologistQueryOptions(organizationId, initialData));
}
