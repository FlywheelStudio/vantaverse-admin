import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';

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
      .select('id, first_name, last_name, email, avatar_url')
      .eq('status', status);

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
      .select('id, first_name, last_name, email, avatar_url')
      .in('status', ['pending', 'invited', 'active']);

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
      }));

    return { success: true, data: users };
  }

  /**
   * Get users with at least one active program assignment.
   */
  public async getUsersInProgram(): Promise<
    SupabaseSuccess<DashboardStatusUser[]> | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data: assignments, error: assignError } = await supabase
      .from('program_assignment')
      .select('user_id')
      .eq('status', 'active')
      .not('user_id', 'is', null);

    if (assignError) {
      return this.parseResponsePostgresError(
        assignError,
        'Failed to get users in program',
      );
    }

    const userIds = [
      ...new Set(
        (assignments ?? [])
          .map((r) => (r as { user_id: string | null }).user_id)
          .filter(Boolean) as string[],
      ),
    ];

    if (userIds.length === 0) {
      return { success: true, data: [] };
    }

    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, email, avatar_url')
      .in('id', userIds);

    if (profilesError) {
      return this.parseResponsePostgresError(
        profilesError,
        'Failed to get profiles for users in program',
      );
    }

    const users: DashboardStatusUser[] = (profiles ?? []).map((p) => ({
      user_id: p.id,
      first_name: p.first_name ?? null,
      last_name: p.last_name ?? null,
      email: p.email ?? null,
      avatar_url: p.avatar_url ?? null,
    }));

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

  /**
   * Get users with program_completed = true from program_with_stats.
   */
  public async getUsersProgramCompleted(): Promise<
    | SupabaseSuccess<{ users: UserNeedingAttention[]; total: number }>
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data: statsData, error: statsError } = await supabase
      .from('program_with_stats')
      .select(
        'user_id, compliance, program_completion_percentage, program_name',
      )
      .eq('program_completed', true);

    if (statsError) {
      return this.parseResponsePostgresError(
        statsError,
        'Failed to get users with program completed',
      );
    }

    const completedUsersMap = new Map<
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
      if (r.user_id) {
        if (!completedUsersMap.has(r.user_id)) {
          completedUsersMap.set(r.user_id, {
            compliance: val,
            program_name: r.program_name,
          });
        } else {
          const existing = completedUsersMap.get(r.user_id)!;
          if (val > existing.compliance) {
            completedUsersMap.set(r.user_id, {
              compliance: val,
              program_name: r.program_name,
            });
          }
        }
      }
    });

    const userIds = [...completedUsersMap.keys()];

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
        'Failed to get profiles for users with program completed',
      );
    }

    const users: UserNeedingAttention[] = (profiles ?? []).map((p) => {
      const stat = completedUsersMap.get(p.id);
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

    users.sort((a, b) => b.compliance - a.compliance);

    return {
      success: true,
      data: { users, total: users.length },
    };
  }
}
