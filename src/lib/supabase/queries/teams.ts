import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import { teamSchema, type Team } from '../schemas/teams';

export class TeamsQuery extends SupabaseQuery {
  /**
   * Get all teams for an organization
   * @param organizationId - The organization id
   * @returns Success with teams array or error
   */
  public async getByOrganizationId(
    organizationId: string,
  ): Promise<SupabaseSuccess<Team[]> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('teams')
      .select(
        '*, team_membership(id, user_id, profiles!inner(id, avatar_url, first_name, last_name, username, email))',
      )
      .eq('organization_id', organizationId)
      .order('created_at', { ascending: false });

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to get teams');
    }

    if (!data) {
      return {
        success: true,
        data: [],
      };
    }

    // Transform data: team_membership now includes profile data
    type RawTeamMember = {
      id: string;
      user_id: string;
      profiles: {
        id: string;
        avatar_url: string | null;
        first_name: string | null;
        last_name: string | null;
        username: string | null;
        email: string | null;
      } | null;
    };

    type RawTeam = Omit<Team, 'members_count' | 'member_ids' | 'members'> & {
      team_membership: RawTeamMember[] | null;
    };

    const transformedData = (data as RawTeam[]).map((team) => {
      const { team_membership, ...teamData } = team;
      // Transform to include profile data
      const members =
        Array.isArray(team_membership) && team_membership.length > 0
          ? team_membership.map((m) => ({
              id: m.id,
              user_id: m.user_id,
              profile: m.profiles
                ? {
                    id: m.profiles.id,
                    avatar_url: m.profiles.avatar_url,
                    first_name: m.profiles.first_name,
                    last_name: m.profiles.last_name,
                    username: m.profiles.username,
                    email: m.profiles.email,
                  }
                : null,
            }))
          : [];
      const memberIds = members.map((m) => m.id);
      return {
        ...teamData,
        members_count: members.length,
        member_ids: memberIds.length > 0 ? memberIds : undefined,
        members: members.length > 0 ? members : undefined,
      };
    });

    const result = teamSchema.array().safeParse(transformedData);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Create a new team
   * @param organizationId - The organization id
   * @param name - The team name
   * @param description - Optional team description
   * @param notes - Optional team notes
   * @returns Success with created team or error
   */
  public async create(
    organizationId: string,
    name: string,
    description?: string | null,
    notes?: string | null,
  ): Promise<SupabaseSuccess<Team> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('teams')
      .insert({
        organization_id: organizationId,
        name: name.trim(),
        description: description?.trim() || null,
        notes: notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to create team');
    }

    if (!data) {
      return {
        success: false,
        error: 'Failed to create team',
      };
    }

    const result = teamSchema.safeParse({
      ...data,
      members_count: 0,
      members: [],
    });

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Update a team
   * @param id - The team id
   * @param data - The data to update
   * @returns Success with updated team or error
   */
  public async update(
    id: string,
    data: Partial<Team>,
  ): Promise<SupabaseSuccess<Team> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data: updatedData, error } = await supabase
      .from('teams')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to update team');
    }

    if (!updatedData) {
      return {
        success: false,
        error: 'Failed to update team',
      };
    }

    const result = teamSchema.safeParse(updatedData);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Delete a team
   * @param id - The team id
   * @returns Success or error
   */
  public async delete(
    id: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { error } = await supabase.from('teams').delete().eq('id', id);

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to delete team');
    }

    return {
      success: true,
      data: undefined,
    };
  }
}
