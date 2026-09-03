import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineMutation, defineQuery, query, type DalResult } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';
import {
  organizationSchema,
  type Organization,
} from '../schemas/organizations';
import type { SupabaseError, SupabaseSuccess } from '../result';
import { resolveDisplayProfilesByIds, type DisplayProfile } from './resolve-display-profiles';

const organizationListSchema = z.array(organizationSchema);

const ORGANIZATION_WITH_RELATIONS_SELECT =
  '*, organization_members(id, user_id, is_active, role), teams(id)';

type RawOrganizationMember = {
  id: string;
  user_id: string;
  is_active: boolean | null;
  role: 'admin' | 'member' | 'patient';
};

type RawOrganization = Omit<
  Organization,
  'members_count' | 'member_ids' | 'members' | 'teams_count' | 'teams'
> & {
  organization_members: RawOrganizationMember[] | null;
  teams: { id: string }[] | null;
};

const createOrganizationInputSchema = z.object({
  name: z.string().trim().min(1),
  description: z.string().nullable().optional(),
  screeningUrl: z.string().nullable().optional(),
});

export type CreateOrganizationInput = z.infer<
  typeof createOrganizationInputSchema
>;

const updateOrganizationInputSchema = z.object({
  id: z.uuid(),
  data: organizationSchema.partial(),
});

export type UpdateOrganizationInput = z.infer<
  typeof updateOrganizationInputSchema
>;

const deleteOrganizationInputSchema = z.object({
  id: z.uuid(),
});

const deleteOrganizationResultSchema = z.object({
  id: z.string(),
});

const superAdminOrganizationIdSchema = z.string().uuid();

const organizationImportMapSchema = z.map(z.string(), z.string());

