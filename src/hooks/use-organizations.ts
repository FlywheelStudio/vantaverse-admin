'use client';

import { useQuery } from '@tanstack/react-query';
import { getOrganizations } from '@/app/(authenticated)/groups/actions';
import type { Organization } from '@/lib/supabase/schemas/organizations';

export function useOrganizations() {
  return useQuery<Organization[], Error>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const result = await getOrganizations();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
  });
}
