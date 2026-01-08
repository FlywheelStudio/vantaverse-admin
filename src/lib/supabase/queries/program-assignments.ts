import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import {
  programAssignmentSchema,
  programAssignmentWithTemplateSchema,
  type ProgramAssignment,
  type ProgramAssignmentWithTemplate,
} from '../schemas/program-assignments';

export class ProgramAssignmentsQuery extends SupabaseQuery {
  /**
   * Get all program assignments with status='template' (joined with program_template)
   * @returns Success with program assignments array or error
   */
  public async getTemplates(): Promise<
    SupabaseSuccess<ProgramAssignmentWithTemplate[]> | SupabaseError
  > {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('program_assignment')
      .select(
        `
        *,
        program_template (*)
      `,
      )
      .eq('status', 'template')
      .order('created_at', { ascending: false });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get program assignments',
      );
    }

    if (!data) {
      return {
        success: true,
        data: [],
      };
    }

    // Transform the data to match our schema structure
    const transformedData = data.map((item: ProgramAssignmentWithTemplate) => ({
      ...item,
      program_template: item.program_template || null,
    }));

    const result = programAssignmentWithTemplateSchema
      .array()
      .safeParse(transformedData);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Get a single program assignment by ID (joined with program_template)
   * @param id - The assignment ID
   * @returns Success with program assignment or error
   */
  public async getById(
    id: string,
  ): Promise<SupabaseSuccess<ProgramAssignmentWithTemplate> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('program_assignment')
      .select(
        `
        *,
        program_template (*)
      `,
      )
      .eq('id', id)
      .single();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get program assignment',
      );
    }

    if (!data) {
      return {
        success: false,
        error: 'Program assignment not found',
      };
    }

    // Transform the data to match our schema structure
    const transformedData = {
      ...data,
      program_template: data.program_template || null,
    };

    const result =
      programAssignmentWithTemplateSchema.safeParse(transformedData);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Create a new program assignment with status='template'
   * @param programTemplateId - The program template ID
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @param organizationId - Optional organization ID
   * @returns Success with created assignment or error
   */
  public async create(
    programTemplateId: string,
    startDate: string,
    endDate: string,
    organizationId?: string | null,
  ): Promise<SupabaseSuccess<ProgramAssignment> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('program_assignment')
      .insert({
        program_template_id: programTemplateId,
        start_date: startDate,
        end_date: endDate,
        status: 'template',
        user_id: null,
        organization_id: organizationId || null,
        workout_schedule_id: null,
      })
      .select()
      .single();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to create program assignment',
      );
    }

    if (!data) {
      return {
        success: false,
        error: 'Failed to create program assignment',
      };
    }

    const result = programAssignmentSchema.safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Delete a program assignment
   * @param id - The assignment ID
   * @returns Success or error
   */
  public async delete(
    id: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { error } = await supabase
      .from('program_assignment')
      .delete()
      .eq('id', id);

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to delete program assignment',
      );
    }

    return {
      success: true,
      data: undefined,
    };
  }
}
