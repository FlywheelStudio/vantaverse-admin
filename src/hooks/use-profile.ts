'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuthProfile } from '@/app/(authenticated)/auth/actions';
import type { Profile } from '@/lib/supabase/schemas/profiles';

export function useProfile() {
  return useQuery<Profile | null, Error>({
    queryKey: ['profile', 'auth'],
    queryFn: async () => {
      const result = await getAuthProfile();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  });
}
