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
import { MemberRole } from '../schemas/organization-members';

export type ProfileWithMemberships = Profile & {
  orgMemberships: Array<{
    orgId: string;
    orgName: string;
    role: MemberRole;
  }>;
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
    SupabaseSuccess<ProfileWithStats> | SupabaseError
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
   * Get a user profile by ID
   * @param id - The user ID to fetch
   * @returns Success with profile data or error
   */
  public async getUserById(
    id: string,
  ): Promise<SupabaseSuccess<ProfileWithStats> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    // Fetch profile data
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

    // Fetch role from organization_members (get first role if multiple memberships)
    const { data: orgMemberData, error: orgMemberError } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', id)
      .limit(1)
      .maybeSingle();

    // Role is optional, so we don't fail if there's an error or no membership
    const role =
      !orgMemberError && orgMemberData?.role ? orgMemberData.role : undefined;

    const profileData = {
      ...data,
      role,
    };

    const result = profileWithStatsSchema.safeParse(profileData);

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
        '*, organization_members(organization_id, role, organizations!inner(id, name)), team_membership(team_id, teams!inner(id, name, organization_id, organizations!inner(id, name)))',
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
      role: MemberRole;
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
                role: om.role,
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
   * Get unassigned user IDs (users not in any organization)
   * Optimized query using SQL instead of fetching all profiles
   */
  private async getUnassignedUserIds(): Promise<string[]> {
    const supabase = await this.getClient('service_role');

    // Fallback: query directly (RPC might not exist)
    const { data: allProfiles } = await supabase.from('profiles').select('id');

    const { data: allOrgMembers } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('is_active', true);

    if (!allProfiles) return [];

    const orgMemberIds = new Set(
      allOrgMembers ? allOrgMembers.map((m) => m.user_id) : [],
    );

    return allProfiles.map((p) => p.id).filter((id) => !orgMemberIds.has(id));
  }

  /**
   * Build user ID filters based on role, organization, and team filters
   * Returns null if no filters, or array of user IDs to filter by
   */
  private async buildUserIdFilters(filters?: {
    organization_id?: string;
    team_id?: string;
    journey_phase?: string;
    role?: MemberRole;
  }): Promise<string[] | null> {
    const supabase = await this.getClient('service_role');
    let userIds: string[] | null = null;

    // Filter by role
    if (filters?.role) {
      if (filters.role === 'patient' && !filters?.organization_id) {
        // Special case: patients + unassigned users
        const { data: orgMembersByRole } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('role', filters.role)
          .eq('is_active', true);

        const patientUserIds = orgMembersByRole
          ? orgMembersByRole.map((m) => m.user_id)
          : [];

        const unassignedUserIds = await this.getUnassignedUserIds();
        userIds = [...new Set([...patientUserIds, ...unassignedUserIds])];

        if (userIds.length === 0) {
          return null; // Signal empty result
        }
      } else {
        // Normal role filtering
        const { data: orgMembersByRole } = await supabase
          .from('organization_members')
          .select('user_id')
          .eq('role', filters.role)
          .eq('is_active', true);

        if (orgMembersByRole && orgMembersByRole.length > 0) {
          userIds = orgMembersByRole.map((m) => m.user_id);
        } else {
          return null; // Signal empty result
        }
      }
    }

    // Filter by organization
    if (filters?.organization_id) {
      let orgMembersQuery = supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', filters.organization_id)
        .eq('is_active', true);

      if (filters?.role) {
        orgMembersQuery = orgMembersQuery.eq('role', filters.role);
      }

      const { data: orgMembers } = await orgMembersQuery;

      if (orgMembers && orgMembers.length > 0) {
        const orgUserIds = orgMembers.map((m) => m.user_id);
        userIds = userIds
          ? userIds.filter((id) => orgUserIds.includes(id))
          : orgUserIds;

        if (userIds.length === 0) {
          return null; // Signal empty result
        }
      } else {
        return null; // Signal empty result
      }
    }

    // Filter by team
    if (filters?.team_id) {
      const { data: teamMembers } = await supabase
        .from('team_membership')
        .select('user_id')
        .eq('team_id', filters.team_id);

      if (teamMembers && teamMembers.length > 0) {
        const teamUserIds = teamMembers.map((m) => m.user_id);
        userIds = userIds
          ? userIds.filter((id) => teamUserIds.includes(id))
          : teamUserIds;

        if (userIds.length === 0) {
          return null; // Signal empty result
        }
      } else {
        return null; // Signal empty result
      }
    }

    return userIds;
  }

  /**
   * Get super admin organization data (org ID and user IDs)
   */
  private async getSuperAdminData(): Promise<{
    orgId: string | undefined;
    userIds: Set<string>;
  }> {
    const supabase = await this.getClient('service_role');

    const { data: superAdminOrg } = await supabase
      .from('organizations')
      .select('id')
      .eq('is_super_admin', true)
      .maybeSingle();

    const superAdminOrgId = superAdminOrg?.id;
    const superAdminUserIds = new Set<string>();

    if (superAdminOrgId) {
      const { data: superAdminMembers } = await supabase
        .from('organization_members')
        .select('user_id')
        .eq('organization_id', superAdminOrgId)
        .eq('is_active', true);

      if (superAdminMembers) {
        superAdminMembers.forEach((m) => superAdminUserIds.add(m.user_id));
      }
    }

    return { orgId: superAdminOrgId, userIds: superAdminUserIds };
  }

  /**
   * Get organization memberships for given profile IDs
   * Returns maps for orgMemberships and user roles
   */
  private async getOrganizationMemberships(profileIds: string[]): Promise<{
    orgMembershipsMap: Map<string, Array<{ orgId: string; orgName: string }>>;
    userRoleMap: Map<string, MemberRole>;
  }> {
    const supabase = await this.getClient('service_role');

    const { data: orgMembersData } = await supabase
      .from('organization_members')
      .select('user_id, organization_id, role, organizations!inner(id, name)')
      .in('user_id', profileIds)
      .eq('is_active', true);

    const orgMembershipsMap = new Map<
      string,
      Array<{ orgId: string; orgName: string }>
    >();
    const userRoleMap = new Map<string, MemberRole>();

    type OrgMemberWithRole = {
      user_id: string;
      organization_id: string;
      role: MemberRole;
      organizations: {
        id: string;
        name: string;
      } | null;
    };

    if (orgMembersData) {
      (orgMembersData as unknown as OrgMemberWithRole[]).forEach((om) => {
        if (om.organizations) {
          if (!orgMembershipsMap.has(om.user_id)) {
            orgMembershipsMap.set(om.user_id, []);
          }
          orgMembershipsMap.get(om.user_id)!.push({
            orgId: om.organization_id,
            orgName: om.organizations.name,
          });
        }
        if (om.role && !userRoleMap.has(om.user_id)) {
          userRoleMap.set(om.user_id, om.role);
        }
      });
    }

    return { orgMembershipsMap, userRoleMap };
  }

  /**
   * Enrich profiles with metadata (super admin status, org memberships, role)
   */
  private enrichProfilesWithMetadata(
    profiles: unknown[],
    superAdminUserIds: Set<string>,
    orgMembershipsMap: Map<string, Array<{ orgId: string; orgName: string }>>,
    userRoleMap: Map<string, MemberRole>,
  ): unknown[] {
    return profiles.map((profile) => {
      const profileRecord = profile as Record<string, unknown>;
      const userId = profileRecord.id as string;
      const role = userRoleMap.get(userId);
      const inferredRole =
        role || (superAdminUserIds.has(userId) ? 'admin' : 'patient');

      return {
        ...profileRecord,
        is_super_admin: superAdminUserIds.has(userId),
        orgMemberships: orgMembershipsMap.get(userId) || [],
        role: inferredRole,
      };
    });
  }

  /**
   * Query profiles with stats applying filters
   */
  private async queryProfilesWithFilters(
    userIds: string[] | null,
    filters?: {
      journey_phase?: string;
    },
  ): Promise<SupabaseSuccess<unknown[]> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    let query = supabase.from('profiles_with_stats').select('*');

    if (userIds) {
      query = query.in('id', userIds);
    }

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

    return {
      success: true,
      data,
    };
  }

  /**
   * Get list of profiles with stats and optional filtering
   * @param filters - Optional filters (organization_id, team_id, journey_phase, role)
   * @returns Success with profiles with stats array or error
   */
  public async getListWithStats(filters?: {
    organization_id?: string;
    team_id?: string;
    journey_phase?: string;
    role?: MemberRole;
  }): Promise<SupabaseSuccess<ProfileWithStats[]> | SupabaseError> {
    // 1. Build user ID filters
    const userIds = await this.buildUserIdFilters(filters);

    // Early return if filters result in empty set
    if (userIds === null) {
      return {
        success: true,
        data: [],
      };
    }

    // 2. Query profiles with filters
    const profilesResult = await this.queryProfilesWithFilters(
      userIds,
      filters,
    );
    if (!profilesResult.success) {
      return profilesResult;
    }

    const profiles = profilesResult.data;
    if (profiles.length === 0) {
      return {
        success: true,
        data: [],
      };
    }

    // 3. Get enrichment data in parallel
    const profileIds = profiles.map(
      (p) => (p as Record<string, unknown>).id as string,
    );

    const [superAdminData, membershipsData] = await Promise.all([
      this.getSuperAdminData(),
      this.getOrganizationMemberships(profileIds),
    ]);

    // 4. Enrich profiles with metadata
    const enrichedProfiles = this.enrichProfilesWithMetadata(
      profiles,
      superAdminData.userIds,
      membershipsData.orgMembershipsMap,
      membershipsData.userRoleMap,
    );

    // 5. Validate and return
    const result = profileWithStatsSchema.array().safeParse(enrichedProfiles);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Get all patients (role='patient') in an organization
   * @param organizationId - The organization ID
   * @returns Success with profiles array or error
   */
  public async getPatientsByOrganization(
    organizationId: string,
  ): Promise<SupabaseSuccess<ProfileWithStats[]> | SupabaseError> {
    return this.getListWithStats({
      organization_id: organizationId,
      role: 'patient',
    });
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
   * Delete an auth user
   * @param id - The auth user id
   * @returns Success or error
   */
  public async deleteAuthUser(
    id: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    const { error } = await supabase.auth.admin.deleteUser(id);

    if (error) {
      console.error('Failed to delete auth user:', error);
      return {
        success: false,
        error: error.message,
      };
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
   * Get user profiles by email list (for import display)
   * NOTE: emails are matched case-sensitively by Supabase `in()`; callers should
   * pass normalized lowercase emails.
   */
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
    const supabase = await this.getClient('service_role');

    if (emails.length === 0) {
      return { success: true, data: [] };
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, first_name, last_name, status')
      .in('email', emails);

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get users by emails for import',
      );
    }

    return {
      success: true,
      data: data ?? [],
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
    role?: MemberRole;
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
        console.error('Error creating auth user:', authError);
        return {
          success: false,
          error: authError?.message || 'Failed to create auth user',
        };
      }

      const userId = authUser.user.id;

      // Ensure profile fields/status are set
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          first_name: data.firstName.trim() || null,
          last_name: data.lastName.trim() || null,
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (profileError) {
        return {
          success: false,
          error: `Failed to update profile: ${profileError.message}`,
        };
      }

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

      // Add to super admin organization if role is physician
      if (data.role === 'admin') {
        const { OrganizationMembers } = await import('./organization-members');
        const orgMembersQuery = new OrganizationMembers();
        const superAdminResult = await orgMembersQuery.makeSuperAdmin(userId);

        // Log error but don't fail user creation if super admin org doesn't exist
        if (!superAdminResult.success) {
          console.error(
            'Failed to add user to super admin organization:',
            superAdminResult.error,
          );
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
}
