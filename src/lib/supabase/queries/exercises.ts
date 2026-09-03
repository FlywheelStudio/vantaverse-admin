import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineMutation, defineQuery, query, type DalResult } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';
import { exerciseSchema, type Exercise } from '../schemas/exercises';
import type { PaginatedResult } from './exercise-templates';
import type { SupabaseError, SupabaseSuccess } from '../result';

const exerciseListSchema = z.array(exerciseSchema);

const assignmentCountsSchema = z.object({
  all: z.number(),
  assigned: z.number(),
  unassigned: z.number(),
});

export type ExerciseAssignmentCounts = z.infer<typeof assignmentCountsSchema>;

const paginatedExerciseSchema = z.object({
  data: z.array(exerciseSchema),
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
  hasMore: z.boolean(),
});

const updateExerciseInputSchema = z.object({
  id: z.number(),
  data: exerciseSchema.partial(),
});

export type UpdateExerciseInput = z.infer<typeof updateExerciseInputSchema>;

const exerciseEntitySchema = exerciseSchema.extend({
  id: z.string(),
});

export type ListExercisesFilteredInput = {
  search?: string;
  type?: string | null;
  assignment?: 'all' | 'unassigned' | 'assigned';
  tagIds?: number[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export const exerciseKeys = {
  all: ['exercises'] as const,
  list: () => [...exerciseKeys.all, 'list'] as const,
  detail: (id: number) => [...exerciseKeys.all, 'detail', id] as const,
  paginated: (filters: {
    page: number;
    pageSize: number;
    search?: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
    type?: string | null;
  }) => [...exerciseKeys.list(), 'paginated', filters] as const,
  filtered: (filters: ListExercisesFilteredInput) =>
    [...exerciseKeys.list(), 'filtered', filters] as const,
  types: () => [...exerciseKeys.all, 'types'] as const,
  assignmentCounts: () => [...exerciseKeys.all, 'assignment-counts'] as const,
};

function toExerciseEntity(exercise: Exercise): z.infer<typeof exerciseEntitySchema> {
  return { ...exercise, id: String(exercise.id) };
}

function toLegacyResult<T>(
  result: DalResult<T>,
): SupabaseSuccess<T> | SupabaseError {
  const [err, data] = result;
  if (err) {
    return { success: false, error: err.message };
  }
  return { success: true, data };
}

async function resolveUpdatedByName(
  adminClient: SupabaseClient<Database>,
): Promise<string | null> {
  try {
    const { createClient } = await import('@/lib/supabase/core/server');
    const authClient = await createClient();
    const {
      data: { user },
    } = await authClient.auth.getUser();

    if (!user) {
      return null;
    }

    const { data: profile } = await adminClient
      .from('profiles')
      .select('first_name, last_name')
      .eq('id', user.id)
      .maybeSingle();

    if (!profile) {
      return null;
    }

    const fullName = [profile.first_name, profile.last_name]
      .filter(Boolean)
      .join(' ')
      .trim();

    return fullName || null;
  } catch {
    return null;
  }
}

/** Exercises with video (youtube or file) and a non-null video_url. */
export const listExercises = defineQuery({
  key: exerciseKeys.list,
  schema: exerciseListSchema,
  execute: async (client) => {
    const { data, error } = await client
      .from('exercises_with_stats')
      .select('*')
      .not('video_url', 'is', null)
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    const filteredData = (data ?? []).filter(
      (exercise) =>
        exercise.video_type === 'youtube' || exercise.video_type === 'file',
    );

    const parsed = exerciseListSchema.safeParse(filteredData);
    if (!parsed.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    return { data: parsed.data, error: null };
  },
});

/** Exercise by id (service role). */
export const getExerciseById = defineQuery({
  key: exerciseKeys.detail,
  schema: exerciseSchema,
  client: 'admin',
  execute: async (client, id: number) => {
    const { data, error } = await client
      .from('exercises')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: 'Exercise not found', code: 'P0404' },
      };
    }

    const parsed = exerciseSchema.safeParse(data);
    if (!parsed.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    return { data: parsed.data, error: null };
  },
});

/** Update an exercise (service role). */
export const updateExercise = defineMutation({
  inputSchema: updateExerciseInputSchema,
  schema: exerciseEntitySchema,
  client: 'admin',
  execute: async (client, input: UpdateExerciseInput) => {
    const adminName = await resolveUpdatedByName(client);

    const { data, error } = await client
      .from('exercises')
      .update({
        ...input.data,
        ...(adminName ? { updated_by: adminName } : {}),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return {
        data: null,
        error: { message: 'Failed to update exercise', code: 'P0500' },
      };
    }

    const parsed = exerciseSchema.safeParse(data);
    if (!parsed.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    return { data: toExerciseEntity(parsed.data), error: null };
  },
  targets: (input) => [
    exerciseKeys.all,
    exerciseKeys.detail(input.id),
    exerciseKeys.list(),
  ],
});

/** Distinct exercise types (sources) for filtering. */
export const getExerciseDistinctTypes = defineQuery({
  key: exerciseKeys.types,
  schema: z.array(z.string()),
  execute: async (client) => {
    const { data, error } = await client
      .from('exercises')
      .select('type')
      .not('video_url', 'is', null)
      .not('type', 'is', null);

    if (error) {
      return { data: null, error };
    }

    const types = [
      ...new Set(
        (data ?? [])
          .map((row) => row.type)
          .filter((type): type is string => Boolean(type)),
      ),
    ].sort((a, b) => a.localeCompare(b));

    return { data: types, error: null };
  },
});

/** Assignment status counts for the exercise library filter panel. */
export const getExerciseAssignmentCounts = defineQuery({
  key: exerciseKeys.assignmentCounts,
  schema: assignmentCountsSchema,
  execute: async (client) => {
    const { data, error } = await client.rpc('get_exercise_assignment_counts');

    if (error) {
      return { data: null, error };
    }

    const parsed = assignmentCountsSchema.safeParse(
      data ?? { all: 0, assigned: 0, unassigned: 0 },
    );

    if (!parsed.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    return { data: parsed.data, error: null };
  },
});

/** Paginated exercises with search, sort, and optional type filter. */
export const listExercisesPaginated = defineQuery({
  key: (
    page: number,
    pageSize: number,
    search: string | undefined,
    sortBy: string,
    sortOrder: 'asc' | 'desc',
    type: string | null | undefined,
  ) =>
    exerciseKeys.paginated({
      page,
      pageSize,
      search,
      sortBy,
      sortOrder,
      type,
    }),
  schema: paginatedExerciseSchema,
  execute: async (
    client,
    page: number,
    pageSize: number,
    search: string | undefined,
    sortBy: string,
    sortOrder: 'asc' | 'desc',
    type: string | null | undefined,
  ) => {
    let request = client
      .from('exercises')
      .select('*', { count: 'exact' })
      .not('video_url', 'is', null);

    if (search) {
      request = request.ilike('exercise_name', `%${search}%`);
    }

    if (type) {
      request = request.eq('type', type);
    }

    request = request.order(sortBy, { ascending: sortOrder === 'asc' });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const { data, error, count } = await request.range(from, to);

    if (error) {
      return { data: null, error };
    }

    const parsed = exerciseListSchema.safeParse(data ?? []);
    if (!parsed.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    const total = count ?? 0;
    const hasMore = from + parsed.data.length < total;

    return {
      data: {
        data: parsed.data,
        page,
        pageSize,
        total,
        hasMore,
      },
      error: null,
    };
  },
});

/** Paginated exercises with multi-faceted filtering. */
export const listExercisesFiltered = defineQuery({
  key: (input: ListExercisesFilteredInput) => exerciseKeys.filtered(input),
  schema: paginatedExerciseSchema,
  execute: async (client, input: ListExercisesFilteredInput) => {
    const {
      search,
      type,
      assignment = 'all',
      tagIds,
      page = 1,
      pageSize = 20,
      sortBy = 'created_at',
      sortOrder = 'desc',
    } = input;

    const { data, error } = await client.rpc('list_exercises_filtered', {
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
      return { data: null, error };
    }

    const payload = (data as {
      data: unknown[];
      count: number;
      page: number;
      pageSize: number;
      totalPages: number;
    }) ?? { data: [], count: 0, page: 1, pageSize: 20, totalPages: 0 };

    const parsedData = exerciseListSchema.safeParse(payload.data ?? []);
    if (!parsedData.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    const total = payload.count ?? 0;
    const hasMore = page * pageSize < total;

    return {
      data: {
        data: parsedData.data,
        page,
        pageSize,
        total,
        hasMore,
      },
      error: null,
    };
  },
});

/**
 * @deprecated Builder slice — use DAL queries directly. Retained until builder migrates.
 */
export class ExercisesQuery {
  public async getListPaginated(
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    sortBy: string = 'updated_at',
    sortOrder: 'asc' | 'desc' = 'desc',
    type?: string | null,
  ): Promise<SupabaseSuccess<PaginatedResult<Exercise>> | SupabaseError> {
    const { createClient } = await import('@/lib/supabase/core/server');
    const client = await createClient();
    return toLegacyResult(
      await query(
        listExercisesPaginated,
        page,
        pageSize,
        search,
        sortBy,
        sortOrder,
        type,
        { client },
      ),
    );
  }

  public async getDistinctTypes(): Promise<
    SupabaseSuccess<string[]> | SupabaseError
  > {
    const { createClient } = await import('@/lib/supabase/core/server');
    const client = await createClient();
    return toLegacyResult(await query(getExerciseDistinctTypes, { client }));
  }
}
