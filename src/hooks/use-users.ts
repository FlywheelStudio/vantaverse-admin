'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getUsersWithStats,
  getUserProfileById,
  getMembersFiltered,
  getMemberFilterCounts,
} from '@/app/(authenticated)/users/actions';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { MemberRole } from '@/lib/supabase/schemas/organization-members';
import type {
  ListProfilesFilteredInput,
  MemberFilterCounts,
} from '@/lib/supabase/queries/profiles';

export function useUsers(
  filters?: {
    organization_id?: string;
    team_id?: string;
    journey_phase?: string;
    role?: MemberRole;
  },
  initialData?: ProfileWithStats[],
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
  });
}

export interface MembersQueryFilters extends ListProfilesFilteredInput {
  organization_id?: string;
  team_id?: string;
}

/** Members fetched through the `list_profiles_filtered` RPC. */
export function useMembersFiltered(filters: MembersQueryFilters, initialData?: ProfileWithStats[]) {
  const queryKey = [
    'members-filtered',
    filters.search ?? null,
    filters.role ?? null,
    filters.organization_id ?? null,
    filters.team_id ?? null,
    filters.status ?? null,
    filters.program ?? null,
    filters.physiologist ?? null,
    filters.lastActive ?? null,
    filters.joined ?? null,
    filters.due ?? null,
  ];

  return useQuery<ProfileWithStats[], Error>({
    queryKey,
    queryFn: async () => {
      const result = await getMembersFiltered({
        search: filters.search,
        role: filters.role,
        organizationId: filters.organization_id,
        teamId: filters.team_id,
        status: filters.status,
        program: filters.program,
        physiologist: filters.physiologist,
        lastActive: filters.lastActive,
        joined: filters.joined,
        due: filters.due,
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

/** Facet counts for the members filter panel. */
export function useMemberFilterCounts(initialData?: MemberFilterCounts) {
  return useQuery<MemberFilterCounts, Error>({
    queryKey: ['member-filter-counts'],
    queryFn: async () => {
      const result = await getMemberFilterCounts();

      if (!result.success) {
        throw new Error(result.error);
      }

      return result.data;
    },
    initialData,
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
