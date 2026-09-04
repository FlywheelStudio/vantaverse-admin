import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import {
  defineMutation,
  defineQuery,
  mutate,
  query,
  type DalResult,
} from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';
import {
  MemberRole,
  organizationMemberRoleSchema,
  organizationMemberSchema,
} from '../schemas/organization-members';
import type { ClientRole, SupabaseError, SupabaseSuccess } from '../result';
import { getSuperAdminOrganizationId } from './organizations';

const booleanSchema = z.boolean();
const memberUserIdsSchema = z.array(z.string());
const memberCountsSchema = z.record(z.string(), z.number());
const membershipMutationResultSchema = z.object({
  id: z.string(),
});

const userOrganizationSummarySchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  picture_url: z.string().nullable(),
});

const userOrganizationsSchema = z.array(userOrganizationSummarySchema);

const physiologistInfoSchema = z
  .object({
    userId: z.string(),
    firstName: z.string(),
    lastName: z.string(),
    email: z.string(),
    avatarUrl: z.string().nullable(),
    description: z.string().nullable(),
  })
  .nullable();

export type UserOrganizationSummary = z.infer<
  typeof userOrganizationSummarySchema
>;

export type PhysiologistInfo = NonNullable<z.infer<typeof physiologistInfoSchema>>;

const makeSuperAdminInputSchema = z.string().uuid();
const revokeSuperAdminInputSchema = z.string().uuid();

const addOrUpdateMembershipInputSchema = z.object({
  userId: z.string().uuid(),
  organizationId: z.string().uuid(),
  role: organizationMemberRoleSchema,
});

export type AddOrUpdateMembershipInput = z.infer<
  typeof addOrUpdateMembershipInputSchema
>;

export const organizationMemberKeys = {
  all: ['organization-members'] as const,
  isAdminByEmail: (email: string) =>
    [...organizationMemberKeys.all, 'is-admin-by-email', email] as const,
  isAdminById: (userId: string) =>
    [...organizationMemberKeys.all, 'is-admin-by-id', userId] as const,
  memberUserIds: (organizationId: string) =>
    [...organizationMemberKeys.all, 'member-user-ids', organizationId] as const,
  currentPhysiologist: (organizationId: string) =>
    [...organizationMemberKeys.all, 'current-physiologist', organizationId] as const,
  organizationsByUserId: (userId: string) =>
    [...organizationMemberKeys.all, 'orgs-by-user', userId] as const,
  totalMemberCount: (organizationIds: string[]) =>
    [
      ...organizationMemberKeys.all,
      'total-member-count',
      ...[...organizationIds].sort(),
    ] as const,
  memberCountsByOrgIds: (organizationIds: string[]) =>
    [
      ...organizationMemberKeys.all,
      'member-counts',
      ...[...organizationIds].sort(),
    ] as const,
  adminOrganizations: (userId: string) =>
    [...organizationMemberKeys.all, 'admin-orgs', userId] as const,
};

type RawAdminOrg = {
  id: string;
  name: string;
  description: string | null;
  picture_url: string | null;
  is_super_admin: boolean | null;
};

type RawOrgMember = {
  organization_id: string;
  organizations: RawAdminOrg | RawAdminOrg[] | null;
};

function mapUserOrganizations(
  data: RawOrgMember[],
): UserOrganizationSummary[] {
  return data
    .map((item) => {
      const org = Array.isArray(item.organizations)
        ? item.organizations[0]
        : item.organizations;
      return { orgId: item.organization_id, org };
    })
    .filter(({ org }) => org?.is_super_admin !== true)
    .map(({ orgId, org }) => ({
      id: orgId,
      name: org!.name,
      description: org!.description,
      picture_url: org!.picture_url,
    }));
}

async function fetchIsUserAdminByEmail(
  client: SupabaseClient<Database>,
  email: string,
): Promise<{
  data: boolean | null;
  error: { message: string; code?: string } | null;
}> {
  const { data: adminProfile, error: profileError } = await client
    .from('profiles_admins')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (profileError) {
    return { data: null, error: profileError };
  }

  if (!adminProfile?.id) {
    return { data: false, error: null };
  }

  const { data: membership, error: membershipError } = await client
    .from('organization_members')
    .select('role')
    .eq('user_id', adminProfile.id)
    .eq('role', 'admin')
    .eq('is_active', true)
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return { data: null, error: membershipError };
  }

  if (!membership) {
    return { data: false, error: null };
  }

  const result = organizationMemberSchema.safeParse(membership);
  if (!result.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: result.data.role === 'admin', error: null };
}

