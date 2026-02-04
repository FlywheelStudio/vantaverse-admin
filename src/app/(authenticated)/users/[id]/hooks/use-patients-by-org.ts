'use client';

import { useQuery } from '@tanstack/react-query';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import { getPatientsByOrganization } from '../actions';

type Patient = Pick<
  ProfileWithStats,
  'id' | 'first_name' | 'last_name' | 'email' | 'avatar_url'
>;

export function usePatientsByOrganization(organizationId: string | null) {
  return useQuery<Patient[], Error>({
    queryKey: ['patients', 'organization', organizationId],
    queryFn: async () => {
      if (!organizationId) return [];
      const result = await getPatientsByOrganization(organizationId);
      if (!result.success) {
        throw new Error(result.error);
      }
      return result.data;
    },
    enabled: !!organizationId,
  });
}
