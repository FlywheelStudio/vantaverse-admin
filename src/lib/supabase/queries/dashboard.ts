import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';

export type DashboardStatusCounts = {
  pending: number;
  invited: number;
  active: number;
};

export type UserNeedingAttention = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  compliance: number;
  program_name: string | null;
};

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
    };

    profiles?.forEach((p) => {
      const status = (p.status || '').toLowerCase();
      if (status === 'pending') counts.pending++;
      else if (status === 'invited') counts.invited++;
      else if (status === 'active') counts.active++;
    });

    return { success: true, data: counts };
  }

  /**
   * Get aggregate compliance percentage from program_with_stats view.
   */
  public async getAggregateCompliance(): Promise<
    SupabaseSuccess<number | null> | SupabaseError
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
      return { success: true, data: null };
    }

    let totalCompliance = 0;
    let count = 0;

    data.forEach((row) => {
      const value =
        (row as { compliance?: number; program_completion_percentage?: number })
          .compliance ??
        (row as { program_completion_percentage?: number })
          .program_completion_percentage;
      if (typeof value === 'number') {
        totalCompliance += value;
        count++;
      }
    });

    const aggregate = count > 0 ? totalCompliance / count : null;
    return { success: true, data: aggregate };
  }

  /**
   * Get users needing attention (compliance < 70%).
   */
  public async getUsersNeedingAttention(): Promise<
    | SupabaseSuccess<{ users: UserNeedingAttention[]; total: number }>
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data: statsData, error: statsError } = await supabase
      .from('program_with_stats')
      .select(
        'user_id, compliance, program_completion_percentage, program_name',
      );

    if (statsError) {
      return this.parseResponsePostgresError(
        statsError,
        'Failed to get users needing attention',
      );
    }

    const lowComplianceUsersMap = new Map<
      string,
      { compliance: number; program_name: string | null }
    >();

    statsData?.forEach((row) => {
      const r = row as {
        user_id: string | null;
        compliance?: number;
        program_completion_percentage?: number;
        program_name: string | null;
      };
      const val = r.compliance ?? r.program_completion_percentage ?? 0;
      if (val < 70 && r.user_id) {
        if (!lowComplianceUsersMap.has(r.user_id)) {
          lowComplianceUsersMap.set(r.user_id, {
            compliance: val,
            program_name: r.program_name,
          });
        } else {
          const existing = lowComplianceUsersMap.get(r.user_id)!;
          if (val < existing.compliance) {
            lowComplianceUsersMap.set(r.user_id, {
              compliance: val,
              program_name: r.program_name,
            });
          }
        }
      }
    });

    const userIds = [...lowComplianceUsersMap.keys()];

    if (userIds.length === 0) {
      return { success: true, data: { users: [], total: 0 } };
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      return this.parseResponsePostgresError(
        profilesError,
        'Failed to get profiles for users needing attention',
      );
    }

    const users: UserNeedingAttention[] = (profiles ?? []).map((p) => {
      const stat = lowComplianceUsersMap.get(p.id);
      return {
        user_id: p.id,
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
        email: p.email ?? null,
        avatar_url: p.avatar_url ?? null,
        compliance: stat?.compliance ?? 0,
        program_name: stat?.program_name ?? null,
      };
    });

    users.sort((a, b) => a.compliance - b.compliance);

    return {
      success: true,
      data: { users, total: users.length },
    };
  }
}
