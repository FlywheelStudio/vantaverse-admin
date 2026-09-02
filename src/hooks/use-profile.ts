'use client';

import { useQuery } from '@tanstack/react-query';
import { getAuthProfile } from '@/app/(authenticated)/auth/actions';
import type { AdminProfile } from '@/lib/supabase/schemas/admins';

export function useProfile() {
  return useQuery<AdminProfile | null, Error>({
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
