import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import {
  organizationSchema,
  type Organization,
} from '../schemas/organizations';

export class OrganizationsQuery extends SupabaseQuery {
  /**
   * Get all organizations
   * @returns Success with organizations array or error
   */
  public async getList(): Promise<
    SupabaseSuccess<Organization[]> | SupabaseError
  > {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('organizations')
      .select(
        '*, organization_members(id, user_id, is_active, profiles!inner(id, avatar_url, first_name, last_name, username))',
      )
      .order('created_at', { ascending: false });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get organizations',
      );
    }

    if (!data) {
      return {
        success: true,
        data: [],
      };
    }

    // Transform data: organization_members now includes profile data
    type RawOrganizationMember = {
      id: string;
      user_id: string;
      is_active: boolean | null;
      profiles: {
        id: string;
        avatar_url: string | null;
        first_name: string | null;
        last_name: string | null;
        username: string | null;
      } | null;
    };

    type RawOrganization = Omit<
      Organization,
      'members_count' | 'member_ids' | 'members'
    > & {
      organization_members: RawOrganizationMember[] | null;
    };

    const transformedData = (data as RawOrganization[]).map((org) => {
      const { organization_members, ...orgData } = org;
      // Filter to only active members and transform to include profile data
      const members =
        Array.isArray(organization_members) && organization_members.length > 0
          ? organization_members
              .filter((m) => m.is_active === true)
              .map((m) => ({
                id: m.id,
                user_id: m.user_id,
                profile: m.profiles
                  ? {
                      id: m.profiles.id,
                      avatar_url: m.profiles.avatar_url,
                      first_name: m.profiles.first_name,
                      last_name: m.profiles.last_name,
                      username: m.profiles.username,
                    }
                  : null,
              }))
          : [];
      const memberIds = members.map((m) => m.id);
      return {
        ...orgData,
        members_count: members.length,
        member_ids: memberIds.length > 0 ? memberIds : undefined,
        members: members.length > 0 ? members : undefined,
      };
    });

    const result = organizationSchema.array().safeParse(transformedData);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Create a new organization
   * @param name - The organization name
   * @param description - Optional organization description
   * @returns Success with created organization or error
   */
  public async create(
    name: string,
    description?: string | null,
  ): Promise<SupabaseSuccess<Organization> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
        description: description?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to create organization',
      );
    }

    if (!data) {
      return {
        success: false,
        error: 'Failed to create organization',
      };
    }

    const result = organizationSchema.safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Update an organization
   * @param id - The organization id
   * @param data - The data to update
   * @returns Success with updated organization or error
   */
  public async update(
    id: string,
    data: Partial<Organization>,
  ): Promise<SupabaseSuccess<Organization> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data: updatedData, error } = await supabase
      .from('organizations')
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to update organization',
      );
    }

    if (!updatedData) {
      return {
        success: false,
        error: 'Failed to update organization',
      };
    }

    const result = organizationSchema.safeParse(updatedData);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }
}
