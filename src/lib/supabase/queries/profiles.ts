import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import { profileSchema, type Profile } from '../schemas/profiles';

export type ProfileWithMemberships = Profile & {
  orgMemberships: Array<{ orgId: string; orgName: string }>;
  teamMemberships: Array<{
    teamId: string;
    teamName: string;
    orgId: string;
    orgName: string;
  }>;
};

export class ProfilesQuery extends SupabaseQuery {
  /**
   * Get the authenticated user's profile
   * @returns Success with profile data or error
   */
  public async getAuthProfile(): Promise<
    SupabaseSuccess<Profile> | SupabaseError
  > {
    const supabase = await this.getClient('authenticated_user');
    const user = await this.getUser();

    if (!user) {
      return {
        success: false,
        error: 'Unauthenticated',
      };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get authenticated user profile',
      );
    }

    if (!data) {
      return {
        success: false,
        error: 'Profile not found',
      };
    }

    const result = profileSchema.safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Get all profiles with their organization and team memberships
   * @returns Success with profiles array including memberships or error
   */
  public async getAllWithMemberships(): Promise<
    SupabaseSuccess<ProfileWithMemberships[]> | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data, error } = await supabase
      .from('profiles')
      .select(
        '*, organization_members(organization_id, organizations!inner(id, name)), team_membership(team_id, teams!inner(id, name, organization_id, organizations!inner(id, name)))',
      )
      .order('created_at', { ascending: false });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get profiles with memberships',
      );
    }

    if (!data) {
      return {
        success: true,
        data: [],
      };
    }

    type RawOrgMember = {
      organization_id: string;
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

    const transformedData = (data as RawProfile[]).map((profile) => {
      const { organization_members, team_membership, ...profileData } = profile;

      const orgMemberships =
        Array.isArray(organization_members) && organization_members.length > 0
          ? organization_members
              .filter((om) => om.organizations !== null)
              .map((om) => ({
                orgId: om.organization_id,
                orgName: om.organizations!.name,
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

    return {
      success: true,
      data: transformedData,
    };
  }
}
