import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import { profileSchema, type Profile } from '../schemas/profiles';

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
}
