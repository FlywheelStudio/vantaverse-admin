import {
  SupabaseQuery,
  type ClientRole,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import { organizationMemberSchema } from '../schemas/organization-members';

export class OrganizationMembers extends SupabaseQuery {
  /**
   * Check if a user is an admin by email (used for authentication, we need service role to access the profiles table)
   * @param email - The email of the user to check
   * @param role - The client role to use ('authenticated_user' or 'service_role')
   * @returns Success with admin status or error
   */
  public async isUserAdminByEmail(
    email: string,
    role: ClientRole = 'service_role',
  ): Promise<SupabaseSuccess<boolean> | SupabaseError> {
    const supabase = await this.getClient(role);
    const { data, error } = await supabase
      .from('organization_members')
      .select('role, profiles!inner(email)')
      .eq('profiles.email', email)
      .eq('role', 'admin')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to check if user is admin by email',
      );
    }

    if (!data) {
      return {
        success: true,
        data: false,
      };
    }

    const result = organizationMemberSchema.safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data.role === 'admin',
    };
  }

  /**
   * Check if a user is an admin by user ID
   * @param userId - The user ID to check
   * @param role - The client role to use ('authenticated_user' or 'service_role')
   * @returns Success with admin status or error
   */
  public async isUserAdminById(
    userId: string,
    role: ClientRole = 'authenticated_user',
  ): Promise<SupabaseSuccess<boolean> | SupabaseError> {
    const supabase = await this.getClient(role);
    const { data, error } = await supabase
      .from('organization_members')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to check if user is admin by ID',
      );
    }

    if (!data) {
      return {
        success: true,
        data: false,
      };
    }

    const result = organizationMemberSchema.safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data.role === 'admin',
    };
  }

  /**
   * Get current member user IDs for an organization
   * @param organizationId - The organization ID
   * @returns Success with array of user IDs or error
   */
  public async getMemberUserIds(
    organizationId: string,
  ): Promise<SupabaseSuccess<string[]> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .eq('is_active', true);

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get organization member user IDs',
      );
    }

    const userIds = (data || []).map((member) => member.user_id);

    return {
      success: true,
      data: userIds,
    };
  }

  /**
   * Make a user a super admin
   * @param userId - The user ID
   * @returns Success or error
   */
  public async makeSuperAdmin(
    userId: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const { OrganizationsQuery } = await import('./organizations');
    const orgQuery = new OrganizationsQuery();
    const orgResult = await orgQuery.getSuperAdminOrganizationId();

    if (!orgResult.success) {
      return orgResult;
    }

    const supabase = await this.getClient('authenticated_user');

    // Check if user is already a member
    const { data: existingMember } = await supabase
      .from('organization_members')
      .select('id')
      .eq('organization_id', orgResult.data)
      .eq('user_id', userId)
      .maybeSingle();

    if (existingMember) {
      // User is already a member, just ensure they're active
      const { error } = await supabase
        .from('organization_members')
        .update({ is_active: true, role: 'admin' })
        .eq('id', existingMember.id);

      if (error) {
        return this.parseResponsePostgresError(
          error,
          'Failed to update super admin membership',
        );
      }
    } else {
      // Add user as member
      const { error } = await supabase.from('organization_members').insert({
        organization_id: orgResult.data,
        user_id: userId,
        role: 'admin',
        is_active: true,
      });

      if (error) {
        return this.parseResponsePostgresError(
          error,
          'Failed to add super admin',
        );
      }
    }

    return {
      success: true,
      data: undefined,
    };
  }

  /**
   * Revoke super admin status from a user
   * @param userId - The user ID
   * @returns Success or error
   */
  public async revokeSuperAdmin(
    userId: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const { OrganizationsQuery } = await import('./organizations');
    const orgQuery = new OrganizationsQuery();
    const orgResult = await orgQuery.getSuperAdminOrganizationId();

    if (!orgResult.success) {
      return orgResult;
    }

    const supabase = await this.getClient('authenticated_user');

    // Remove user from super admin organization
    const { error } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', orgResult.data)
      .eq('user_id', userId);

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to revoke super admin',
      );
    }

    return {
      success: true,
      data: undefined,
    };
  }
}
