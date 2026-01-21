'use client';

import { useQuery } from '@tanstack/react-query';
import { getUsersWithStats, getUserProfileById } from '@/app/(authenticated)/users/actions';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';

export function useUsers(
  filters?: {
    organization_id?: string;
    team_id?: string;
    journey_phase?: string;
    role?: MemberRole;
  },
  initialData?: ProfileWithStats[]
) {
  // Normalize undefined to null for stable queryKey serialization
  const orgId = filters?.organization_id ?? null;
  const teamId = filters?.team_id ?? null;
  const journeyPhase = filters?.journey_phase ?? null;
  const role = filters?.role ?? null;

  const queryKey = ['users', orgId, teamId, journeyPhase, role];

  return useQuery<ProfileWithStats[], Error>({
    queryKey,
    queryFn: async () => {
      const result = await getUsersWithStats(filters);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    initialData,
    staleTime: 0,
    gcTime: 5 * 60 * 1000, // 5 minutes
  });
}

export function useUserProfile(id: string | null | undefined) {
  return useQuery<ProfileWithStats | null, Error>({
    queryKey: ['user-profile', id],
    queryFn: async () => {
      if (!id) return null;
      const result = await getUserProfileById(id);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!id,
  });
}
