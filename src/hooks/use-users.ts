'use client';

import { useQuery } from '@tanstack/react-query';
import { getUsersWithStats } from '@/app/(authenticated)/users/actions';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';

export function useUsers(filters?: {
  organization_id?: string;
  team_id?: string;
  journey_phase?: string;
}) {
  return useQuery<ProfileWithStats[], Error>({
    queryKey: ['users', filters],
    queryFn: async () => {
      const result = await getUsersWithStats(filters);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  });
}
