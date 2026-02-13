import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import { Profile } from '../schemas/profiles';

export type DashboardStatusCounts = {
  pending: number;
  invited: number;
  active: number;
  noProgram: number;
  inProgram: number;
};

export type DashboardStatusUser = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  last_sign_in: string | null;
  compliance?: number | null;
};

export type UserNeedingAttention = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  last_sign_in: string | null;
  compliance: number;
  program_name: string | null;
  organization_id: string | null;
};

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

export class DashboardQuery extends SupabaseQuery {
  /**
   * Get counts of patients by status (pending, invited, active).
   */
  public async getStatusCounts(): Promise<
    SupabaseSuccess<DashboardStatusCounts> | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('status')
      .in('status', ['pending', 'invited', 'active']);

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get dashboard status counts',
      );
    }

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

    const { data: inProgramRows, error: inProgramError } = await supabase
      .from('program_assignment')
      .select('user_id')
      .eq('status', 'active')
      .not('user_id', 'is', null);

    if (inProgramError) {
      return this.parseResponsePostgresError(
        inProgramError,
        'Failed to get in-program user count',
      );
    }

    const inProgramIds = new Set(
      (inProgramRows ?? [])
        .map((r) => (r as { user_id: string | null }).user_id)
        .filter(Boolean) as string[],
    );
    counts.inProgram = inProgramIds.size;

    const memberCount =
      (counts.pending ?? 0) + (counts.invited ?? 0) + (counts.active ?? 0);
    counts.noProgram = Math.max(0, memberCount - counts.inProgram);

    return { success: true, data: counts };
  }

  /**
   * Get users by profile status (pending, invited, or active).
   */
  public async getUsersByStatus(
    status: 'pending' | 'invited' | 'active',
  ): Promise<SupabaseSuccess<DashboardStatusUser[]> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url, last_sign_in')
      .eq('status', status)
      .order('last_sign_in', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        `Failed to get users by status ${status}`,
      );
    }

    const users: DashboardStatusUser[] = (profiles ?? []).map((p) => ({
      user_id: p.id,
      first_name: p.first_name ?? null,
      last_name: p.last_name ?? null,
      email: p.email ?? null,
      avatar_url: p.avatar_url ?? null,
      last_sign_in: p.last_sign_in ?? null,
    }));

    return { success: true, data: users };
  }

  /**
   * Get users with status in [pending, invited, active] and no active program assignment.
   */
  public async getUsersWithNoProgram(): Promise<
    SupabaseSuccess<DashboardStatusUser[]> | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data: inProgramRows } = await supabase
      .from('program_assignment')
      .select('user_id')
      .eq('status', 'active')
      .not('user_id', 'is', null);

    const inProgramIds = new Set(
      (inProgramRows ?? [])
        .map((r) => (r as { user_id: string | null }).user_id)
        .filter(Boolean) as string[],
    );

    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url, last_sign_in')
      .in('status', ['pending', 'invited', 'active'])
      .order('last_sign_in', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get users with no program',
      );
    }

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

    return { success: true, data: users };
  }

  /**
   * Get users in program from program_with_stats (one row per program-user pair).
   * Includes compliance when available from the view.
   */
  public async getUsersInProgram(): Promise<
    SupabaseSuccess<DashboardStatusUser[]> | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data: rows, error: viewError } = await supabase
      .from('program_with_stats')
      .select('user_id, compliance')
      .not('user_id', 'is', null);

    if (viewError) {
      return this.parseResponsePostgresError(
        viewError,
        'Failed to get users in program',
      );
    }

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
      return { success: true, data: [] };
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url, last_sign_in')
      .in('id', userIds)
      .order('last_sign_in', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false });

    if (profilesError) {
      return this.parseResponsePostgresError(
        profilesError,
        'Failed to get profiles for users in program',
      );
    }

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
      .sort((a, b) => b.compliance - a.compliance);

    return { success: true, data: users };
  }

  /**
   * Get aggregate compliance and program completion from program_with_stats view.
   */
  public async getAggregateCompliance(): Promise<
    | SupabaseSuccess<{
        compliance: number;
        programCompletion: number;
      }>
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data, error } = await supabase
      .from('program_with_stats')
      .select('compliance, program_completion_percentage');

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get aggregate compliance',
      );
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        data: { compliance: 0, programCompletion: 0 },
      };
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
    return {
      success: true,
      data: { compliance, programCompletion },
    };
  }

  /**
   * Get users needing attention (compliance < 70%).
   */
  public async getUsersNeedingAttention(): Promise<
    | SupabaseSuccess<{ users: UserNeedingAttention[]; total: number }>
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data: rows, error } = await supabase
      .from('program_with_stats')
      .select(
        'user_id, compliance, program_completion_percentage, program_name, profile:profiles!program_assignment_user_id_fkey!inner(id, first_name, last_name, email, avatar_url, last_sign_in, created_at)',
      )
      .lt('compliance', 70)
      .order('compliance', { ascending: true });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get users needing attention',
      );
    }

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

    return {
      success: true,
      data: { users, total: users.length },
    };
  }

  /**
   * Get per-organization aggregate compliance and program completion from program_with_stats.
   * Returns one row per org with avg compliance and avg program_completion_percentage.
   */
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
    if (organizationIds.length === 0) {
      return { success: true, data: [] };
    }

    const supabase = await this.getClient('service_role');

    const { data: rows, error } = await supabase
      .from('program_with_stats')
      .select('organization_id, compliance, program_completion_percentage')
      .in('organization_id', organizationIds);

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get compliance by organization',
      );
    }

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

    return { success: true, data };
  }

  /**
   * Get users with low compliance in the given organizations.
   */
  public async getUsersWithLowComplianceByOrganizationIds(
    organizationIds: string[],
    threshold = 70,
  ): Promise<
    | SupabaseSuccess<{ users: UserNeedingAttention[]; total: number }>
    | SupabaseError
  > {
    if (organizationIds.length === 0) {
      return { success: true, data: { users: [], total: 0 } };
    }

    const supabase = await this.getClient('service_role');

    const { data: rows, error } = await supabase
      .from('program_with_stats')
      .select(
        'user_id, organization_id, compliance, program_completion_percentage, program_name, profile:profiles!program_assignment_user_id_fkey!inner(id, first_name, last_name, email, avatar_url, last_sign_in, created_at)',
      )
      .in('organization_id', organizationIds)
      .order('compliance', { ascending: true });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get users with low compliance by organization',
      );
    }

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

    return {
      success: true,
      data: { users, total: users.length },
    };
  }

  /**
   * Get users with program_completed = true from program_with_stats.
   */
  public async getUsersProgramCompleted(): Promise<
    | SupabaseSuccess<{ users: UserNeedingAttention[]; total: number }>
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data: rows, error } = await supabase
      .from('program_with_stats')
      .select(
        'user_id, compliance, program_completion_percentage, program_name, profile:profiles!program_assignment_user_id_fkey!inner(id, first_name, last_name, email, avatar_url, last_sign_in, created_at)',
      )
      .eq('program_completed', true)
      .order('compliance', { ascending: true });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get users with program completed',
      );
    }

    const users: UserNeedingAttention[] = (rows ?? [])
      .map((r) => rowToUserNeedingAttention(r as ProgramWithStatsProfileRow))
      .filter((u): u is UserNeedingAttention => u != null);

    return {
      success: true,
      data: { users, total: users.length },
    };
  }
}