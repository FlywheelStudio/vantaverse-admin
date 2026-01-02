'use client';

import { useQuery } from '@tanstack/react-query';
import { getUsersWithStats } from '@/app/(authenticated)/users/actions';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

export function useUsers(filters?: {
  organization_id?: string;
  team_id?: string;
  journey_phase?: string;
}) {
  // Normalize undefined to null for stable queryKey serialization
  const orgId = filters?.organization_id ?? null;
  const teamId = filters?.team_id ?? null;
  const journeyPhase = filters?.journey_phase ?? null;

  const queryKey = ['users', orgId, teamId, journeyPhase];

  return useQuery<ProfileWithStats[], Error>({
    queryKey,
    queryFn: async () => {
      const result = await getUsersWithStats(filters);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}
