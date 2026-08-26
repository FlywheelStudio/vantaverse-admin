import {
  SupabaseQuery,
  type SupabaseSuccess,
  type SupabaseError,
} from '../query';
import {
  tagSchema,
  tagCategorySchema,
  upsertTagResultSchema,
  setExerciseTagsResultSchema,
  type Tag,
  type UpsertTagResult,
  type SetExerciseTagsResult,
} from '../schemas/tags';

export class TagsQuery extends SupabaseQuery {
  /**
   * Distinct tag categories (includes empty seeded categories).
   */
  public async listCategories(): Promise<
    SupabaseSuccess<string[]> | SupabaseError
  > {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase.rpc('list_tag_categories');

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to list tag categories',
      );
    }

    const parsed = tagCategorySchema.array().safeParse(data ?? []);
    if (!parsed.success) {
      return this.parseResponseZodError(parsed.error);
    }

    return {
      success: true,
      data: parsed.data.map((row) => row.category),
    };
  }

  /**
   * Search tags for autocomplete (excludes empty-category sentinel).
   */
  public async search(params: {
    q?: string;
    category?: string;
    limit?: number;
  }): Promise<SupabaseSuccess<Tag[]> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase.rpc('search_tags', {
      p_q: params.q ?? undefined,
      p_category: params.category ?? undefined,
      p_limit: params.limit ?? 20,
    });

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to search tags');
    }

    const parsed = tagSchema.array().safeParse(data ?? []);
    if (!parsed.success) {
      return this.parseResponseZodError(parsed.error);
    }

    return { success: true, data: parsed.data };
  }

  /**
   * Get all tags across all categories (excluding sentinel empty-category rows).
   */
  public async getAllTags(): Promise<SupabaseSuccess<Tag[]> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .neq('name', 'empty')
      .order('category', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to get tags');
    }

    const parsed = tagSchema.array().safeParse(data ?? []);
    if (!parsed.success) {
      return this.parseResponseZodError(parsed.error);
    }

    return { success: true, data: parsed.data };
  }

  /**
   * Tags assigned to an exercise.
   */
  public async getExerciseTags(
    exerciseId: number,
  ): Promise<SupabaseSuccess<Tag[]> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase.rpc('get_exercise_tags', {
      p_exercise_id: exerciseId,
    });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to get exercise tags',
      );
    }

    const parsed = tagSchema.array().safeParse(data ?? []);
    if (!parsed.success) {
      return this.parseResponseZodError(parsed.error);
    }

    return { success: true, data: parsed.data };
  }

  /**
   * Idempotent create/return existing tag.
   */
  public async upsertTag(params: {
    category: string;
    name: string;
  }): Promise<SupabaseSuccess<UpsertTagResult> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase.rpc('upsert_tag', {
      p_category: params.category,
      p_name: params.name,
    });

    if (error) {
      return this.parseResponsePostgresError(error, 'Failed to upsert tag');
    }

    const parsed = upsertTagResultSchema.safeParse(data);
    if (!parsed.success) {
      return this.parseResponseZodError(parsed.error);
    }

    return { success: true, data: parsed.data };
  }

  /**
   * Replace-all tag assignment for an exercise. Empty array clears.
   */
  public async setExerciseTags(params: {
    exerciseId: number;
    tagIds: number[];
  }): Promise<SupabaseSuccess<SetExerciseTagsResult> | SupabaseError> {
    const supabase = await this.getClient('authenticated_user');

    const { data, error } = await supabase.rpc('set_exercise_tags', {
      p_exercise_id: params.exerciseId,
      p_tag_ids: params.tagIds,
    });

    if (error) {
      return this.parseResponsePostgresError(
        error,
        'Failed to set exercise tags',
      );
    }

    const parsed = setExerciseTagsResultSchema.safeParse(data);
    if (!parsed.success) {
      return this.parseResponseZodError(parsed.error);
    }

    return { success: true, data: parsed.data };
  }
}
