import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import { exerciseSchema, type Exercise } from '../schemas/exercises';

export class ExercisesQuery extends SupabaseQuery {
  /**
   * Get all exercises with video (youtube with video_url or file with video_url)
   * @returns Success with exercises array or error
   */
  public async getList(): Promise<SupabaseSuccess<Exercise[]> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    // Query: (video_type = 'youtube' AND video_url IS NOT NULL)
    //     OR (video_type = 'file' AND video_url IS NOT NULL)
    // Fetch exercises with video_url not null, then filter by video_type
    const { data, error } = await supabase
      .from('exercises_with_stats')
      .select('*')
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to get exercises');
    }

    if (!data) {
      return {
        success: true,
        data: [],
      };
    }

    // Filter by video_type (youtube or file)
    const filteredData = data.filter(
      (exercise) =>
        exercise.video_type === 'youtube' || exercise.video_type === 'file',
    );

    const result = exerciseSchema.array().safeParse(filteredData);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Get exercise by ID
   * @param id - The exercise id
   * @returns Success with exercise data or error
   */
  public async getById(
    id: number,
  ): Promise<SupabaseSuccess<Exercise> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    const { data, error } = await supabase
      .from('exercises')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to get exercise');
    }

    if (!data) {
      return {
        success: false,
        error: 'Exercise not found',
      };
    }

    const result = exerciseSchema.safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }

  /**
   * Update an exercise
   * @param id - The exercise id
   * @param data - The data to update
   * @returns Success with updated exercise or error
   */
  public async update(
    id: number,
    data: Partial<Exercise>,
  ): Promise<SupabaseSuccess<Exercise> | SupabaseError> {
    const supabase = await this.getClient('service_role');

    const { data: updatedData, error } = await supabase
      .from('exercises')
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
        'Failed to update exercise',
      );
    }

    if (!updatedData) {
      return {
        success: false,
        error: 'Failed to update exercise',
      };
    }

    const result = exerciseSchema.safeParse(updatedData);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    return {
      success: true,
      data: result.data,
    };
  }
}
