import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineQuery, query, type DalResult } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';
import type { Profile } from '../schemas/profiles';
import type { SupabaseError, SupabaseSuccess } from '../query';

const dashboardStatusCountsSchema = z.object({
  pending: z.number(),
  invited: z.number(),
  active: z.number(),
  noProgram: z.number(),
  inProgram: z.number(),
});

export type DashboardStatusCounts = z.infer<typeof dashboardStatusCountsSchema>;

const dashboardStatusUserSchema = z.object({
  user_id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  avatar_url: z.string().nullable(),
  last_sign_in: z.string().nullable(),
  compliance: z.number().nullable().optional(),
});

export type DashboardStatusUser = z.infer<typeof dashboardStatusUserSchema>;

const userNeedingAttentionSchema = z.object({
  user_id: z.string(),
  first_name: z.string().nullable(),
  last_name: z.string().nullable(),
  email: z.string().nullable(),
  avatar_url: z.string().nullable(),
  last_sign_in: z.string().nullable(),
  compliance: z.number(),
  program_name: z.string().nullable(),
  organization_id: z.string().nullable(),
});

export type UserNeedingAttention = z.infer<typeof userNeedingAttentionSchema>;

/** Row shape from program_with_stats with profile join. */
export type ProgramWithStatsProfileRow = {
  user_id: string | null;
  compliance?: number | null;
  program_completion_percentage?: number | null;
  program_name: string | null;
  profile: Profile | Profile[] | null;
};

export function rowToUserNeedingAttention(
  row: ProgramWithStatsProfileRow,
): UserNeedingAttention | null {
  const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
  const val = row.compliance ?? row.program_completion_percentage ?? 0;
  if (!profile) return null;
  return profileStatToUser(profile, val, row.program_name);
}

export function profileStatToUser(
  profile: Profile,
  compliance: number,
  program_name: string | null,
  organization_id: string | null = null,
): UserNeedingAttention {
  return {
    user_id: profile.id,
    first_name: profile.first_name ?? null,
    last_name: profile.last_name ?? null,
    email: profile.email ?? null,
    avatar_url: profile.avatar_url ?? null,
    last_sign_in: profile.last_sign_in ?? null,
    compliance,
    program_name,
    organization_id,
  };
}

export type UserWithoutProgram = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  max_gate_unlocked: number | null;
};

export type UserWithProgramAndGroup = UserWithoutProgram & {
  organization_id: string;
};

const dashboardAnalyticsPointSchema = z.object({
  date: z.string(),
  value: z.number(),
});

export type DashboardAnalyticsPoint = z.infer<
  typeof dashboardAnalyticsPointSchema
>;

const dashboardAnalyticsSchema = z.object({
  statusCounts: z.object({
    pending: z.number(),
    invited: z.number(),
    active: z.number(),
    inProgram: z.number(),
    noProgram: z.number(),
    programCompleted: z.number(),
  }),
  series: z.object({
    active: z.array(dashboardAnalyticsPointSchema),
    inProgram: z.array(dashboardAnalyticsPointSchema),
    completion: z.array(dashboardAnalyticsPointSchema),
    overdue: z.array(dashboardAnalyticsPointSchema),
  }),
  deltas: z.object({
    active: z.number(),
    inProgram: z.number(),
    completion: z.number(),
    overdue: z.number(),
  }),
});

export type DashboardAnalytics = z.infer<typeof dashboardAnalyticsSchema>;

type DashboardAnalyticsRaw = {
  statusCounts?: Partial<
    Record<
      | 'pending'
      | 'invited'
      | 'active'
      | 'inProgram'
      | 'noProgram'
      | 'programCompleted',
      unknown
    >
  >;
  series?: Partial<
    Record<'active' | 'inProgram' | 'completion' | 'overdue', unknown>
  >;
  deltas?: Partial<
    Record<'active' | 'inProgram' | 'completion' | 'overdue', unknown>
  >;
};

export type AttentionUserRow = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  compliance: number;
  program_name: string | null;
};

