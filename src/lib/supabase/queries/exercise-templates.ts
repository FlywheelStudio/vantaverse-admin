import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import {
  exerciseTemplateSchema,
  type ExerciseTemplate,
} from '../schemas/exercise-templates';

export type PaginatedResult<T> = {
  data: T[];
  page: number;
  pageSize: number;
  total: number;
  hasMore: boolean;
};

export class ExerciseTemplatesQuery extends SupabaseQuery {
  /**
   * Get paginated exercise templates with search and sort
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of items per page
   * @param search - Search term for exercise name
   * @param sortBy - Sort field (default: 'updated_at')
   * @param sortOrder - Sort order ('asc' or 'desc', default: 'desc')
   * @returns Success with paginated data or error
   */
  public async getListPaginated(
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    sortBy: string = 'updated_at',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<
    SupabaseSuccess<PaginatedResult<ExerciseTemplate>> | SupabaseError
  > {
    const supabase = await this.getClient('authenticated_user');

    let query = supabase.from('exercise_templates').select(
      `
        *,
        exercises!exercise_templates_exercise_id_fkey (
          exercise_name,
          video_type,
          video_url
        )
      `,
      { count: 'exact' },
    );

    // Note: Search filtering on joined table will be done in application layer

    // Apply sorting (only for fields on exercise_templates table)
    // For exercise_name, we'll sort in application layer
    if (sortBy !== 'exercise_name') {
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
    } else {
      // Default to updated_at for database query, then sort by name in app layer
      query = query.order('updated_at', { ascending: false });
    }

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get exercise templates',
      );
    }

    if (!data) {
      return {
        success: true,
        data: {
          data: [],
          page,
          pageSize,
          total: 0,
          hasMore: false,
        },
      };
    }

    // Transform data to include exercise_name, video_type, video_url and filter by search if needed
    let transformedData = data.map((item) => {
      const exercise = Array.isArray(item.exercises)
        ? item.exercises[0]
        : item.exercises;
      return {
        ...item,
        exercise_name: exercise?.exercise_name || '',
        video_type: exercise?.video_type || undefined,
        video_url: exercise?.video_url || undefined,
      };
    });

    // Apply search filter in application layer
    if (search) {
      transformedData = transformedData.filter((item) =>
        item.exercise_name?.toLowerCase().includes(search.toLowerCase()),
      );
    }

    // Apply sorting by exercise_name if needed (in application layer)
    if (sortBy === 'exercise_name') {
      transformedData.sort((a, b) => {
        const aName = a.exercise_name || '';
        const bName = b.exercise_name || '';
        const comparison = aName.localeCompare(bName);
        return sortOrder === 'asc' ? comparison : -comparison;
      });
    }

    const result = exerciseTemplateSchema.array().safeParse(transformedData);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    // Adjust total count if search was applied
    const adjustedTotal = search ? result.data.length : count || 0;
    const hasMore = search
      ? false // Can't determine hasMore with client-side filtering
      : from + result.data.length < adjustedTotal;

    return {
      success: true,
      data: {
        data: result.data,
        page,
        pageSize,
        total: adjustedTotal,
        hasMore,
      },
    };
  }
}