async function fetchIsUserAdminById(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{
  data: boolean | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('organization_members')
    .select('role')
    .eq('user_id', userId)
    .eq('role', 'admin')
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: false, error: null };
  }

  const result = organizationMemberSchema.safeParse(data);
  if (!result.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: result.data.role === 'admin', error: null };
}

async function fetchMemberUserIds(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<{
  data: string[] | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('is_active', true);

  if (error) {
    return { data: null, error };
  }

  return { data: (data ?? []).map((member) => member.user_id), error: null };
}

async function fetchCurrentPhysiologist(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<{
  data: z.infer<typeof physiologistInfoSchema> | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('organization_members')
    .select('user_id')
    .eq('organization_id', organizationId)
    .eq('role', 'admin')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return { data: null, error };
  }

  if (!data?.user_id) {
    return { data: null, error: null };
  }

  const { data: profile, error: profileError } = await client
    .from('profiles_admins')
    .select('first_name, last_name, email, avatar_url, description')
    .eq('id', data.user_id)
    .maybeSingle();

  if (profileError || !profile) {
    return { data: null, error: null };
  }

  return {
    data: {
      userId: data.user_id,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      email: profile.email || '',
      avatarUrl: profile.avatar_url || null,
      description: profile.description || null,
    },
    error: null,
  };
}

async function fetchOrganizationsByUserId(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{
  data: UserOrganizationSummary[] | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('organization_members')
    .select(
      'organization_id, organizations!inner(id, name, description, picture_url, is_super_admin)',
    )
    .eq('user_id', userId)
    .eq('is_active', true);

  if (error) {
    return { data: null, error };
  }

  return {
    data: mapUserOrganizations((data ?? []) as RawOrgMember[]),
    error: null,
  };
}

async function fetchOrganizationsWhereUserIsAdmin(
  client: SupabaseClient<Database>,
  userId: string,
): Promise<{
  data: UserOrganizationSummary[] | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('organization_members')
    .select(
      'organization_id, organizations!inner(id, name, description, picture_url, is_super_admin)',
    )
    .eq('user_id', userId)
    .eq('role', 'admin')
    .eq('is_active', true);

  if (error) {
    return { data: null, error };
  }

  return {
    data: mapUserOrganizations((data ?? []) as RawOrgMember[]),
    error: null,
  };
}

async function fetchTotalMemberCountForOrganizations(
  client: SupabaseClient<Database>,
  organizationIds: string[],
): Promise<{
  data: number | null;
  error: { message: string; code?: string } | null;
}> {
  if (organizationIds.length === 0) {
    return { data: 0, error: null };
  }

  const { data, error } = await client
    .from('organization_members')
    .select('user_id')
    .in('organization_id', organizationIds)
    .eq('is_active', true)
    .eq('role', 'patient');

  if (error) {
    return { data: null, error };
  }

  const distinctIds = new Set((data ?? []).map((row) => row.user_id));
  return { data: distinctIds.size, error: null };
}

async function fetchMemberCountsByOrganizationIds(
  client: SupabaseClient<Database>,
  organizationIds: string[],
): Promise<{
  data: Record<string, number> | null;
  error: { message: string; code?: string } | null;
}> {
  if (organizationIds.length === 0) {
    return { data: {}, error: null };
  }

  const { data, error } = await client
    .from('organization_members')
    .select('organization_id')
    .in('organization_id', organizationIds)
    .eq('is_active', true)
    .eq('role', 'patient');

  if (error) {
    return { data: null, error };
  }

  const counts: Record<string, number> = {};
  for (const id of organizationIds) {
    counts[id] = 0;
  }
  for (const row of data ?? []) {
    counts[row.organization_id] = (counts[row.organization_id] ?? 0) + 1;
  }

  return { data: counts, error: null };
}

/** Pre-auth admin gate by email (inject admin or authenticated client). */
export const isUserAdminByEmailQuery = defineQuery({
  key: organizationMemberKeys.isAdminByEmail,
  schema: booleanSchema,
  execute: (client, email: string) => fetchIsUserAdminByEmail(client, email),
});

/** Whether user has active admin membership. */
export const isUserAdminByIdQuery = defineQuery({
  key: organizationMemberKeys.isAdminById,
  schema: booleanSchema,
  execute: (client, userId: string) => fetchIsUserAdminById(client, userId),
});

/** Active member user ids for an organization. */
export const getMemberUserIdsQuery = defineQuery({
  key: organizationMemberKeys.memberUserIds,
  schema: memberUserIdsSchema,
  execute: (client, organizationId: string) =>
    fetchMemberUserIds(client, organizationId),
});

/** Current physiologist (org admin) with display PII. */
export const getCurrentPhysiologistQuery = defineQuery({
  key: organizationMemberKeys.currentPhysiologist,
  schema: physiologistInfoSchema,
  execute: (client, organizationId: string) =>
    fetchCurrentPhysiologist(client, organizationId),
});

/** Organizations for a user, excluding super-admin org. */
export const getOrganizationsByUserIdQuery = defineQuery({
  key: organizationMemberKeys.organizationsByUserId,
  schema: userOrganizationsSchema,
  execute: (client, userId: string) =>
    fetchOrganizationsByUserId(client, userId),
});

/** Distinct patient count across organizations. */
export const getTotalMemberCountForOrganizationsQuery = defineQuery({
  key: organizationMemberKeys.totalMemberCount,
  schema: z.number().int().nonnegative(),
  execute: (client, organizationIds: string[]) =>
    fetchTotalMemberCountForOrganizations(client, organizationIds),
});

/** Patient counts keyed by organization id. */
export const getMemberCountsByOrganizationIdsQuery = defineQuery({
  key: organizationMemberKeys.memberCountsByOrgIds,
  schema: memberCountsSchema,
  execute: (client, organizationIds: string[]) =>
    fetchMemberCountsByOrganizationIds(client, organizationIds),
});

/** Organizations where user is admin, excluding super-admin org. */
export const getOrganizationsWhereUserIsAdminQuery = defineQuery({
  key: organizationMemberKeys.adminOrganizations,
  schema: userOrganizationsSchema,
  execute: (client, userId: string) =>
    fetchOrganizationsWhereUserIsAdmin(client, userId),
});

/** Grant super-admin org membership. */
export const makeSuperAdminMutation = defineMutation({
  inputSchema: makeSuperAdminInputSchema,
  schema: membershipMutationResultSchema,
  execute: async (client, userId: string) => {
    const orgResult = await getSuperAdminOrganizationId.execute(client);
    if (orgResult.error || typeof orgResult.data !== 'string') {
      return {
        data: null,
        error: orgResult.error ?? {
          message: 'Super admin organization not found',
          code: 'P0404',
        },
      };
    }

    const organizationId = orgResult.data;

    const { data: existingMember } = await client
      .from('organization_members')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      const { error } = await client
        .from('organization_members')
        .update({ is_active: true, role: 'admin' })
        .eq('id', existingMember.id);

      if (error) {
        return { data: null, error };
      }
    } else {
      const { error } = await client.from('organization_members').insert({
        organization_id: organizationId,
        user_id: userId,
        role: 'admin',
        is_active: true,
      });

      if (error) {
        return { data: null, error };
      }
    }

    return { data: { id: userId }, error: null };
  },
  targets: () => [organizationMemberKeys.all],
});

/** Remove super-admin org membership. */
export const revokeSuperAdminMutation = defineMutation({
  inputSchema: revokeSuperAdminInputSchema,
  schema: membershipMutationResultSchema,
  execute: async (client, userId: string) => {
    const orgResult = await getSuperAdminOrganizationId.execute(client);
    if (orgResult.error || typeof orgResult.data !== 'string') {
      return {
        data: null,
        error: orgResult.error ?? {
          message: 'Super admin organization not found',
          code: 'P0404',
        },
      };
    }

    const { error } = await client
      .from('organization_members')
      .delete()
      .eq('organization_id', orgResult.data)
      .eq('user_id', userId);

    if (error) {
      return { data: null, error };
    }

    return { data: { id: userId }, error: null };
  },
  targets: () => [organizationMemberKeys.all],
});

/** Upsert organization membership (service role). */
export const addOrUpdateMembershipMutation = defineMutation({
  inputSchema: addOrUpdateMembershipInputSchema,
  schema: membershipMutationResultSchema,
  client: 'admin',
  execute: async (client, input: AddOrUpdateMembershipInput) => {
    const { data: existingMembership } = await client
      .from('organization_members')
      .select('id, role')
      .eq('user_id', input.userId)
      .eq('organization_id', input.organizationId)
      .maybeSingle();

    if (existingMembership) {
      if (existingMembership.role !== input.role) {
        const { error } = await client
          .from('organization_members')
          .update({ role: input.role, is_active: true })
          .eq('id', existingMembership.id);

        if (error) {
          return { data: null, error };
        }
      }

      return { data: { id: input.userId }, error: null };
    }

    const { error } = await client.from('organization_members').insert({
      user_id: input.userId,
      organization_id: input.organizationId,
      role: input.role,
      is_active: true,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: { id: input.userId }, error: null };
  },
  targets: () => [organizationMemberKeys.all],
});

function toLegacyResult<T>(
  result: DalResult<T>,
): SupabaseSuccess<T> | SupabaseError {
  const [err, data] = result;
  if (err) {
    return { success: false, error: err.message };
  }
  return { success: true, data };
}

function toLegacyVoidResult(
  result: DalResult<{ id: string }>,
): SupabaseSuccess<void> | SupabaseError {
  const legacy = toLegacyResult(result);
  if (!legacy.success) {
    return legacy;
  }
  return { success: true, data: undefined };
}

async function resolveClientForRole(
  role: ClientRole,
): Promise<SupabaseClient<Database>> {
  if (role === 'service_role') {
    const { createAdminClient } = await import('@/lib/supabase/core/admin');
    return (await createAdminClient()) as SupabaseClient<Database>;
  }

  const { createClient } = await import('@/lib/supabase/core/server');
  return await createClient();
}

async function resolveAuthenticatedClient(): Promise<SupabaseClient<Database>> {
  const { createClient } = await import('@/lib/supabase/core/server');
  return await createClient();
}

/** Legacy facade for route callers outside Wave B scope. */
export class OrganizationMembers {
  public async isUserAdminByEmail(
    email: string,
    role: ClientRole = 'service_role',
  ): Promise<SupabaseSuccess<boolean> | SupabaseError> {
    const client = await resolveClientForRole(role);
    return toLegacyResult(
      await query(isUserAdminByEmailQuery, email, { client }),
    );
  }

  public async isUserAdminById(
    userId: string,
    role: ClientRole = 'authenticated_user',
  ): Promise<SupabaseSuccess<boolean> | SupabaseError> {
    const client = await resolveClientForRole(role);
    return toLegacyResult(
      await query(isUserAdminByIdQuery, userId, { client }),
    );
  }

  public async getMemberUserIds(
    organizationId: string,
  ): Promise<SupabaseSuccess<string[]> | SupabaseError> {
    const client = await resolveAuthenticatedClient();
    return toLegacyResult(
      await query(getMemberUserIdsQuery, organizationId, { client }),
    );
  }

  public async makeSuperAdmin(
    userId: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const client = await resolveAuthenticatedClient();
    return toLegacyVoidResult(
      await mutate(makeSuperAdminMutation, userId, { client }),
    );
  }

  public async revokeSuperAdmin(
    userId: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const client = await resolveAuthenticatedClient();
    return toLegacyVoidResult(
      await mutate(revokeSuperAdminMutation, userId, { client }),
    );
  }

  public async getCurrentPhysiologist(
    organizationId: string,
  ): Promise<SupabaseSuccess<PhysiologistInfo | null> | SupabaseError> {
    const client = await resolveAuthenticatedClient();
    return toLegacyResult(
      await query(getCurrentPhysiologistQuery, organizationId, { client }),
    );
  }

  public async addOrUpdateMembership(
    userId: string,
    organizationId: string,
    role: MemberRole,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    return toLegacyVoidResult(
      await mutate(addOrUpdateMembershipMutation, {
        userId,
        organizationId,
        role,
      }),
    );
  }

  public async getOrganizationsByUserId(
    userId: string,
  ): Promise<SupabaseSuccess<UserOrganizationSummary[]> | SupabaseError> {
    const client = await resolveAuthenticatedClient();
    return toLegacyResult(
      await query(getOrganizationsByUserIdQuery, userId, { client }),
    );
  }

  public async getTotalMemberCountForOrganizations(
    organizationIds: string[],
  ): Promise<SupabaseSuccess<number> | SupabaseError> {
    const client = await resolveAuthenticatedClient();
    return toLegacyResult(
      await query(getTotalMemberCountForOrganizationsQuery, organizationIds, {
        client,
      }),
    );
  }

  public async getMemberCountsByOrganizationIds(
    organizationIds: string[],
  ): Promise<SupabaseSuccess<Record<string, number>> | SupabaseError> {
    const client = await resolveAuthenticatedClient();
    return toLegacyResult(
      await query(getMemberCountsByOrganizationIdsQuery, organizationIds, {
        client,
      }),
    );
  }

  public async getOrganizationsWhereUserIsAdmin(
    userId: string,
  ): Promise<SupabaseSuccess<UserOrganizationSummary[]> | SupabaseError> {
    const client = await resolveAuthenticatedClient();
    return toLegacyResult(
      await query(getOrganizationsWhereUserIsAdminQuery, userId, { client }),
    );
  }
}
