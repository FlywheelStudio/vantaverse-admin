'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getAdminsFiltered,
  getAdminFilterCounts,
  getAdminProfileById,
} from '@/app/(authenticated)/manage/actions';
import type { AdminFilterCounts, AdminProfile } from '@/lib/supabase/schemas/admins';

export interface AdminsQueryFilters {
  search?: string;
  organization_id?: string;
  team_id?: string;
  status?: string;
  lastActive?: string;
  joined?: string;
}

/** Admins via `list_admins_filtered`. */
export function useAdminsFiltered(
  filters: AdminsQueryFilters = {},
  initialData?: AdminProfile[],
) {
  const queryKey = [
    'admins-filtered',
    filters.search ?? null,
    filters.organization_id ?? null,
    filters.team_id ?? null,
    filters.status ?? null,
    filters.lastActive ?? null,
    filters.joined ?? null,
  ];

  return useQuery<AdminProfile[], Error>({
    queryKey,
    queryFn: async () => {
      const result = await getAdminsFiltered({
        search: filters.search,
        organizationId: filters.organization_id,
        teamId: filters.team_id,
        status: filters.status,
        lastActive: filters.lastActive,
        joined: filters.joined,
        pageSize: 500,
      });

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data.data;
    },
    initialData,
  });
}

/** Facet counts for admin filters. */
export function useAdminFilterCounts(initialData?: AdminFilterCounts) {
  return useQuery<AdminFilterCounts, Error>({
    queryKey: ['admin-filter-counts'],
    queryFn: async () => {
      const result = await getAdminFilterCounts();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    initialData,
  });
}

export function useAdminProfile(id: string | null | undefined) {
  return useQuery<AdminProfile | null, Error>({
    queryKey: ['admin-profile', id],
    queryFn: async () => {
      if (!id) return null;
      const result = await getAdminProfileById(id);

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    enabled: !!id,
  });
}
