'use client';

import { useQuery } from '@tanstack/react-query';
import { getTeamsByOrganizationId } from '@/app/(authenticated)/groups/teams-actions';
import type { Team } from '@/lib/supabase/schemas/teams';

/**
 * Query hook for fetching teams by organization ID
 */
export function useTeamsByOrganizationId(
  organizationId: string | null | undefined,
) {
  // Normalize undefined to null for stable queryKey serialization
  const orgId = organizationId ?? null;

  return useQuery<Team[], Error>({
    queryKey: ['teams', orgId],
    queryFn: async () => {
      if (!orgId) {
        throw new Error('Organization ID is required');
      }

      const result = await getTeamsByOrganizationId(orgId);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!orgId,
    staleTime: 60 * 1000, // 1 minute
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
