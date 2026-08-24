import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import { exerciseSchema, type Exercise } from '../schemas/exercises';
import type { PaginatedResult } from './exercise-templates';

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

    let adminName: string | null = null;
    try {
      const user = await this.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .maybeSingle();

        if (profile) {
          const fullName = [profile.first_name, profile.last_name]
            .filter(Boolean)
            .join(' ')
            .trim();
          adminName = fullName || null;
        }
      }
    } catch {
      // If user retrieval fails, proceed with update without admin name
    }

    const { data: updatedData, error } = await supabase
      .from('exercises')
      .update({
        ...data,
        ...(adminName ? { updated_by: adminName } : {}),
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

  /**
   * Get distinct exercise types (sources) for filtering
   */
  public async getDistinctTypes(): Promise<
    SupabaseSuccess<string[]> | SupabaseError
  > {
    const supabase = await this.getClient('authenticated_user');
    const { data, error } = await supabase
      .from('exercises')
      .select('type')
      .not('video_url', 'is', null)
      .not('type', 'is', null);

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get exercise types',
      );
    }
    const types = [
      ...new Set((data ?? []).map((r) => r.type as string).filter(Boolean)),
    ].sort((a, b) => a.localeCompare(b));
    return { success: true, data: types };
  }

  /**
   * Get paginated exercises with search and sort
   * @param page - Page number (1-indexed)
   * @param pageSize - Number of items per page
   * @param search - Search term for exercise name
   * @param sortBy - Sort field (default: 'updated_at')
   * @param sortOrder - Sort order ('asc' or 'desc', default: 'desc')
   * @param type - Optional filter by exercise type (source)
   * @returns Success with paginated data or error
   */
  public async getListPaginated(
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    sortBy: string = 'updated_at',
    sortOrder: 'asc' | 'desc' = 'desc',
    type?: string | null,
  ): Promise<SupabaseSuccess<PaginatedResult<Exercise>> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    let query = supabase
      .from('exercises')
      .select('*', { count: 'exact' })
      .not('video_url', 'is', null);

    // Apply search filter if provided
    if (search) {
      query = query.ilike('exercise_name', `%${search}%`);
    }

    // Apply type (source) filter if provided
    if (type) {
      query = query.eq('type', type);
    }

    // Apply sorting
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to get exercises');
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

    const result = exerciseSchema.array().safeParse(data);

    if (!result.success) {
      return this.parseResponseZodError(result.error);
    }

    const total = count || 0;
    const hasMore = from + result.data.length < total;

    return {
      success: true,
      data: {
        data: result.data,
        page,
        pageSize,
        total,
        hasMore,
      },
    };
  }

  /**
   * Get paginated exercises with multi-faceted filtering:
   * search, source type, assignment status, and multi-category tag filtering.
   */
  public async getListFiltered(params: {
    search?: string;
    type?: string | null;
    assignment?: 'all' | 'unassigned' | 'assigned';
    tagIds?: number[];
    page?: number;
    pageSize?: number;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }): Promise<SupabaseSuccess<PaginatedResult<Exercise>> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');
    const {
      search,
      type,
      assignment = 'all',
      tagIds,
      page = 1,
      pageSize = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = params;

    const { data, error } = await supabase.rpc('list_exercises_filtered', {
      p_search: search || undefined,
      p_type: type || undefined,
      p_assignment: assignment,
      p_tag_ids: tagIds && tagIds.length > 0 ? tagIds : undefined,
      p_page: page,
      p_page_size: pageSize,
      p_sort_by: sortBy,
      p_sort_order: sortOrder,
    });

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to get filtered exercises');
    }

    const payload = (data as {
      data: unknown[];
      count: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }) || { data: [], count: 0, page: 1, pageSize: 20, totalPages: 0 };

    const parsedData = exerciseSchema.array().safeParse(payload.data ?? []);
    if (!parsedData.success) {
      return this.parseResponseZodError(parsedData.error);
    }

    const total = payload.count ?? 0;
    const hasMore = page * pageSize < total;

    return {
      success: true,
      data: {
        data: parsedData.data,
        page,
        pageSize,
        total,
        hasMore,
      },
    };
  }
}
