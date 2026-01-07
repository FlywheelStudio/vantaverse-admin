import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import {
  profileSchema,
  profileWithStatsSchema,
  type Profile,
  type ProfileWithStats,
} from '../schemas/profiles';

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
      .from('profiles_with_stats')
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
   * Get a user profile by ID
   * @param id - The user ID to fetch
   * @returns Success with profile data or error
   */
  public async getUserById(
    id: string,
  ): Promise<SupabaseSuccess<ProfileWithStats> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    const { data, error } = await supabase
      .from('profiles_with_stats')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get user profile by ID',
      );
    }

    if (!data) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    const result = profileWithStatsSchema.safeParse(data);

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

  /**
   * Get list of profiles with optional filtering
   * @param filters - Optional filters (organization_id, team_id, journey_phase)
   * @returns Success with profiles array or error
   */
  public async getList(filters?: {
    organization_id?: string;
    team_id?: string;
    journey_phase?: string;
  }): Promise<SupabaseSuccess<Profile[]> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    let userIds: string[] | null = null;

    // Filter by organization_id via organization_members
    if (filters?.organization_id) {
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', filters.organization_id)
        .eq('is_active', true);

      if (orgMembers && orgMembers.length > 0) {
        userIds = orgMembers.map((m) => m.user_id);
      } else {
        return {
          success: true,
          data: [],
        };
      }
    }

    // Filter by team_id via team_membership
    if (filters?.team_id) {
      const { data: teamMembers } = await supabase
        .from('team_membership')
        .select('user_id')
        .eq('team_id', filters.team_id);

      if (teamMembers && teamMembers.length > 0) {
        const teamUserIds = teamMembers.map((m) => m.user_id);
        // If we already have userIds from org filter, intersect them
        if (userIds) {
          userIds = userIds.filter((id) => teamUserIds.includes(id));
          if (userIds.length === 0) {
            return {
              success: true,
              data: [],
            };
          }
        } else {
          userIds = teamUserIds;
        }
      } else {
        return {
          success: true,
          data: [],
        };
      }
    }

    let query = supabase.from('profiles').select('*');

    if (userIds) {
      query = query.in('id', userIds);
    }

    // Filter by journey_phase
    if (filters?.journey_phase) {
      query = query.eq('journey_phase', filters.journey_phase);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get profiles list',
      );
    }

    if (!data) {
      return {
        success: true,
        data: [],
      };
    }

    const result = profileSchema.array().safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Get list of profiles with stats and optional filtering
   * @param filters - Optional filters (organization_id, team_id, journey_phase)
   * @returns Success with profiles with stats array or error
   */
  public async getListWithStats(filters?: {
    organization_id?: string;
    team_id?: string;
    journey_phase?: string;
  }): Promise<SupabaseSuccess<ProfileWithStats[]> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    // Get super admin organization ID
    const { data: superAdminOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('is_super_admin', true)
      .maybeSingle();

    const superAdminOrgId = superAdminOrg?.id;

    let userIds: string[] | null = null;

    // Filter by organization_id via organization_members
    if (filters?.organization_id) {
      const { data: orgMembers } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', filters.organization_id)
        .eq('is_active', true);

      if (orgMembers && orgMembers.length > 0) {
        userIds = orgMembers.map((m) => m.user_id);
      } else {
        return {
          success: true,
          data: [],
        };
      }
    }

    // Filter by team_id via team_membership
    if (filters?.team_id) {
      const { data: teamMembers } = await supabase
        .from('team_membership')
        .select('user_id')
        .eq('team_id', filters.team_id);

      if (teamMembers && teamMembers.length > 0) {
        const teamUserIds = teamMembers.map((m) => m.user_id);
        // If we already have userIds from org filter, intersect them
        if (userIds) {
          userIds = userIds.filter((id) => teamUserIds.includes(id));
          if (userIds.length === 0) {
            return {
              success: true,
              data: [],
            };
          }
        } else {
          userIds = teamUserIds;
        }
      } else {
        return {
          success: true,
          data: [],
        };
      }
    }

    let query = supabase.from('profiles_with_stats').select('*');

    if (userIds) {
      query = query.in('id', userIds);
    }

    // Filter by journey_phase
    if (filters?.journey_phase) {
      query = query.eq('journey_phase', filters.journey_phase);
    }

    const { data, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get profiles with stats',
      );
    }

    if (!data) {
      return {
        success: true,
        data: [],
      };
    }

    // Get super admin user IDs if super admin org exists
    let superAdminUserIds: Set<string> = new Set();
    if (superAdminOrgId) {
      const { data: superAdminMembers } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', superAdminOrgId)
        .eq('is_active', true);

      if (superAdminMembers) {
        superAdminUserIds = new Set(superAdminMembers.map((m) => m.user_id));
      }
    }

    // Add is_super_admin field to each profile
    const profilesWithAdminStatus = data.map((profile) => {
      const profileRecord = profile as Record<string, unknown>;
      return {
        ...profileRecord,
        is_super_admin: superAdminUserIds.has(profileRecord.id as string),
      };
    });

    const result = profileWithStatsSchema
      .array()
      .safeParse(profilesWithAdminStatus);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Create a new profile
   * @param profileData - The profile data to create
   * @returns Success with created profile or error
   */
  public async create(
    profileData: Partial<Profile>,
  ): Promise<SupabaseSuccess<Profile> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    const { data, error } = await supabase
      .from('profiles')
      .insert(profileData)
      .select()
      .single();

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to create profile');
    }

    if (!data) {
      return {
        success: false,
        error: 'Failed to create profile',
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
   * Update a profile
   * @param id - The profile id
   * @param profileData - The data to update
   * @returns Success with updated profile or error
   */
  public async update(
    id: string,
    profileData: Partial<Profile>,
  ): Promise<SupabaseSuccess<Profile> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    const { data: updatedData, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to update profile');
    }

    if (!updatedData) {
      return {
        success: false,
        error: 'Failed to update profile',
      };
    }

    const result = profileSchema.safeParse(updatedData);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Delete a profile
   * @param id - The profile id
   * @returns Success or error
   */
  public async delete(
    id: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    const { error } = await supabase.from('profiles').delete().eq('id', id);

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to delete profile');
    }

    return {
      success: true,
      data: undefined,
    };
  }

  /**
   * Get all user emails for case-insensitive lookup (for import validation)
   * @returns Success with Set of lowercase emails or error
   */
  public async getAllEmailsForImport(): Promise<
    SupabaseSuccess<Set<string>> | SupabaseError
  > {
    const supabase = await this.getClient('service_role');
    const { data, error } = await supabase.from('profiles').select('email');

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get user emails for import',
      );
    }

    const emailSet = new Set<string>();
    if (data) {
      for (const profile of data) {
        if (profile.email) {
          emailSet.add(profile.email.toLowerCase());
        }
      }
    }

    return {
      success: true,
      data: emailSet,
    };
  }

  /**
   * Get user profile by email (case-insensitive)
   * @param email - The email to search for
   * @returns Success with user profile data or error
   */
  public async getByEmail(email: string): Promise<
    | SupabaseSuccess<{
        id: string;
        first_name: string | null;
        last_name: string | null;
      }>
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .ilike('email', email)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get user by email',
      );
    }

    if (!data) {
      return {
        success: false,
        error: 'User not found',
      };
    }

    return {
      success: true,
      data,
    };
  }

  /**
   * Create a user quickly with email, name, and optional org/team assignment
   * @param data - User creation data
   * @returns Success with userId or error
   */
  public async createQuickAdd(data: {
    email: string;
    firstName: string;
    lastName: string;
    organizationId?: string;
    teamId?: string;
  }): Promise<SupabaseSuccess<{ userId: string }> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    const adminClient = supabase as Awaited<
      ReturnType<typeof import('../core/admin').createAdminClient>
    >;

    try {
      // Create auth user (OTP-based, no password)
      const { data: authUser, error: authError } =
        await adminClient.auth.admin.createUser({
          email: data.email.toLowerCase().trim(),
          user_metadata: {
            first_name: data.firstName.trim(),
            last_name: data.lastName.trim(),
          },
          email_confirm: true,
        });

      if (authError || !authUser.user) {
        return {
          success: false,
          error: authError?.message || 'Failed to create auth user',
        };
      }

      const userId = authUser.user.id;

      // Add to organization if provided
      if (data.organizationId) {
        const { error: orgError } = await supabase
          .from('organization_members')
          .insert({
            organization_id: data.organizationId,
            user_id: userId,
            role: 'member',
            is_active: true,
          });

        if (orgError) {
          return {
            success: false,
            error: `Failed to add user to organization: ${orgError.message}`,
          };
        }
      }

      // Add to team if provided
      if (data.teamId) {
        const { error: teamError } = await supabase
          .from('team_membership')
          .insert({
            team_id: data.teamId,
            user_id: userId,
          });

        if (teamError) {
          return {
            success: false,
            error: `Failed to add user to team: ${teamError.message}`,
          };
        }
      }

      return {
        success: true,
        data: { userId },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create user',
      };
    }
  }

  /**
   * Get HP level threshold by level number
   * @param level - The level number to fetch
   * @returns Success with level threshold data or error
   */
  public async getHpLevelThresholdByLevel(level: number): Promise<
    | SupabaseSuccess<{
        description: string;
        image_url: string | null;
      }>
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data, error } = await supabase
      .from('hp_level_thresholds')
      .select('description, image_url')
      .eq('level', level)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get HP level threshold',
      );
    }

    if (!data) {
      return {
        success: false,
        error: 'Level threshold not found',
      };
    }

    return {
      success: true,
      data: {
        description: data.description,
        image_url: data.image_url,
      },
    };
  }

  /**
   * Get HP transactions for a user
   * @param userId - The user ID to fetch transactions for
   * @returns Success with transactions array or error
   */
  public async getHpTransactionsByUserId(userId: string): Promise<
    | SupabaseSuccess<
        Array<{
          created_at: string | null;
          points_earned: number;
          transaction_type: string;
          description: string | null;
        }>
      >
    | SupabaseError
  > {
    const supabase = await this.getClient('service_role');

    const { data, error } = await supabase
      .from('hp_transactions')
      .select('created_at, points_earned, transaction_type, description')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get HP transactions',
      );
    }

    if (!data) {
      return {
        success: true,
        data: [],
      };
    }

    return {
      success: true,
      data: data.map((tx) => ({
        created_at: tx.created_at,
        points_earned: tx.points_earned,
        transaction_type: tx.transaction_type,
        description: tx.description,
      })),
    };
  }
}
