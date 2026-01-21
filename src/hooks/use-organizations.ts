'use client';

import { useQuery, queryOptions } from '@tanstack/react-query';
import {
  getOrganizations,
  getOrganizationById,
} from '@/app/(authenticated)/groups/actions';
import type { Organization } from '@/lib/supabase/schemas/organizations';

export function useOrganizations(initialData?: Organization[]) {
  return useQuery<Organization[], Error>({
    queryKey: ['organizations'],
    queryFn: async () => {
      const result = await getOrganizations();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    ...(initialData !== undefined && { initialData }),
  });
}

/**
 * Query options factory for organization detail
 */
export function organizationQueryOptions(
  id: string | null | undefined,
  initialData?: Organization | null,
) {
  return queryOptions({
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
    staleTime: 60 * 1000, // 60 seconds
    gcTime: 5 * 60 * 1000, // 5 minutes
    ...(initialData !== undefined && initialData !== null && { initialData }),
  });
}

export function useOrganization(
  id: string | null | undefined,
  initialData?: Organization | null,
) {
  return useQuery(organizationQueryOptions(id, initialData));
}
