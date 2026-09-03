import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import {
  defineMutation,
  defineQuery,
  formatDalError,
  mutate,
  query,
  type DalResult,
} from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import type { Database } from '@/lib/supabase/database.types';
import { createAdminClient } from '@/lib/supabase/core/admin';
import { createClient } from '@/lib/supabase/core/server';
import {
  profileSchema,
  profileWithStatsSchema,
  type Profile,
  type ProfileWithStats,
} from '../schemas/profiles';
import { MemberRole } from '../schemas/organization-members';
import type { SupabaseError, SupabaseSuccess } from '../query';
import type { PaginatedResult } from './exercise-templates';

export type SetOnboardingStateTarget = 'screening' | 'consultation';

/** Shape returned by the `get_member_filter_counts` RPC. */
export interface MemberFilterCounts {
  roles: { patient: number; admin: number };
  status: {
    pending: number;
    invited: number;
    active: number;
    assigned: number;
  };
  program: {
    on_program: number;
    completed: number;
    pre_program: number;
    not_assigned: number;
  };
  physiologists: Array<{ name: string; count: number }>;
  unassigned_physiologist: number;
}

export type SetOnboardingStateResult = void;

export type ProfileWithMemberships = Profile & {
  orgMemberships: Array<{
    orgId: string;
    orgName: string;
    role: MemberRole;
  }>;
  teamMemberships: Array<{
    teamId: string;
    teamName: string;
    orgId: string;
    orgName: string;
  }>;
};

export type ListProfilesWithStatsInput = {
  organization_id?: string;
  team_id?: string;
  journey_phase?: string;
  role?: MemberRole;
};