export const organizationKeys = {
  all: ['organizations'] as const,
  list: () => [...organizationKeys.all, 'list'] as const,
  detail: (id: string) => [...organizationKeys.all, 'detail', id] as const,
  superAdminId: () => [...organizationKeys.all, 'super-admin-id'] as const,
  importMap: () => [...organizationKeys.all, 'import-map'] as const,
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

async function transformOrganization(
  client: SupabaseClient<Database>,
  org: RawOrganization,
  profilesById?: Map<string, DisplayProfile>,
): Promise<Organization> {
  const { organization_members, teams, ...orgData } = org;
  const activeMembers = Array.isArray(organization_members)
    ? organization_members.filter((member) => member.is_active === true)
    : [];

  const resolvedProfiles =
    profilesById ??
    (await resolveDisplayProfilesByIds(
      client,
      activeMembers.map((member) => member.user_id),
    ));

  const members = activeMembers.map((member) => ({
    id: member.id,
    user_id: member.user_id,
    role: member.role,
    profile: resolvedProfiles.get(member.user_id) ?? null,
  }));

  const memberIds = members.map((member) => member.id);
  const teamsCount = Array.isArray(teams) ? teams.length : 0;

  return {
    ...orgData,
    members_count: members.length,
    member_ids: memberIds.length > 0 ? memberIds : undefined,
    members: members.length > 0 ? members : undefined,
    teams_count: teamsCount,
  };
}

async function fetchOrganizationsList(
  client: SupabaseClient<Database>,
): Promise<{
  data: Organization[] | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('organizations')
    .select(ORGANIZATION_WITH_RELATIONS_SELECT)
    .or('is_super_admin.is.null,is_super_admin.eq.false')
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  const orgs = (data ?? []) as RawOrganization[];
  const allUserIds = orgs.flatMap((org) =>
    (org.organization_members ?? [])
      .filter((member) => member.is_active === true)
      .map((member) => member.user_id),
  );
  const profilesById = await resolveDisplayProfilesByIds(client, allUserIds);

  const transformed = await Promise.all(
    orgs.map((org) => transformOrganization(client, org, profilesById)),
  );

  const parsed = organizationListSchema.safeParse(transformed);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

async function fetchOrganizationById(
  client: SupabaseClient<Database>,
  id: string,
): Promise<{
  data: Organization | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('organizations')
    .select(ORGANIZATION_WITH_RELATIONS_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return {
      data: null,
      error: { message: 'Organization not found', code: 'P0404' },
    };
  }

  const transformed = await transformOrganization(
    client,
    data as RawOrganization,
  );
  const parsed = organizationSchema.safeParse(transformed);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

/** All non-super-admin organizations with member and team counts. */
export const listOrganizations = defineQuery({
  key: organizationKeys.list,
  schema: organizationListSchema,
  execute: (client) => fetchOrganizationsList(client),
});

/** Single organization by id with members and team count. */
export const getOrganizationById = defineQuery({
  key: organizationKeys.detail,
  schema: organizationSchema,
  execute: (client, id: string) => fetchOrganizationById(client, id),
});

/** Create a new organization. */
export const createOrganization = defineMutation({
  inputSchema: createOrganizationInputSchema,
  schema: organizationSchema,
  execute: async (client, input: CreateOrganizationInput) => {
    const { data, error } = await client
      .from('organizations')
      .insert({
        name: input.name.trim(),
        description: input.description?.trim() || null,
        screening_url: input.screeningUrl?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: 'Failed to create organization', code: 'P0500' },
      };
    }

    const parsed = organizationSchema.safeParse(data);
    if (!parsed.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    return { data: parsed.data, error: null };
  },
  targets: () => [organizationKeys.all],
});

/** Update an organization. */
export const updateOrganization = defineMutation({
  inputSchema: updateOrganizationInputSchema,
  schema: organizationSchema,
  execute: async (client, input: UpdateOrganizationInput) => {
    const { data, error } = await client
      .from('organizations')
      .update({
        ...input.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: 'Failed to update organization', code: 'P0500' },
      };
    }

    const parsed = organizationSchema.safeParse(data);
    if (!parsed.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    return { data: parsed.data, error: null };
  },
  targets: (input) => [
    organizationKeys.all,
    organizationKeys.detail(input.id),
    organizationKeys.list(),
  ],
});

/** Delete an organization. */
export const deleteOrganization = defineMutation({
  inputSchema: deleteOrganizationInputSchema,
  schema: deleteOrganizationResultSchema,
  execute: async (client, input: z.infer<typeof deleteOrganizationInputSchema>) => {
    const { error } = await client
      .from('organizations')
      .delete()
      .eq('id', input.id);

    if (error) {
      return { data: null, error };
    }

    return { data: { id: input.id }, error: null };
  },
  targets: (input) => [
    organizationKeys.all,
    organizationKeys.detail(input.id),
    organizationKeys.list(),
  ],
});

/** Super-admin organization id. */
export const getSuperAdminOrganizationId = defineQuery({
  key: organizationKeys.superAdminId,
  schema: superAdminOrganizationIdSchema,
  execute: async (client) => {
    const { data, error } = await client
      .from('organizations')
      .select('id')
      .eq('is_super_admin', true)
      .single();

    if (error || !data) {
      return {
        data: null,
        error: {
          message: 'Super admin organization not found',
          code: 'P0404',
        },
      };
    }

    return { data: data.id, error: null };
  },
});

/** Organization name → id map for import validation. */
export const getOrganizationsForImport = defineQuery({
  key: organizationKeys.importMap,
  schema: organizationImportMapSchema,
  execute: async (client) => {
    const { data, error } = await client
      .from('organizations')
      .select('id, name');

    if (error) {
      return { data: null, error };
    }

    const orgMap = new Map<string, string>();
    for (const org of data ?? []) {
      orgMap.set(org.name, org.id);
    }

    return { data: orgMap, error: null };
  },
});

/**
 * @deprecated organization-members slice — use DAL queries directly.
 */
export class OrganizationsQuery {
  public async getSuperAdminOrganizationId(): Promise<
    SupabaseSuccess<string> | SupabaseError
  > {
    const { createClient } = await import('@/lib/supabase/core/server');
    const client = await createClient();
    return toLegacyResult(await query(getSuperAdminOrganizationId, { client }));
  }

  public async getAllForImport(): Promise<
    SupabaseSuccess<Map<string, string>> | SupabaseError
  > {
    const { createClient } = await import('@/lib/supabase/core/server');
    const client = await createClient();
    return toLegacyResult(
      await query(getOrganizationsForImport, { client }),
    );
  }
}
