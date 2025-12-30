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
   * @param role - The client role to use ('user' or 'service_role')
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
}
