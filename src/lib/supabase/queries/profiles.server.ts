import 'server-only';

import { formatDalError, mutate, query } from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import { createAdminClient } from '@/lib/supabase/core/admin';
import { createClient } from '@/lib/supabase/core/server';
import {
  profileSchema,
  type Profile,
  type ProfileWithStats,
} from '../schemas/profiles';
import {
  toLegacyResult,
  type SupabaseError,
  type SupabaseSuccess,
} from '../result';
import type { PaginatedResult } from './exercise-templates';
import {
  createQuickAddMutation,
  deleteAuthUserMutation,
  getAllEmailsForImportQuery,
  getAllWithMembershipsQuery,
  getMemberFilterCountsQuery,
  getProfileByIdQuery,
  getProfilesByEmailsForImportQuery,
  listProfilesFilteredQuery,
  listProfilesWithStatsQuery,
  type CreateQuickAddInput,
  type ListProfilesFilteredInput,
  type ListProfilesWithStatsInput,
  type MemberFilterCounts,
  type ProfileWithMemberships,
  type SetOnboardingStateResult,
  type SetOnboardingStateTarget,
  setOnboardingStateMutation,
  updateProfileMutation,
} from './profiles';

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

    const result = await queryWithSession(getProfileByIdQuery, user.id);
    const [err, data] = result;
    if (err) {
      return { success: false, error: formatDalError(err) };
    }
    if (!data) {
      return { success: false, error: 'Profile not found' };
    }

    return { success: true, data };
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
    return toLegacyResult(await query(getAllWithMembershipsQuery, { client }));
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
