'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getOrganizations,
  getOrganizationById,
} from '@/app/(authenticated)/groups/actions';
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

export function useOrganization(id: string | null | undefined) {
  return useQuery<Organization | null, Error>({
    queryKey: ['organization', id],
    queryFn: async () => {
      if (!id) return null;
      const result = await getOrganizationById(id);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!id,
  });
}
