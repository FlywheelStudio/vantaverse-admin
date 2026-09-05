import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineMutation, defineQuery, mutate, query, type DalResult } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';
import {
  adminProfileSchema,
  type AdminFilterCounts,
  type AdminProfile,
} from '../schemas/admins';
import { MemberRole } from '../schemas/organization-members';
import type { SupabaseError, SupabaseSuccess } from '../result';
import type { PaginatedResult } from './exercise-templates';

const adminProfileListSchema = z.array(adminProfileSchema);

const adminFilterCountsSchema = z.object({
  roles: z.object({ patient: z.number(), admin: z.number() }),
  status: z.object({
    pending: z.number(),
    invited: z.number(),
    active: z.number(),
    assigned: z.number(),
  }),
});

const paginatedAdminProfileSchema = z.object({
  data: z.array(adminProfileSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
});

export type ListAdminsFilteredInput = {
  search?: string;
  organizationId?: string;
  teamId?: string;
  status?: string;
  lastActive?: string;
  joined?: string;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

const updateAdminInputSchema = z.object({
  id: z.uuid(),
  profileData: z.object({
    first_name: z.string().nullable().optional(),
    last_name: z.string().nullable().optional(),
    description: z.string().nullable().optional(),
    avatar_url: z.string().nullable().optional(),
  }),
});

export type UpdateAdminInput = z.infer<typeof updateAdminInputSchema>;

export const adminKeys = {
  all: ['admins'] as const,
  authProfile: () => [...adminKeys.all, 'auth-profile'] as const,
  detail: (id: string) => [...adminKeys.all, 'detail', id] as const,
  exists: (id: string) => [...adminKeys.all, 'exists', id] as const,
  byIds: (ids: string[]) => [...adminKeys.all, 'by-ids', ids] as const,
  filtered: (params: ListAdminsFilteredInput) =>
    [...adminKeys.all, 'filtered', params] as const,
  filterCounts: () => [...adminKeys.all, 'filter-counts'] as const,
};

function toLegacyResult<T>(
  result: DalResult<T>,
): SupabaseSuccess<T> | SupabaseError {
  const [err, data] = result;
  if (err) {
    return { success: false, error: err.message };
  }
  return { success: true, data };
}

type OrgMemberWithRole = {
  user_id: string;
  organization_id: string;
  role: MemberRole;
  organizations: {
    id: string;
    name: string;
  } | null;
};

async function hasActiveAdminMembership(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{ data: boolean | null; error: { message: string } | null }> {
  const { data, error } = await client
    .from('organization_members')
    .select('user_id')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (error) return { data: null, error };
  return { data: Boolean(data), error: null };
}

async function getSuperAdminUserIds(
  client: SupabaseClient<Database>,
): Promise<{ data: Set<string> | null; error: { message: string } | null }> {
  const { data: superAdminOrg, error: orgError } = await client
    .from('organizations')
    .select('id')
    .eq('is_super_admin', true)
    .maybeSingle();

  if (orgError) return { data: null, error: orgError };

  const userIds = new Set<string>();
  if (!superAdminOrg?.id) {
    return { data: userIds, error: null };
  }

  const { data: members, error: membersError } = await client
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', superAdminOrg.id)
    .eq('is_active', true);

  if (membersError) return { data: null, error: membersError };

  members?.forEach((member) => userIds.add(member.user_id));
  return { data: userIds, error: null };
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

async function enrichAdminRows(
  client: SupabaseClient<Database>,
  rows: unknown[],
  profileIds: string[],
): Promise<{ data: unknown[] | null; error: { message: string } | null }> {
  const [superAdminResult, membershipsResult] = await Promise.all([
    getSuperAdminUserIds(client),
    getOrganizationMemberships(client, profileIds),
  ]);

  if (superAdminResult.error) {
    return { data: null, error: superAdminResult.error };
  }
  if (membershipsResult.error) {
    return { data: null, error: membershipsResult.error };
  }
  if (!superAdminResult.data || !membershipsResult.data) {
    return {
      data: null,
      error: { message: 'Failed to enrich admin rows' },
    };
  }

  const { orgMembershipsMap, userRoleMap } = membershipsResult.data;
  const superAdminUserIds = superAdminResult.data;

  const enriched = rows.map((row) => {
    const record = row as Record<string, unknown>;
    const userId = record.id as string;
    const role = userRoleMap.get(userId) ?? ('admin' as MemberRole);

    return {
      ...record,
      is_super_admin: superAdminUserIds.has(userId),
      orgMemberships: orgMembershipsMap.get(userId) || [],
      role,
    };
  });

  return { data: enriched, error: null };
}

async function fetchAuthProfile(
  client: SupabaseClient<Database>,
): Promise<{ data: AdminProfile | null; error: { message: string } | null }> {
  const {
    data: { user },
    error: authError,
  } = await client.auth.getUser();

  if (authError || !user) {
    return { data: null, error: { message: 'Unauthenticated' } };
  }

  const { data, error } = await client
    .from('profiles_admins')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (error) return { data: null, error };

  if (!data) {
    return { data: null, error: { message: 'Admin profile not found' } };
  }

  const membershipResult = await hasActiveAdminMembership(client, user.id);
  if (membershipResult.error) return { data: null, error: membershipResult.error };
  if (!membershipResult.data) {
    return { data: null, error: { message: 'Active admin membership required' } };
  }

  const enriched = await enrichAdminRows(client, [data], [user.id]);
  if (enriched.error) return { data: null, error: enriched.error };

  const parsed = adminProfileSchema.safeParse(enriched.data?.[0]);
  if (!parsed.success) {
    return { data: null, error: { message: 'Response validation failed' } };
  }

  return { data: parsed.data, error: null };
}

async function fetchAdminById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<{ data: AdminProfile | null; error: { message: string } | null }> {
  const { data, error } = await client
    .from('profiles_admins')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (error) return { data: null, error };

  if (!data) {
    return { data: null, error: { message: 'Admin not found' } };
  }

  const enriched = await enrichAdminRows(client, [data], [id]);
  if (enriched.error) return { data: null, error: enriched.error };

  const parsed = adminProfileSchema.safeParse(enriched.data?.[0]);
  if (!parsed.success) {
    return { data: null, error: { message: 'Response validation failed' } };
  }

  return { data: parsed.data, error: null };
}

async function fetchAdminExists(
  client: SupabaseClient<Database>,
  id: string,
): Promise<{ data: boolean | null; error: { message: string } | null }> {
  const { data, error } = await client
    .from('profiles_admins')
    .select('id')
    .eq('id', id)
    .maybeSingle();

  if (error) return { data: null, error };
  return { data: Boolean(data), error: null };
}

async function fetchAdminsByIds(
  client: SupabaseClient<Database>,
  ids: string[],
): Promise<{ data: AdminProfile[] | null; error: { message: string } | null }> {
  if (ids.length === 0) {
    return { data: [], error: null };
  }

  const uniqueIds = [...new Set(ids)];

  const { data, error } = await client
    .from('profiles_admins')
    .select('*')
    .in('id', uniqueIds);

  if (error) return { data: null, error };

  const rows = data ?? [];
  if (rows.length === 0) {
    return { data: [], error: null };
  }

  const enriched = await enrichAdminRows(
    client,
    rows,
    rows.map((row) => row.id),
  );
  if (enriched.error) return { data: null, error: enriched.error };

  const parsed = adminProfileSchema.array().safeParse(enriched.data ?? []);
  if (!parsed.success) {
    return { data: null, error: { message: 'Response validation failed' } };
  }

  return { data: parsed.data, error: null };
}

async function fetchAdminsFiltered(
  client: SupabaseClient<Database>,
  params: ListAdminsFilteredInput,
): Promise<{
  data: PaginatedResult<AdminProfile> | null;
  error: { message: string } | null;
}> {
  const { data, error } = await client.rpc('list_admins_filtered', {
    p_search: params.search || undefined,
    p_org_id: params.organizationId || undefined,
    p_team_id: params.teamId || undefined,
    p_status: params.status || 'all',
    p_last_active: params.lastActive || 'all',
    p_joined: params.joined || 'all',
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
  const enriched = await enrichAdminRows(client, rows, profileIds);
  if (enriched.error) return { data: null, error: enriched.error };

  const parsed = adminProfileSchema.array().safeParse(enriched.data ?? []);
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

/** Authenticated shell profile from `profiles_admins`. */
export const getAuthProfileQuery = defineQuery({
  key: adminKeys.authProfile,
  schema: adminProfileSchema,
  execute: (client) => fetchAuthProfile(client),
});

/** Load one admin by id under RLS. */
export const getAdminByIdQuery = defineQuery({
  key: adminKeys.detail,
  schema: adminProfileSchema,
  execute: (client, id: string) => fetchAdminById(client, id),
});

/** Whether a `profiles_admins` row exists for the id (RLS-scoped). */
export const adminExistsQuery = defineQuery({
  key: adminKeys.exists,
  schema: z.boolean(),
  execute: (client, id: string) => fetchAdminExists(client, id),
});

/** Batch-load slim admin PII by ids (org/team/group name joins). */
export const getAdminsByIdsQuery = defineQuery({
  key: adminKeys.byIds,
  schema: adminProfileListSchema,
  execute: (client, ids: string[]) => fetchAdminsByIds(client, ids),
});

/** Paginated Manage list via `list_admins_filtered`. */
export const listAdminsFilteredQuery = defineQuery({
  key: adminKeys.filtered,
  schema: paginatedAdminProfileSchema,
  execute: (client, params: ListAdminsFilteredInput) =>
    fetchAdminsFiltered(client, params),
});

/** Facet counts via `get_admin_filter_counts`. */
export const getAdminFilterCountsQuery = defineQuery({
  key: adminKeys.filterCounts,
  schema: adminFilterCountsSchema,
  execute: async (client) => {
    const { data, error } = await client.rpc('get_admin_filter_counts');
    if (error) return { data: null, error };

    const parsed = adminFilterCountsSchema.safeParse(data);
    if (!parsed.success) {
      return { data: null, error: { message: 'Response validation failed' } };
    }

    return { data: parsed.data, error: null };
  },
});

/** Update an admin row under RLS. */
export const updateAdminMutation = defineMutation({
  inputSchema: updateAdminInputSchema,
  schema: adminProfileSchema,
  execute: async (client, input: UpdateAdminInput) => {
    const { data, error } = await client
      .from('profiles_admins')
      .update(input.profileData)
      .eq('id', input.id)
      .select('*')
      .single();

    if (error) return { data: null, error };

    const enriched = await enrichAdminRows(client, [data], [input.id]);
    if (enriched.error) return { data: null, error: enriched.error };

    const parsed = adminProfileSchema.safeParse(enriched.data?.[0]);
    if (!parsed.success) {
      return { data: null, error: { message: 'Response validation failed' } };
    }

    return { data: parsed.data, error: null };
  },
  targets: (input) => [adminKeys.all, adminKeys.detail(input.id)],
});

/**
 * @deprecated organization-members / resolve-display-profiles — use DAL queries directly.
 * Retained until those modules migrate.
 */
export class AdminsQuery {
  public async getAuthProfile(): Promise<
    SupabaseSuccess<AdminProfile> | SupabaseError
  > {
    const { createClient } = await import('@/lib/supabase/core/server');
    const client = await createClient();
    return toLegacyResult(await query(getAuthProfileQuery, { client }));
  }

  public async getById(
    id: string,
  ): Promise<SupabaseSuccess<AdminProfile> | SupabaseError> {
    const { createClient } = await import('@/lib/supabase/core/server');
    const client = await createClient();
    return toLegacyResult(await query(getAdminByIdQuery, id, { client }));
  }

  public async exists(
    id: string,
  ): Promise<SupabaseSuccess<boolean> | SupabaseError> {
    const { createClient } = await import('@/lib/supabase/core/server');
    const client = await createClient();
    return toLegacyResult(await query(adminExistsQuery, id, { client }));
  }

  public async getByIds(
    ids: string[],
  ): Promise<SupabaseSuccess<AdminProfile[]> | SupabaseError> {
    const { createClient } = await import('@/lib/supabase/core/server');
    const client = await createClient();
    return toLegacyResult(await query(getAdminsByIdsQuery, ids, { client }));
  }

  public async getListFiltered(
    params: ListAdminsFilteredInput = {},
  ): Promise<SupabaseSuccess<PaginatedResult<AdminProfile>> | SupabaseError> {
    const { createClient } = await import('@/lib/supabase/core/server');
    const client = await createClient();
    return toLegacyResult(
      await query(listAdminsFilteredQuery, params, { client }),
    );
  }

  public async getFilterCounts(): Promise<
    SupabaseSuccess<AdminFilterCounts> | SupabaseError
  > {
    const { createClient } = await import('@/lib/supabase/core/server');
    const client = await createClient();
    return toLegacyResult(await query(getAdminFilterCountsQuery, { client }));
  }

  public async update(
    id: string,
    profileData: Pick<
      Partial<AdminProfile>,
      'first_name' | 'last_name' | 'description' | 'avatar_url'
    >,
  ): Promise<SupabaseSuccess<AdminProfile> | SupabaseError> {
    const { createClient } = await import('@/lib/supabase/core/server');
    const client = await createClient();
    return toLegacyResult(
      await mutate(updateAdminMutation, { id, profileData }, { client }),
    );
  }
}
