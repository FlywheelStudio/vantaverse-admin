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
   * Get program assignment by program template ID
   * @param programTemplateId - The program template ID
   * @returns Success with program assignment or error
   */
  public async getByTemplateId(
    programTemplateId: string,
  ): Promise<SupabaseSuccess<ProgramAssignment | null> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('program_assignment')
      .select('*')
      .eq('program_template_id', programTemplateId)
      .eq('status', 'template')
      .limit(1)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get program assignment',
      );
    }

    if (!data) {
      return {
        success: true,
        data: null,
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

  /**
   * Update dates for all program assignments with status='template' for a given template ID
   * @param templateId - The program template ID
   * @param startDate - Start date (ISO string)
   * @param endDate - End date (ISO string)
   * @returns Success or error
   */
  public async updateDatesByTemplateId(
    templateId: string,
    startDate: string,
    endDate: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    // Get assignments with status='template' for this template
    const { data: assignments, error: fetchError } = await supabase
      .from('program_assignment')
      .select('id')
      .eq('program_template_id', templateId)
      .eq('status', 'template');

    if (fetchError) {
      return this.parseResponsePostgresError(
        fetchError,
        'Failed to fetch program assignments',
      );
    }

    if (!assignments || assignments.length === 0) {
      return {
        success: true,
        data: undefined,
      };
    }

    // Update each assignment's dates
    for (const assignment of assignments) {
      const { error } = await supabase
        .from('program_assignment')
        .update({
          start_date: startDate,
          end_date: endDate,
        })
        .eq('id', assignment.id);

      if (error) {
        return this.parseResponsePostgresError(
          error,
          'Failed to update program assignment dates',
        );
      }
    }

    return {
      success: true,
      data: undefined,
    };
  }

  /**
   * Update workout schedule ID
   * @param assignmentId - The assignment ID
   * @param workoutScheduleId - The workout schedule ID
   * @returns Success or error
   */
  public async updateWorkoutScheduleId(
    assignmentId: string,
    workoutScheduleId: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { error } = await supabase
      .from('program_assignment')
      .update({ workout_schedule_id: workoutScheduleId })
      .eq('id', assignmentId);

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to update program assignment',
      );
    }

    return {
      success: true,
      data: undefined,
    };
  }

  /**
   * Get workout schedule fields (workout_schedule_id and patient_override) for a program assignment
   * @param assignmentId - The assignment ID
   * @returns Success with workout schedule fields or error
   */
  public async getWorkoutScheduleFields(assignmentId: string): Promise<
    | SupabaseSuccess<{
        workout_schedule_id: string | null;
        patient_override: unknown;
      }>
    | SupabaseError
  > {
    const supabase = await this.getClient('authenticated_user');

    const { data: assignment, error } = await supabase
      .from('program_assignment')
      .select('workout_schedule_id, patient_override')
      .eq('id', assignmentId)
      .single();

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to fetch program assignment',
      );
    }

    if (!assignment) {
      return {
        success: false,
        error: 'Program assignment not found',
      };
    }

    return {
      success: true,
      data: {
        workout_schedule_id: assignment.workout_schedule_id,
        patient_override: assignment.patient_override as unknown,
      },
    };
  }
}