export type ListProfilesFilteredInput = {
  search?: string;
  role?: 'patient' | 'admin';
  organizationId?: string;
  teamId?: string;
  status?: string;
  program?: string;
  physiologist?: string | null;
  lastActive?: string;
  joined?: string;
  due?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

const profileListSchema = profileWithStatsSchema.array();
const paginatedProfileWithStatsSchema = z.object({
  data: profileListSchema,
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
});

const memberFilterCountsSchema = z.object({
  roles: z.object({ patient: z.number(), admin: z.number() }),
  status: z.object({
    pending: z.number(),
    invited: z.number(),
    active: z.number(),
    assigned: z.number(),
  }),
  program: z.object({
    on_program: z.number(),
    completed: z.number(),
    pre_program: z.number(),
    not_assigned: z.number(),
  }),
  physiologists: z.array(z.object({ name: z.string(), count: z.number() })),
  unassigned_physiologist: z.number(),
});

const importProfileRowSchema = z.object({
  id: z.string(),
  email: z.string().nullable(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  status: z.string().nullable(),
});

const importProfileRowListSchema = z.array(importProfileRowSchema);
const emailSetSchema = z.set(z.string());
const idResultSchema = z.object({ id: z.string() });

const updateProfileInputSchema = z.object({
  id: z.string().uuid(),
  profileData: z.object({
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileInputSchema>;

const deleteAuthUserInputSchema = z.object({
  id: z.string().uuid(),
});

const setOnboardingStateInputSchema = z.object({
  userId: z.string().uuid(),
  target: z.enum(['screening', 'consultation']),
});

const createQuickAddInputSchema = z.object({
  email: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  organizationId: z.string().optional(),
  teamId: z.string().optional(),
  role: z.enum(['patient', 'admin']).optional(),
});

export type CreateQuickAddInput = z.infer<typeof createQuickAddInputSchema>;

export const profileKeys = {
  all: ['profiles'] as const,
  authProfile: () => [...profileKeys.all, 'auth-profile'] as const,
  detail: (id: string) => [...profileKeys.all, 'detail', id] as const,
  withStats: (filters: ListProfilesWithStatsInput) =>
    [...profileKeys.all, 'with-stats', filters] as const,
  filtered: (params: ListProfilesFilteredInput) =>
    [...profileKeys.all, 'filtered', params] as const,
  filterCounts: () => [...profileKeys.all, 'filter-counts'] as const,
  importEmails: () => [...profileKeys.all, 'import-emails'] as const,
  byEmails: (emails: string[]) =>
    [...profileKeys.all, 'by-emails', ...[...emails].sort()] as const,
};

type OrgMemberWithRole = {
  user_id: string;
  organization_id: string;
  role: MemberRole;
  organizations: {
    id: string;
    name: string;
  } | null;
};

type RawOrgMember = {
  organization_id: string;
  role: MemberRole;
  organizations: {
    id: string;
    name: string;
  } | null;
};

type RawTeamMember = {
  team_id: string;
  teams: {
    id: string;
    name: string;
    organization_id: string;
    organizations: {
      id: string;
      name: string;
    } | null;
  } | null;
};

type RawProfile = Profile & {
  organization_members: RawOrgMember[] | null;
  team_membership: RawTeamMember[] | null;
};

function toLegacyResult<T>(
  result: DalResult<T>,
): SupabaseSuccess<T> | SupabaseError {
  const [err, data] = result;
  if (err) {
    return { success: false, error: formatDalError(err) };
  }
  return { success: true, data };
}

async function getUnassignedUserIds(
  client: SupabaseClient<Database>,
): Promise<string[]> {
  const { data: allProfiles } = await client.from('profiles').select('id');

  const { data: allOrgMembers } = await client
    .from('organization_members')
    .select('user_id')
    .eq('is_active', true);

  if (!allProfiles) return [];

  const orgMemberIds = new Set(
    allOrgMembers ? allOrgMembers.map((m) => m.user_id) : [],
  );

  return allProfiles.map((p) => p.id).filter((id) => !orgMemberIds.has(id));
}

async function buildUserIdFilters(
  client: SupabaseClient<Database>,
  filters?: ListProfilesWithStatsInput,
): Promise<string[] | null> {
  let userIds: string[] | null = null;

  if (filters?.role) {
    if (filters.role === 'patient' && !filters?.organization_id) {
      const { data: orgMembersByRole } = await client
        .from('organization_members')
        .select('user_id')
        .eq('role', filters.role)
        .eq('is_active', true);

      const patientUserIds = orgMembersByRole
        ? orgMembersByRole.map((m) => m.user_id)
        : [];

      const unassignedUserIds = await getUnassignedUserIds(client);
      userIds = [...new Set([...patientUserIds, ...unassignedUserIds])];

      if (userIds.length === 0) {
        return null;
      }
    } else {
      const { data: orgMembersByRole } = await client
        .from('organization_members')
        .select('user_id')
        .eq('role', filters.role)
        .eq('is_active', true);

      if (orgMembersByRole && orgMembersByRole.length > 0) {
        userIds = orgMembersByRole.map((m) => m.user_id);
      } else {
        return null;
      }
    }
  }

  if (filters?.organization_id) {
    let orgMembersQuery = client
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', filters.organization_id)
      .eq('is_active', true);

    if (filters?.role) {
      orgMembersQuery = orgMembersQuery.eq('role', filters.role);
    }

    const { data: orgMembers } = await orgMembersQuery;

    if (orgMembers && orgMembers.length > 0) {
      const orgUserIds = orgMembers.map((m) => m.user_id);
      userIds = userIds
        ? userIds.filter((id) => orgUserIds.includes(id))
        : orgUserIds;

      if (userIds.length === 0) {
        return null;
      }
    } else {
      return null;
    }
  }

  if (filters?.team_id) {
    const { data: teamMembers } = await client
      .from('team_membership')
      .select('user_id')
      .eq('team_id', filters.team_id);

    if (teamMembers && teamMembers.length > 0) {
      const teamUserIds = teamMembers.map((m) => m.user_id);
      userIds = userIds
        ? userIds.filter((id) => teamUserIds.includes(id))
        : teamUserIds;

      if (userIds.length === 0) {
        return null;
      }
    } else {
      return null;
    }
  }

  return userIds;
}

async function getSuperAdminData(
  client: SupabaseClient<Database>,
): Promise<{
  data: { orgId: string | undefined; userIds: Set<string> } | null;
  error: { message: string } | null;
}> {
  const { data: superAdminOrg, error: orgError } = await client
    .from('organizations')
    .select('id')
    .eq('is_super_admin', true)
    .maybeSingle();

  if (orgError) return { data: null, error: orgError };

  const superAdminOrgId = superAdminOrg?.id;
  const superAdminUserIds = new Set<string>();

  if (superAdminOrgId) {
    const { data: superAdminMembers, error: membersError } = await client
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', superAdminOrgId)
      .eq('is_active', true);

    if (membersError) return { data: null, error: membersError };

    superAdminMembers?.forEach((m) => superAdminUserIds.add(m.user_id));
  }

  return {
    data: { orgId: superAdminOrgId, userIds: superAdminUserIds },
    error: null,
  };
}

async function getOrganizationMemberships(
  client: SupabaseClient<Database>,
  profileIds: string[],
): Promise<{
  data: {
    orgMembershipsMap: Map<string, Array<{ orgId: string; orgName: string }>>;
    userRoleMap: Map<string, MemberRole>;
  } | null;
  error: { message: string } | null;
}> {
  const { data: orgMembersData, error } = await client
    .from('organization_members')
    .select('user_id, organization_id, role, organizations!inner(id, name)')
    .in('user_id', profileIds)
    .eq('is_active', true);

  if (error) return { data: null, error };

  const orgMembershipsMap = new Map<
    string,
    Array<{ orgId: string; orgName: string }>
  >();
  const userRoleMap = new Map<string, MemberRole>();

  (orgMembersData as unknown as OrgMemberWithRole[] | null)?.forEach((om) => {
    if (om.organizations) {
      if (!orgMembershipsMap.has(om.user_id)) {
        orgMembershipsMap.set(om.user_id, []);
      }
      orgMembershipsMap.get(om.user_id)!.push({
        orgId: om.organization_id,
        orgName: om.organizations.name,
      });
    }
    if (om.role && !userRoleMap.has(om.user_id)) {
      userRoleMap.set(om.user_id, om.role);
    }
  });

  return { data: { orgMembershipsMap, userRoleMap }, error: null };
}

function enrichProfilesWithMetadata(
  profiles: unknown[],
  superAdminUserIds: Set<string>,
  orgMembershipsMap: Map<string, Array<{ orgId: string; orgName: string }>>,
  userRoleMap: Map<string, MemberRole>,
): unknown[] {
  return profiles.map((profile) => {
    const profileRecord = profile as Record<string, unknown>;
    const userId = profileRecord.id as string;
    const role = userRoleMap.get(userId);
    const inferredRole =
      role || (superAdminUserIds.has(userId) ? 'admin' : 'patient');

    return {
      ...profileRecord,
      is_super_admin: superAdminUserIds.has(userId),
      orgMemberships: orgMembershipsMap.get(userId) || [],
      role: inferredRole,
    };
  });
}

async function queryProfilesWithFilters(
  client: SupabaseClient<Database>,
  userIds: string[] | null,
  filters?: { journey_phase?: string },
): Promise<{ data: unknown[] | null; error: { message: string } | null }> {
  let request = client.from('profiles_with_stats').select('*');

  if (userIds) {
    request = request.in('id', userIds);
  }

  if (filters?.journey_phase) {
    request = request.eq(
      'journey_phase',
      filters.journey_phase as NonNullable<Profile['journey_phase']>,
    );
  }

  const { data, error } = await request.order('created_at', {
    ascending: false,
  });

  if (error) return { data: null, error };
  return { data: data ?? [], error: null };
}

async function fetchListWithStats(
  client: SupabaseClient<Database>,
  filters?: ListProfilesWithStatsInput,
): Promise<{ data: ProfileWithStats[] | null; error: { message: string } | null }> {
  const userIds = await buildUserIdFilters(client, filters);

  if (userIds === null) {
    return { data: [], error: null };
  }

  const profilesResult = await queryProfilesWithFilters(client, userIds, filters);
  if (profilesResult.error) return { data: null, error: profilesResult.error };

  const profiles = profilesResult.data ?? [];
  if (profiles.length === 0) {
    return { data: [], error: null };
  }

  const profileIds = profiles.map(
    (p) => (p as Record<string, unknown>).id as string,
  );

  const [superAdminResult, membershipsResult] = await Promise.all([
    getSuperAdminData(client),
    getOrganizationMemberships(client, profileIds),
  ]);

  if (superAdminResult.error) return { data: null, error: superAdminResult.error };
  if (membershipsResult.error) return { data: null, error: membershipsResult.error };
  if (!superAdminResult.data || !membershipsResult.data) {
    return { data: null, error: { message: 'Failed to enrich profiles' } };
  }

  const enrichedProfiles = enrichProfilesWithMetadata(
    profiles,
    superAdminResult.data.userIds,
    membershipsResult.data.orgMembershipsMap,
    membershipsResult.data.userRoleMap,
  );

  const parsed = profileWithStatsSchema.array().safeParse(enrichedProfiles);
  if (!parsed.success) {
    return { data: null, error: { message: 'Response validation failed' } };
  }

  return { data: parsed.data, error: null };
}

async function fetchListFiltered(
  client: SupabaseClient<Database>,
  params: ListProfilesFilteredInput,
): Promise<{
  data: PaginatedResult<ProfileWithStats> | null;
  error: { message: string } | null;
}> {
  const { data, error } = await client.rpc('list_profiles_filtered', {
    p_search: params.search || undefined,
    p_role: params.role ?? 'patient',
    p_org_id: params.organizationId || undefined,
    p_team_id: params.teamId || undefined,
    p_status: params.status || 'all',
    p_program: params.program || 'all',
    p_physiologist: params.physiologist || undefined,
    p_last_active: params.lastActive || 'all',
    p_joined: params.joined || 'all',
    p_due: params.due || 'all',
    p_page: params.page ?? 1,
    p_page_size: params.pageSize ?? 500,
    p_sort_by: params.sortBy ?? 'created_at',
    p_sort_order: params.sortOrder ?? 'desc',
  });

  if (error) return { data: null, error };

  const payload = (data as { data: unknown[]; count: number }) || {
    data: [],
    count: 0,
  };

  const rows = payload.data ?? [];
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 500;
  const total = payload.count ?? 0;

  if (rows.length === 0) {
    return {
      data: {
        data: [],
        page,
        pageSize,
        total,
        hasMore: false,
      },
      error: null,
    };
  }

  const profileIds = rows.map(
    (row) => (row as Record<string, unknown>).id as string,
  );

  const [superAdminResult, membershipsResult] = await Promise.all([
    getSuperAdminData(client),
    getOrganizationMemberships(client, profileIds),
  ]);

  if (superAdminResult.error) return { data: null, error: superAdminResult.error };
  if (membershipsResult.error) return { data: null, error: membershipsResult.error };
  if (!superAdminResult.data || !membershipsResult.data) {
    return { data: null, error: { message: 'Failed to enrich profiles' } };
  }

  const enrichedProfiles = enrichProfilesWithMetadata(
    rows,
    superAdminResult.data.userIds,
    membershipsResult.data.orgMembershipsMap,
    membershipsResult.data.userRoleMap,
  );

  const parsed = profileWithStatsSchema.array().safeParse(enrichedProfiles);
  if (!parsed.success) {
    return { data: null, error: { message: 'Response validation failed' } };
  }

  return {
    data: {
      data: parsed.data,
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    },
    error: null,
  };
}

async function fetchProfileById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<{ data: ProfileWithStats | null; error: { message: string } | null }> {
  const { data, error } = await client
    .from('profiles_with_stats')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return { data: null, error };

  if (!data) {
    return { data: null, error: { message: 'User not found' } };
  }

  const { data: orgMemberData, error: orgMemberError } = await client
    .from('organization_members')
    .select('role')
    .eq('user_id', id)
    .limit(1)
    .maybeSingle();

  const role =
    !orgMemberError && orgMemberData?.role ? orgMemberData.role : undefined;

  const parsed = profileWithStatsSchema.safeParse({ ...data, role });
  if (!parsed.success) {
    return { data: null, error: { message: 'Response validation failed' } };
  }

  return { data: parsed.data, error: null };
}

async function fetchAllEmailsForImport(
  client: SupabaseClient<Database>,
): Promise<{ data: Set<string> | null; error: { message: string } | null }> {
  const [
    { data: patientEmails, error: patientError },
    { data: adminEmails, error: adminError },
  ] = await Promise.all([
    client.from('profiles').select('email'),
    client.from('profiles_admins').select('email'),
  ]);

  if (patientError) return { data: null, error: patientError };
  if (adminError) return { data: null, error: adminError };

  const emailSet = new Set<string>();
  for (const profile of [...(patientEmails ?? []), ...(adminEmails ?? [])]) {
    if (profile.email) {
      emailSet.add(profile.email.toLowerCase());
    }
  }

  return { data: emailSet, error: null };
}

async function fetchByEmailsForImport(
  client: SupabaseClient<Database>,
  emails: string[],
): Promise<{
  data: z.infer<typeof importProfileRowListSchema> | null;
  error: { message: string } | null;
}> {
  if (emails.length === 0) {
    return { data: [], error: null };
  }

  const [
    { data: patients, error: patientError },
    { data: admins, error: adminError },
  ] = await Promise.all([
    client
      .from('profiles')
      .select('id, email, first_name, last_name, status')
      .in('email', emails),
    client
      .from('profiles_admins')
      .select('id, email, first_name, last_name, status')
      .in('email', emails),
  ]);

  if (patientError) return { data: null, error: patientError };
  if (adminError) return { data: null, error: adminError };

  const byEmail = new Map<string, z.infer<typeof importProfileRowSchema>>();
  for (const row of [...(patients ?? []), ...(admins ?? [])]) {
    const key = (row.email ?? '').toLowerCase();
    if (key && !byEmail.has(key)) {
      byEmail.set(key, row);
    }
  }

  return { data: [...byEmail.values()], error: null };
}

/** Profiles with stats and optional org/team/role filters (service role). */
export const listProfilesWithStatsQuery = defineQuery({
  key: (filters: ListProfilesWithStatsInput = {}) =>
    profileKeys.withStats(filters),
  schema: profileListSchema,
  client: 'admin',
  execute: (client, filters: ListProfilesWithStatsInput = {}) =>
    fetchListWithStats(client, filters),
});

/** Paginated members via `list_profiles_filtered` (RLS). */
export const listProfilesFilteredQuery = defineQuery({
  key: (params: ListProfilesFilteredInput = {}) =>
    profileKeys.filtered(params),
  schema: paginatedProfileWithStatsSchema,
  execute: (client, params: ListProfilesFilteredInput = {}) =>
    fetchListFiltered(client, params),
});

/** Facet counts via `get_member_filter_counts` (RLS). */
export const getMemberFilterCountsQuery = defineQuery({
  key: profileKeys.filterCounts,
  schema: memberFilterCountsSchema,
  execute: async (client) => {
    const { data, error } = await client.rpc('get_member_filter_counts');
    if (error) return { data: null, error };

    const parsed = memberFilterCountsSchema.safeParse(data);
    if (!parsed.success) {
      return { data: null, error: { message: 'Response validation failed' } };
    }

    return { data: parsed.data, error: null };
  },
});

/** Profile with stats by id (RLS). */
export const getProfileByIdQuery = defineQuery({
  key: profileKeys.detail,
  schema: profileWithStatsSchema,
  execute: (client, id: string) => fetchProfileById(client, id),
});

/** All user emails for import validation (service role). */
export const getAllEmailsForImportQuery = defineQuery({
  key: profileKeys.importEmails,
  schema: emailSetSchema,
  client: 'admin',
  execute: (client) => fetchAllEmailsForImport(client),
});

/** Profiles by email list for import display (service role). */
export const getProfilesByEmailsForImportQuery = defineQuery({
  key: (emails: string[]) => profileKeys.byEmails(emails),
  schema: importProfileRowListSchema,
  client: 'admin',
  execute: (client, emails: string[]) => fetchByEmailsForImport(client, emails),
});

/** Update a profile row (service role). */
export const updateProfileMutation = defineMutation({
  inputSchema: updateProfileInputSchema,
  schema: profileSchema,
  client: 'admin',
  execute: async (client, input) => {
    const { data, error } = await client
      .from('profiles')
      .update({
        ...input.profileData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) return { data: null, error };
    if (!data) {
      return { data: null, error: { message: 'Failed to update profile' } };
    }

    return { data, error: null };
  },
  targets: (input) => [profileKeys.all, profileKeys.detail(input.id)],
});

/** Delete an auth user (service role). */
export const deleteAuthUserMutation = defineMutation({
  inputSchema: deleteAuthUserInputSchema,
  schema: idResultSchema,
  client: 'admin',
  execute: async (client, input) => {
    const { error } = await client.auth.admin.deleteUser(input.id);
    if (error) return { data: null, error };
    return { data: { id: input.id }, error: null };
  },
  targets: () => [profileKeys.all],
});

/** Set onboarding state via RPC (service role). */
export const setOnboardingStateMutation = defineMutation({
  inputSchema: setOnboardingStateInputSchema,
  schema: idResultSchema,
  client: 'admin',
  execute: async (client, input) => {
    type RpcArgs =
      Database['public']['Functions']['set_onboarding_state']['Args'];

    const { data, error } = await client.rpc('set_onboarding_state', {
      p_user_id: input.userId,
      p_target: input.target,
    } as RpcArgs);

    if (error) {
      return { data: null, error };
    }

    const payload = data as { success?: boolean; error?: { message: string } };
    if (payload?.success === false) {
      return {
        data: null,
        error: payload.error ?? { message: 'Failed to set onboarding state' },
      };
    }

    return { data: { id: input.userId }, error: null };
  },
  targets: (input) => [profileKeys.all, profileKeys.detail(input.userId)],
});

/** Create auth user + profile with optional org/team (service role). */
export const createQuickAddMutation = defineMutation({
  inputSchema: createQuickAddInputSchema,
  schema: idResultSchema,
  client: 'admin',
  execute: async (client, input) => {
    const { data: authUser, error: authError } =
      await client.auth.admin.createUser({
        email: input.email.toLowerCase().trim(),
        user_metadata: {
          first_name: input.firstName.trim(),
          last_name: input.lastName.trim(),
        },
        email_confirm: true,
      });

    if (authError || !authUser.user) {
      return {
        data: null,
        error: authError ?? { message: 'Failed to create auth user' },
      };
    }

    const userId = authUser.user.id;

    const { error: profileError } = await client
      .from('profiles')
      .update({
        first_name: input.firstName.trim() || null,
        last_name: input.lastName.trim() || null,
        status: 'pending',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId);

    if (profileError) {
      return { data: null, error: profileError };
    }

    if (input.organizationId) {
      const { error: orgError } = await client
        .from('organization_members')
        .insert({
          organization_id: input.organizationId,
          user_id: userId,
          role: 'patient',
          is_active: true,
        });

      if (orgError) return { data: null, error: orgError };
    }

    if (input.teamId) {
      const { error: teamError } = await client.from('team_membership').insert({
        team_id: input.teamId,
        user_id: userId,
      });

      if (teamError) return { data: null, error: teamError };
    }

    if (input.role === 'admin') {
      const { OrganizationMembers } = await import('./organization-members');
      const orgMembersQuery = new OrganizationMembers();
      const superAdminResult = await orgMembersQuery.makeSuperAdmin(userId);
      if (!superAdminResult.success) {
        console.error(
          'Failed to add user to super admin organization:',
          superAdminResult.error,
        );
      }
    }

    return { data: { id: userId }, error: null };
  },
  targets: () => [profileKeys.all],
});

async function fetchAllWithMemberships(
  client: SupabaseClient<Database>,
): Promise<{
  data: ProfileWithMemberships[] | null;
  error: { message: string } | null;
}> {
  const { data, error } = await client
    .from('profiles')
    .select(
      '*, organization_members(organization_id, role, organizations!inner(id, name)), team_membership(team_id, teams!inner(id, name, organization_id, organizations!inner(id, name)))',
    )
    .order('created_at', { ascending: false });

  if (error) return { data: null, error };
  if (!data) return { data: [], error: null };

  const transformedData = (data as unknown as RawProfile[]).map((profile) => {
    const { organization_members, team_membership, ...profileData } = profile;

    const orgMemberships =
      Array.isArray(organization_members) && organization_members.length > 0
        ? organization_members
            .filter((om) => om.organizations !== null)
            .map((om) => ({
              orgId: om.organization_id,
              orgName: om.organizations!.name,
              role: om.role,
            }))
        : [];

    const teamMemberships =
      Array.isArray(team_membership) && team_membership.length > 0
        ? team_membership
            .filter(
              (tm) => tm.teams !== null && tm.teams.organizations !== null,
            )
            .map((tm) => ({
              teamId: tm.team_id,
              teamName: tm.teams!.name,
              orgId: tm.teams!.organization_id,
              orgName: tm.teams!.organizations!.name,
            }))
        : [];

    return {
      ...profileData,
      orgMemberships,
      teamMemberships,
    };
  });

  return { data: transformedData, error: null };
}

/**
 * @deprecated builder / groups / users detail — use DAL queries directly where in scope.
 * Thin facade until those modules migrate.
 */
export class ProfilesQuery {
  public async getAuthProfile(): Promise<
    SupabaseSuccess<ProfileWithStats> | SupabaseError
  > {
    const client = await createClient();
    const {
      data: { user },
      error: authError,
    } = await client.auth.getUser();

    if (authError || !user) {
      return { success: false, error: 'Unauthenticated' };
    }

    const result = await fetchProfileById(client, user.id);
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    if (!result.data) {
      return { success: false, error: 'Profile not found' };
    }

    return { success: true, data: result.data };
  }

  public async getUserById(
    id: string,
  ): Promise<SupabaseSuccess<ProfileWithStats> | SupabaseError> {
    return toLegacyResult(
      await queryWithSession(getProfileByIdQuery, id),
    );
  }

  public async getAllWithMemberships(): Promise<
    SupabaseSuccess<ProfileWithMemberships[]> | SupabaseError
  > {
    const client = await createAdminClient();
    const result = await fetchAllWithMemberships(client);
    if (result.error) {
      return { success: false, error: result.error.message };
    }
    return { success: true, data: result.data ?? [] };
  }

  public async getList(filters?: {
    organization_id?: string;
    team_id?: string;
    journey_phase?: string;
  }): Promise<SupabaseSuccess<Profile[]> | SupabaseError> {
    const client = await createAdminClient();
    let userIds: string[] | null = null;

    if (filters?.organization_id) {
      const { data: orgMembers } = await client
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', filters.organization_id)
        .eq('is_active', true);

      if (orgMembers && orgMembers.length > 0) {
        userIds = orgMembers.map((m) => m.user_id);
      } else {
        return { success: true, data: [] };
      }
    }

    if (filters?.team_id) {
      const { data: teamMembers } = await client
        .from('team_membership')
        .select('user_id')
        .eq('team_id', filters.team_id);

      if (teamMembers && teamMembers.length > 0) {
        const teamUserIds = teamMembers.map((m) => m.user_id);
        if (userIds) {
          userIds = userIds.filter((id) => teamUserIds.includes(id));
          if (userIds.length === 0) {
            return { success: true, data: [] };
          }
        } else {
          userIds = teamUserIds;
        }
      } else {
        return { success: true, data: [] };
      }
    }

    let request = client.from('profiles').select('*');

    if (userIds) {
      request = request.in('id', userIds);
    }

    if (filters?.journey_phase) {
      request = request.eq('journey_phase', filters.journey_phase);
    }

    const { data, error } = await request.order('created_at', {
      ascending: false,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    const parsed = profileSchema.array().safeParse(data ?? []);
    if (!parsed.success) {
      return { success: false, error: 'Response validation failed' };
    }

    return { success: true, data: parsed.data };
  }

  public async getListWithStats(
    filters?: ListProfilesWithStatsInput,
  ): Promise<SupabaseSuccess<ProfileWithStats[]> | SupabaseError> {
    return toLegacyResult(
      await query(listProfilesWithStatsQuery, filters ?? {}),
    );
  }

  public async getPatientsByOrganization(
    organizationId: string,
  ): Promise<SupabaseSuccess<ProfileWithStats[]> | SupabaseError> {
    return this.getListWithStats({
      organization_id: organizationId,
      role: 'patient',
    });
  }

  public async create(
    profileData: Partial<Profile>,
  ): Promise<SupabaseSuccess<Profile> | SupabaseError> {
    const client = await createAdminClient();
    const { data, error } = await client
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    const parsed = profileSchema.safeParse(data);
    if (!parsed.success) {
      return { success: false, error: 'Response validation failed' };
    }

    return { success: true, data: parsed.data };
  }

  public async update(
    id: string,
    profileData: Partial<Profile>,
  ): Promise<SupabaseSuccess<Profile> | SupabaseError> {
    return toLegacyResult(
      await mutate(updateProfileMutation, {
        id,
        profileData: {
          first_name: profileData.first_name,
          last_name: profileData.last_name,
          description: profileData.description,
          avatar_url: profileData.avatar_url,
        },
      }),
    );
  }

  public async delete(
    id: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const client = await createAdminClient();
    const { error } = await client.from('profiles').delete().eq('id', id);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data: undefined };
  }

  public async deleteAuthUser(
    id: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const result = await mutate(deleteAuthUserMutation, { id });
    const [err] = result;
    if (err) {
      return { success: false, error: formatDalError(err) };
    }
    return { success: true, data: undefined };
  }

  public async getAllEmailsForImport(): Promise<
    SupabaseSuccess<Set<string>> | SupabaseError
  > {
    return toLegacyResult(await query(getAllEmailsForImportQuery));
  }

  public async getByEmailsForImport(emails: string[]): Promise<
    | SupabaseSuccess<
        Array<{
          id: string;
          email: string | null;
          first_name: string | null;
          last_name: string | null;
          status: string | null;
        }>
      >
    | SupabaseError
  > {
    return toLegacyResult(
      await query(getProfilesByEmailsForImportQuery, emails),
    );
  }

  public async getByEmail(email: string): Promise<
    | SupabaseSuccess<{
        id: string;
        first_name: string | null;
        last_name: string | null;
      }>
    | SupabaseError
  > {
    const client = await createAdminClient();
    const { data, error } = await client
      .from('profiles')
      .select('id, first_name, last_name')
      .ilike('email', email)
      .maybeSingle();

    if (error) {
      return { success: false, error: error.message };
    }

    if (!data) {
      return { success: false, error: 'User not found' };
    }

    return { success: true, data };
  }

  public async createQuickAdd(data: CreateQuickAddInput): Promise<
    SupabaseSuccess<{ userId: string }> | SupabaseError
  > {
    const result = await mutate(createQuickAddMutation, data);
    const [err, row] = result;
    if (err) {
      return { success: false, error: formatDalError(err) };
    }
    return { success: true, data: { userId: row.id } };
  }

  public async setOnboardingState(
    p_user_id: string,
    p_target: SetOnboardingStateTarget,
  ): Promise<SupabaseSuccess<SetOnboardingStateResult> | SupabaseError> {
    const result = await mutate(setOnboardingStateMutation, {
      userId: p_user_id,
      target: p_target,
    });
    const [err] = result;
    if (err) {
      return { success: false, error: formatDalError(err) };
    }
    return { success: true, data: undefined };
  }

  public async getListFiltered(
    params: ListProfilesFilteredInput,
  ): Promise<SupabaseSuccess<PaginatedResult<ProfileWithStats>> | SupabaseError> {
    return toLegacyResult(
      await queryWithSession(listProfilesFilteredQuery, params),
    );
  }

  public async getFilterCounts(): Promise<
    SupabaseSuccess<MemberFilterCounts> | SupabaseError
  > {
    return toLegacyResult(
      await queryWithSession(getMemberFilterCountsQuery),
    );
  }
}
