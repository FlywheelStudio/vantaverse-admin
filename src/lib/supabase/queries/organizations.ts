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
      .select('*')
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

    const result = organizationSchema.array().safeParse(data);

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
   * @returns Success with created organization or error
   */
  public async create(
    name: string,
  ): Promise<SupabaseSuccess<Organization> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('organizations')
      .insert({
        name: name.trim(),
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