const needsAttentionResultSchema = z.object({
  users: z.array(userNeedingAttentionSchema),
  total: z.number(),
});

export type NeedsAttentionResult = z.infer<typeof needsAttentionResultSchema>;

const aggregateComplianceSchema = z.object({
  compliance: z.number(),
  programCompletion: z.number(),
});

const complianceByOrganizationSchema = z.object({
  organizationId: z.string(),
  compliance: z.number(),
  programCompletion: z.number(),
});

type DashboardProfileStatus = 'pending' | 'invited' | 'active';

export type DashboardAnalyticsParams = {
  organizationIds?: string[] | null;
  from?: string;
  to?: string;
  bucket?: 'day' | 'week' | 'month';
};

export type DashboardNeedsAttentionParams = {
  organizationIds?: string[] | null;
};

export const dashboardKeys = {
  all: ['dashboard'] as const,
  statusCounts: () => [...dashboardKeys.all, 'status-counts'] as const,
  usersByStatus: (status: DashboardProfileStatus) =>
    [...dashboardKeys.all, 'users-by-status', status] as const,
  usersWithNoProgram: () =>
    [...dashboardKeys.all, 'users-with-no-program'] as const,
  usersInProgram: () => [...dashboardKeys.all, 'users-in-program'] as const,
  aggregateCompliance: () =>
    [...dashboardKeys.all, 'aggregate-compliance'] as const,
  usersNeedingAttention: () =>
    [...dashboardKeys.all, 'users-needing-attention'] as const,
  complianceByOrganizationIds: (organizationIds: string[]) =>
    [
      ...dashboardKeys.all,
      'compliance-by-organization',
      organizationIds,
    ] as const,
  usersWithLowComplianceByOrganizationIds: (
    organizationIds: string[],
    threshold: number,
  ) =>
    [
      ...dashboardKeys.all,
      'low-compliance-by-organization',
      organizationIds,
      threshold,
    ] as const,
  usersProgramCompleted: () =>
    [...dashboardKeys.all, 'users-program-completed'] as const,
  analytics: (params: DashboardAnalyticsParams) =>
    [...dashboardKeys.all, 'analytics', params] as const,
  needsAttention: (params: DashboardNeedsAttentionParams) =>
    [...dashboardKeys.all, 'needs-attention', params] as const,
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

function parseDashboardAnalytics(raw: DashboardAnalyticsRaw): DashboardAnalytics {
  const toPoints = (arr: unknown): DashboardAnalyticsPoint[] =>
    Array.isArray(arr)
      ? arr.map((p) => {
          const pt = p as { date: string; value: number };
          return { date: pt.date, value: Number(pt.value) };
        })
      : [];

  const c = raw.statusCounts ?? {};
  return {
    statusCounts: {
      pending: Number(c.pending ?? 0),
      invited: Number(c.invited ?? 0),
      active: Number(c.active ?? 0),
      inProgram: Number(c.inProgram ?? 0),
      noProgram: Number(c.noProgram ?? 0),
      programCompleted: Number(c.programCompleted ?? 0),
    },
    series: {
      active: toPoints(raw.series?.active),
      inProgram: toPoints(raw.series?.inProgram),
      completion: toPoints(raw.series?.completion),
      overdue: toPoints(raw.series?.overdue),
    },
    deltas: {
      active: Number(raw.deltas?.active ?? 0),
      inProgram: Number(raw.deltas?.inProgram ?? 0),
      completion: Number(raw.deltas?.completion ?? 0),
      overdue: Number(raw.deltas?.overdue ?? 0),
    },
  };
}

async function fetchStatusCounts(
  client: SupabaseClient<Database>,
): Promise<{
  data: DashboardStatusCounts | null;
  error: { message: string } | null;
}> {
  const { data: profiles, error } = await client
    .from('profiles')
    .select('status')
    .in('status', ['pending', 'invited', 'active']);

  if (error) return { data: null, error };

  const counts: DashboardStatusCounts = {
    pending: 0,
    invited: 0,
    active: 0,
    noProgram: 0,
    inProgram: 0,
  };

  profiles?.forEach((p) => {
    const status = (p.status || '').toLowerCase();
    if (status === 'pending') counts.pending++;
    else if (status === 'invited') counts.invited++;
    else if (status === 'active') counts.active++;
  });

  const { data: inProgramRows, error: inProgramError } = await client
    .from('program_assignment')
    .select('user_id')
    .eq('status', 'active')
    .not('user_id', 'is', null);

  if (inProgramError) return { data: null, error: inProgramError };

  const inProgramIds = new Set(
    (inProgramRows ?? [])
      .map((r) => (r as { user_id: string | null }).user_id)
      .filter(Boolean) as string[],
  );
  counts.inProgram = inProgramIds.size;

  const memberCount =
    (counts.pending ?? 0) + (counts.invited ?? 0) + (counts.active ?? 0);
  counts.noProgram = Math.max(0, memberCount - counts.inProgram);

  return { data: counts, error: null };
}

async function fetchUsersByStatus(
  client: SupabaseClient<Database>,
  status: DashboardProfileStatus,
): Promise<{
  data: DashboardStatusUser[] | null;
  error: { message: string } | null;
}> {
  const { data: profiles, error } = await client
    .from('profiles')
    .select('id, first_name, last_name, email, avatar_url, last_sign_in')
    .eq('status', status)
    .order('last_sign_in', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) return { data: null, error };

  const users: DashboardStatusUser[] = (profiles ?? []).map((p) => ({
    user_id: p.id,
    first_name: p.first_name ?? null,
    last_name: p.last_name ?? null,
    email: p.email ?? null,
    avatar_url: p.avatar_url ?? null,
    last_sign_in: p.last_sign_in ?? null,
  }));

  return { data: users, error: null };
}

async function fetchUsersWithNoProgram(
  client: SupabaseClient<Database>,
): Promise<{
  data: DashboardStatusUser[] | null;
  error: { message: string } | null;
}> {
  const { data: inProgramRows } = await client
    .from('program_assignment')
    .select('user_id')
    .eq('status', 'active')
    .not('user_id', 'is', null);

  const inProgramIds = new Set(
    (inProgramRows ?? [])
      .map((r) => (r as { user_id: string | null }).user_id)
      .filter(Boolean) as string[],
  );

  const { data: profiles, error } = await client
    .from('profiles')
    .select('id, first_name, last_name, email, avatar_url, last_sign_in')
    .in('status', ['pending', 'invited', 'active'])
    .order('last_sign_in', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (error) return { data: null, error };

  const users: DashboardStatusUser[] = (profiles ?? [])
    .filter((p) => !inProgramIds.has(p.id))
    .map((p) => ({
      user_id: p.id,
      first_name: p.first_name ?? null,
      last_name: p.last_name ?? null,
      email: p.email ?? null,
      avatar_url: p.avatar_url ?? null,
      last_sign_in: p.last_sign_in ?? null,
    }));

  return { data: users, error: null };
}

async function fetchUsersInProgram(
  client: SupabaseClient<Database>,
): Promise<{
  data: DashboardStatusUser[] | null;
  error: { message: string } | null;
}> {
  const { data: rows, error: viewError } = await client
    .from('program_with_stats')
    .select('user_id, compliance')
    .not('user_id', 'is', null);

  if (viewError) return { data: null, error: viewError };

  const byUser = new Map<string, number | null>();
  for (const r of rows ?? []) {
    const row = r as {
      user_id: string | null;
      compliance?: number | null;
    };
    const uid = row.user_id;
    if (!uid) continue;
    const compliance = row.compliance ?? 0;
    byUser.set(uid, compliance);
  }
  const userIds = [...byUser.keys()];

  if (userIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: profiles, error: profilesError } = await client
    .from('profiles')
    .select('id, first_name, last_name, email, avatar_url, last_sign_in')
    .in('id', userIds)
    .order('last_sign_in', { ascending: false, nullsFirst: false })
    .order('created_at', { ascending: false });

  if (profilesError) return { data: null, error: profilesError };

  const users: DashboardStatusUser[] = (profiles ?? [])
    .map((p) => ({
      user_id: p.id,
      first_name: p.first_name ?? null,
      last_name: p.last_name ?? null,
      email: p.email ?? null,
      avatar_url: p.avatar_url ?? null,
      last_sign_in: p.last_sign_in ?? null,
      compliance: byUser.get(p.id) ?? 0,
    }))
    .sort((a, b) => (b.compliance ?? 0) - (a.compliance ?? 0));

  return { data: users, error: null };
}

async function fetchAggregateCompliance(
  client: SupabaseClient<Database>,
): Promise<{
  data: z.infer<typeof aggregateComplianceSchema> | null;
  error: { message: string } | null;
}> {
  const { data, error } = await client
    .from('program_with_stats')
    .select('compliance, program_completion_percentage');

  if (error) return { data: null, error };

  if (!data || data.length === 0) {
    return { data: { compliance: 0, programCompletion: 0 }, error: null };
  }

  let totalCompliance = 0;
  let totalProgramCompletion = 0;
  let complianceCount = 0;
  let programCompletionCount = 0;

  data.forEach((row) => {
    const r = row as {
      compliance?: number;
      program_completion_percentage?: number;
    };
    const complianceVal = r.compliance ?? r.program_completion_percentage;
    if (typeof complianceVal === 'number') {
      totalCompliance += complianceVal;
      complianceCount++;
    }
    const completionVal = r.program_completion_percentage;
    if (typeof completionVal === 'number') {
      totalProgramCompletion += completionVal;
      programCompletionCount++;
    }
  });

  const compliance =
    complianceCount > 0 ? totalCompliance / complianceCount : 0;
  const programCompletion =
    programCompletionCount > 0
      ? totalProgramCompletion / programCompletionCount
      : 0;

  return { data: { compliance, programCompletion }, error: null };
}

async function fetchUsersNeedingAttention(
  client: SupabaseClient<Database>,
): Promise<{
  data: NeedsAttentionResult | null;
  error: { message: string } | null;
}> {
  const { data: rows, error } = await client
    .from('program_with_stats')
    .select(
      'user_id, compliance, program_completion_percentage, program_name, profile:profiles!program_assignment_user_id_fkey!inner(id, first_name, last_name, email, avatar_url, last_sign_in, created_at)',
    )
    .lt('compliance', 70)
    .order('compliance', { ascending: true });

  if (error) return { data: null, error };

  const byUser = new Map<
    string,
    { compliance: number; program_name: string | null; profile: Profile }
  >();

  for (const r of rows ?? []) {
    const row = r as ProgramWithStatsProfileRow;
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    const val = row.compliance ?? row.program_completion_percentage ?? 0;
    if (val >= 70 || !row.user_id || !profile) continue;
    const existing = byUser.get(row.user_id);
    if (!existing || val < existing.compliance) {
      byUser.set(row.user_id, {
        compliance: val,
        program_name: row.program_name,
        profile,
      });
    }
  }

  const users: UserNeedingAttention[] = [...byUser.values()].map(
    ({ compliance, program_name, profile }) =>
      profileStatToUser(profile, compliance, program_name),
  );

  return { data: { users, total: users.length }, error: null };
}

async function fetchComplianceAndCompletionByOrganizationIds(
  client: SupabaseClient<Database>,
  organizationIds: string[],
): Promise<{
  data: z.infer<typeof complianceByOrganizationSchema>[] | null;
  error: { message: string } | null;
}> {
  if (organizationIds.length === 0) {
    return { data: [], error: null };
  }

  const { data: rows, error } = await client
    .from('program_with_stats')
    .select('organization_id, compliance, program_completion_percentage')
    .in('organization_id', organizationIds);

  if (error) return { data: null, error };

  type Row = {
    organization_id: string | null;
    compliance?: number | null;
    program_completion_percentage?: number | null;
  };

  const byOrg = new Map<
    string,
    {
      complianceSum: number;
      complianceN: number;
      completionSum: number;
      completionN: number;
    }
  >();

  for (const r of rows ?? []) {
    const row = r as Row;
    const orgId = row.organization_id;
    if (!orgId) continue;

    const comp = row.compliance ?? row.program_completion_percentage ?? 0;
    const compPct =
      typeof row.program_completion_percentage === 'number'
        ? row.program_completion_percentage
        : comp;

    const cur = byOrg.get(orgId) ?? {
      complianceSum: 0,
      complianceN: 0,
      completionSum: 0,
      completionN: 0,
    };
    if (typeof comp === 'number') {
      cur.complianceSum += comp;
      cur.complianceN += 1;
    }
    if (typeof compPct === 'number') {
      cur.completionSum += compPct;
      cur.completionN += 1;
    }
    byOrg.set(orgId, cur);
  }

  const data = organizationIds.map((organizationId) => {
    const cur = byOrg.get(organizationId) ?? {
      complianceSum: 0,
      complianceN: 0,
      completionSum: 0,
      completionN: 0,
    };
    return {
      organizationId,
      compliance:
        cur.complianceN > 0 ? cur.complianceSum / cur.complianceN : 0,
      programCompletion:
        cur.completionN > 0 ? cur.completionSum / cur.completionN : 0,
    };
  });

  return { data, error: null };
}

async function fetchUsersWithLowComplianceByOrganizationIds(
  client: SupabaseClient<Database>,
  organizationIds: string[],
  threshold: number,
): Promise<{
  data: NeedsAttentionResult | null;
  error: { message: string } | null;
}> {
  if (organizationIds.length === 0) {
    return { data: { users: [], total: 0 }, error: null };
  }

  const { data: rows, error } = await client
    .from('program_with_stats')
    .select(
      'user_id, organization_id, compliance, program_completion_percentage, program_name, profile:profiles!program_assignment_user_id_fkey!inner(id, first_name, last_name, email, avatar_url, last_sign_in, created_at)',
    )
    .in('organization_id', organizationIds)
    .order('compliance', { ascending: true });

  if (error) return { data: null, error };

  const orgSet = new Set(organizationIds);
  const byUser = new Map<
    string,
    {
      compliance: number;
      program_name: string | null;
      profile: Profile;
      organization_id: string | null;
    }
  >();

  for (const r of rows ?? []) {
    const row = r as ProgramWithStatsProfileRow & {
      organization_id?: string | null;
    };
    if (row.organization_id && !orgSet.has(row.organization_id)) continue;
    const profile = Array.isArray(row.profile) ? row.profile[0] : row.profile;
    const val = row.compliance ?? row.program_completion_percentage ?? 0;
    if (val >= threshold || !row.user_id || !profile) continue;
    const existing = byUser.get(row.user_id);
    if (!existing || val < existing.compliance) {
      byUser.set(row.user_id, {
        compliance: val,
        program_name: row.program_name ?? null,
        profile,
        organization_id: row.organization_id ?? null,
      });
    }
  }

  const users: UserNeedingAttention[] = [...byUser.values()].map(
    ({ compliance, program_name, profile, organization_id }) =>
      profileStatToUser(profile, compliance, program_name, organization_id),
  );

  return { data: { users, total: users.length }, error: null };
}

async function fetchUsersProgramCompleted(
  client: SupabaseClient<Database>,
): Promise<{
  data: NeedsAttentionResult | null;
  error: { message: string } | null;
}> {
  const { data: rows, error } = await client
    .from('program_with_stats')
    .select(
      'user_id, compliance, program_completion_percentage, program_name, profile:profiles!program_assignment_user_id_fkey!inner(id, first_name, last_name, email, avatar_url, last_sign_in, created_at)',
    )
    .eq('program_completed', true)
    .order('compliance', { ascending: true });

  if (error) return { data: null, error };

  const users: UserNeedingAttention[] = (rows ?? [])
    .map((r) => rowToUserNeedingAttention(r as ProgramWithStatsProfileRow))
    .filter((u): u is UserNeedingAttention => u != null);

  return { data: { users, total: users.length }, error: null };
}

/** Counts of patients by status (pending, invited, active). */
export const getDashboardStatusCounts = defineQuery({
  key: dashboardKeys.statusCounts,
  schema: dashboardStatusCountsSchema,
  client: 'admin',
  execute: (client) => fetchStatusCounts(client),
});

/** Users by profile status (pending, invited, or active). */
export const getDashboardUsersByStatus = defineQuery({
  key: dashboardKeys.usersByStatus,
  schema: z.array(dashboardStatusUserSchema),
  client: 'admin',
  execute: (client, status: DashboardProfileStatus) =>
    fetchUsersByStatus(client, status),
});

/** Users with status in [pending, invited, active] and no active program assignment. */
export const getDashboardUsersWithNoProgram = defineQuery({
  key: dashboardKeys.usersWithNoProgram,
  schema: z.array(dashboardStatusUserSchema),
  client: 'admin',
  execute: (client) => fetchUsersWithNoProgram(client),
});

/** Users in program from program_with_stats (one row per program-user pair). */
export const getDashboardUsersInProgram = defineQuery({
  key: dashboardKeys.usersInProgram,
  schema: z.array(dashboardStatusUserSchema),
  client: 'admin',
  execute: (client) => fetchUsersInProgram(client),
});

/** Aggregate compliance and program completion from program_with_stats view. */
export const getDashboardAggregateCompliance = defineQuery({
  key: dashboardKeys.aggregateCompliance,
  schema: aggregateComplianceSchema,
  client: 'admin',
  execute: (client) => fetchAggregateCompliance(client),
});

/** Users needing attention (compliance < 70%). */
export const getDashboardUsersNeedingAttention = defineQuery({
  key: dashboardKeys.usersNeedingAttention,
  schema: needsAttentionResultSchema,
  client: 'admin',
  execute: (client) => fetchUsersNeedingAttention(client),
});

/** Per-organization aggregate compliance and program completion. */
export const getComplianceAndCompletionByOrganizationIdsQuery = defineQuery({
  key: dashboardKeys.complianceByOrganizationIds,
  schema: z.array(complianceByOrganizationSchema),
  client: 'admin',
  execute: (client, organizationIds: string[]) =>
    fetchComplianceAndCompletionByOrganizationIds(client, organizationIds),
});

/** Users with low compliance in the given organizations. */
export const getUsersWithLowComplianceByOrganizationIdsQuery = defineQuery({
  key: dashboardKeys.usersWithLowComplianceByOrganizationIds,
  schema: needsAttentionResultSchema,
  client: 'admin',
  execute: (
    client,
    organizationIds: string[],
    threshold: number = 70,
  ) => fetchUsersWithLowComplianceByOrganizationIds(client, organizationIds, threshold),
});

/** Users with program_completed = true from program_with_stats. */
export const getDashboardUsersProgramCompleted = defineQuery({
  key: dashboardKeys.usersProgramCompleted,
  schema: needsAttentionResultSchema,
  client: 'admin',
  execute: (client) => fetchUsersProgramCompleted(client),
});

/** Tile time series and status counts from get_dashboard_analytics. */
export const getDashboardAnalyticsQuery = defineQuery({
  key: dashboardKeys.analytics,
  schema: dashboardAnalyticsSchema,
  client: 'admin',
  execute: async (client, params: DashboardAnalyticsParams) => {
    const { data, error } = await client.rpc('get_dashboard_analytics', {
      p_organization_ids: params.organizationIds ?? undefined,
      p_from: params.from ?? undefined,
      p_to: params.to ?? undefined,
      p_bucket: params.bucket ?? 'day',
    });

    if (error) return { data: null, error };

    return {
      data: parseDashboardAnalytics(data as DashboardAnalyticsRaw),
      error: null,
    };
  },
});

/** Needs-attention worklist from get_dashboard_needs_attention. */
export const getDashboardNeedsAttentionQuery = defineQuery({
  key: dashboardKeys.needsAttention,
  schema: needsAttentionResultSchema,
  client: 'admin',
  execute: async (client, params: DashboardNeedsAttentionParams) => {
    const { data, error } = await client.rpc('get_dashboard_needs_attention', {
      p_organization_ids: params.organizationIds ?? undefined,
    });

    if (error) return { data: null, error };

    const raw = data as { users: AttentionUserRow[]; total: number };
    const users: UserNeedingAttention[] = (raw.users ?? []).map((u) => ({
      user_id: u.user_id,
      first_name: u.first_name ?? null,
      last_name: u.last_name ?? null,
      email: u.email ?? null,
      avatar_url: u.avatar_url ?? null,
      last_sign_in: null,
      compliance: Number(u.compliance ?? 0),
      program_name: u.program_name ?? null,
      organization_id: null,
    }));

    return {
      data: { users, total: users.length },
      error: null,
    };
  },
});

/**
 * @deprecated Home page / admin profile slices — use DAL queries directly.
 * Retained until page.tsx and users admin partials migrate.
 */
export class DashboardQuery {
  public async getStatusCounts(): Promise<
    SupabaseSuccess<DashboardStatusCounts> | SupabaseError
  > {
    return toLegacyResult(await query(getDashboardStatusCounts));
  }

  public async getUsersByStatus(
    status: 'pending' | 'invited' | 'active',
  ): Promise<SupabaseSuccess<DashboardStatusUser[]> | SupabaseError> {
    return toLegacyResult(await query(getDashboardUsersByStatus, status));
  }

  public async getUsersWithNoProgram(): Promise<
    SupabaseSuccess<DashboardStatusUser[]> | SupabaseError
  > {
    return toLegacyResult(await query(getDashboardUsersWithNoProgram));
  }

  public async getUsersInProgram(): Promise<
    SupabaseSuccess<DashboardStatusUser[]> | SupabaseError
  > {
    return toLegacyResult(await query(getDashboardUsersInProgram));
  }

  public async getAggregateCompliance(): Promise<
    | SupabaseSuccess<{
        compliance: number;
        programCompletion: number;
      }>
    | SupabaseError
  > {
    return toLegacyResult(await query(getDashboardAggregateCompliance));
  }

  public async getUsersNeedingAttention(): Promise<
    SupabaseSuccess<NeedsAttentionResult> | SupabaseError
  > {
    return toLegacyResult(await query(getDashboardUsersNeedingAttention));
  }

  public async getComplianceAndCompletionByOrganizationIds(
    organizationIds: string[],
  ): Promise<
    | SupabaseSuccess<
        Array<{
          organizationId: string;
          compliance: number;
          programCompletion: number;
        }>
      >
    | SupabaseError
  > {
    return toLegacyResult(
      await query(
        getComplianceAndCompletionByOrganizationIdsQuery,
        organizationIds,
      ),
    );
  }

  public async getUsersWithLowComplianceByOrganizationIds(
    organizationIds: string[],
    threshold = 70,
  ): Promise<SupabaseSuccess<NeedsAttentionResult> | SupabaseError> {
    return toLegacyResult(
      await query(
        getUsersWithLowComplianceByOrganizationIdsQuery,
        organizationIds,
        threshold,
      ),
    );
  }

  public async getUsersProgramCompleted(): Promise<
    SupabaseSuccess<NeedsAttentionResult> | SupabaseError
  > {
    return toLegacyResult(await query(getDashboardUsersProgramCompleted));
  }

  public async getDashboardAnalytics(
    params: DashboardAnalyticsParams,
  ): Promise<SupabaseSuccess<DashboardAnalytics> | SupabaseError> {
    return toLegacyResult(await query(getDashboardAnalyticsQuery, params));
  }

  public async getNeedsAttention(
    params: DashboardNeedsAttentionParams,
  ): Promise<SupabaseSuccess<NeedsAttentionResult> | SupabaseError> {
    return toLegacyResult(await query(getDashboardNeedsAttentionQuery, params));
  }
}
