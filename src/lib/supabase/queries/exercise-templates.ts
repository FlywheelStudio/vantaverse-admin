import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineMutation, defineQuery, formatDalError, mutate, type DalResult } from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/core/server';

import {
  type SupabaseError,
  type SupabaseSuccess,
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

const exerciseTemplateListSchema = exerciseTemplateSchema.array();
const paginatedExerciseTemplateSchema = z.object({
  data: exerciseTemplateListSchema,
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});

const exerciseTemplatesByIdSchema = z.record(z.string(), exerciseTemplateSchema);

const exerciseTemplateRpcResultSchema = z
  .object({
    id: z.string(),
    template_hash: z.string().optional(),
    success: z.boolean().optional(),
    message: z.string().optional(),
    error: z.string().optional(),
  })
  .passthrough();

const upsertExerciseTemplateInputSchema = z.object({
  p_exercise_id: z.number(),
  p_sets: z.number().optional(),
  p_rep: z.number().nullable().optional(),
  p_time: z.number().nullable().optional(),
  p_distance: z.string().nullable().optional(),
  p_weight: z.string().nullable().optional(),
  p_rest_time: z.number().nullable().optional(),
  p_tempo: z.array(z.string()).nullable().optional(),
  p_rep_override: z.array(z.number()).nullable().optional(),
  p_time_override: z.array(z.number()).nullable().optional(),
  p_distance_override: z.array(z.string()).nullable().optional(),
  p_weight_override: z.array(z.string()).nullable().optional(),
  p_rest_time_override: z.array(z.number()).nullable().optional(),
  p_notes: z.string().optional(),
});

const editExerciseTemplateInputSchema = upsertExerciseTemplateInputSchema.extend({
  p_template_id: z.string(),
});

export type ListExerciseTemplatesInput = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export const exerciseTemplateKeys = {
  all: ['exercise-templates'] as const,
  list: (input: ListExerciseTemplatesInput) =>
    [
      ...exerciseTemplateKeys.all,
      'list',
      input.page ?? 1,
      input.pageSize ?? 20,
      input.search ?? '',
      input.sortBy ?? 'updated_at',
      input.sortOrder ?? 'desc',
    ] as const,
  detail: (id: string) => [...exerciseTemplateKeys.all, 'detail', id] as const,
  byIds: (ids: string[]) =>
    [...exerciseTemplateKeys.all, 'byIds', ...[...ids].sort()] as const,
};

type RawExerciseTemplateRow = Record<string, unknown> & {
  exercises:
    | {
        exercise_name: string | null;
        video_type: string | null;
        video_url: string | null;
        thumbnail_url: string | null;
      }
    | {
        exercise_name: string | null;
        video_type: string | null;
        video_url: string | null;
        thumbnail_url: string | null;
      }[]
    | null;
};

function transformExerciseTemplateRow(
  item: RawExerciseTemplateRow,
): Record<string, unknown> {
  const exercise = Array.isArray(item.exercises)
    ? item.exercises[0]
    : item.exercises;

  return {
    ...item,
    exercise_name: exercise?.exercise_name || '',
    video_type: exercise?.video_type || undefined,
    video_url: exercise?.video_url || undefined,
    thumbnail_url: exercise?.thumbnail_url ?? undefined,
  };
}

const exerciseTemplateSelect = `
  *,
  exercises!exercise_templates_exercise_id_fkey (
    exercise_name,
    video_type,
    video_url,
    thumbnail_url
  )
`;

async function fetchExerciseTemplatesPaginated(
  client: SupabaseClient<Database>,
  input: ListExerciseTemplatesInput,
): Promise<{
  data: PaginatedResult<ExerciseTemplate> | null;
  error: { message: string; code?: string } | null;
}> {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const search = input.search;
  const sortBy = input.sortBy ?? 'updated_at';
  const sortOrder = input.sortOrder ?? 'desc';

  let request = client
    .from('exercise_templates')
    .select(exerciseTemplateSelect, { count: 'exact' });

  if (sortBy !== 'exercise_name') {
    request = request.order(sortBy, { ascending: sortOrder === 'asc' });
  } else {
    request = request.order('updated_at', { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  request = request.range(from, to);

  const { data, error, count } = await request;

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return {
      data: {
        data: [],
        page,
        pageSize,
        total: 0,
        hasMore: false,
      },
      error: null,
    };
  }

  let transformedData = (data as RawExerciseTemplateRow[]).map(
    transformExerciseTemplateRow,
  );

  if (search) {
    transformedData = transformedData.filter((item) =>
      String(item.exercise_name ?? '')
        .toLowerCase()
        .includes(search.toLowerCase()),
    );
  }

  if (sortBy === 'exercise_name') {
    transformedData.sort((left, right) => {
      const leftName = String(left.exercise_name ?? '');
      const rightName = String(right.exercise_name ?? '');
      const comparison = leftName.localeCompare(rightName);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }

  const parsed = exerciseTemplateSchema.array().safeParse(transformedData);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  const adjustedTotal = search ? parsed.data.length : count || 0;
  const hasMore = search
    ? false
    : from + parsed.data.length < adjustedTotal;

  return {
    data: {
      data: parsed.data,
      page,
      pageSize,
      total: adjustedTotal,
      hasMore,
    },
    error: null,
  };
}

async function fetchExerciseTemplatesByIds(
  client: SupabaseClient<Database>,
  ids: string[],
): Promise<{
  data: Record<string, ExerciseTemplate> | null;
  error: { message: string; code?: string } | null;
}> {
  if (ids.length === 0) {
    return { data: {}, error: null };
  }

  const { data, error } = await client
    .from('exercise_templates')
    .select(exerciseTemplateSelect)
    .in('id', ids);

  if (error) {
    return { data: null, error };
  }

  const lookup: Record<string, ExerciseTemplate> = {};
  for (const item of (data ?? []) as RawExerciseTemplateRow[]) {
    const transformed = transformExerciseTemplateRow(item);
    const parsed = exerciseTemplateSchema.safeParse(transformed);
    if (parsed.success) {
      lookup[String(item.id)] = parsed.data;
    }
  }

  return { data: lookup, error: null };
}

function parseRpcEnvelope(
  result: unknown,
  fallbackMessage: string,
): { data: unknown; error: { message: string } | null } {
  if (!result || (result as { success?: boolean }).success === false) {
    const errorResult = result as { message?: string; error?: string };
    return {
      data: null,
      error: {
        message:
          errorResult.message || errorResult.error || fallbackMessage,
      },
    };
  }

  return { data: result, error: null };
}

/** Paginated exercise templates with search and sort. */
export const listExerciseTemplatesPaginated = defineQuery({
  key: (input: ListExerciseTemplatesInput) => exerciseTemplateKeys.list(input),
  schema: paginatedExerciseTemplateSchema,
  execute: (client, input: ListExerciseTemplatesInput) =>
    fetchExerciseTemplatesPaginated(client, input),
});

/** Exercise template by id. */
export const getExerciseTemplateById = defineQuery({
  key: exerciseTemplateKeys.detail,
  schema: exerciseTemplateSchema,
  execute: async (client, id: string) => {
    const { data, error } = await client
      .from('exercise_templates')
      .select(exerciseTemplateSelect)
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: { message: 'Exercise template not found' } };
    }

    return {
      data: transformExerciseTemplateRow(data as RawExerciseTemplateRow),
      error: null,
    };
  },
});

/** Exercise templates keyed by id. */
export const getExerciseTemplatesByIds = defineQuery({
  key: (ids: string[]) => exerciseTemplateKeys.byIds(ids),
  schema: exerciseTemplatesByIdSchema,
  execute: (client, ids: string[]) => fetchExerciseTemplatesByIds(client, ids),
});

/** Upsert exercise template via RPC. */
export const upsertExerciseTemplateMutation = defineMutation({
  inputSchema: upsertExerciseTemplateInputSchema,
  schema: exerciseTemplateRpcResultSchema,
  execute: async (client, input) => {
    type RpcArgs =
      Database['public']['Functions']['upsert_exercise_template']['Args'];
    const { data: result, error } = await client.rpc(
      'upsert_exercise_template',
      input as RpcArgs,
    );

    if (error) {
      return { data: null, error };
    }

    return parseRpcEnvelope(result, 'Failed to upsert exercise template');
  },
  targets: () => [exerciseTemplateKeys.all],
});

/** Edit exercise template via RPC. */
export const editExerciseTemplateMutation = defineMutation({
  inputSchema: editExerciseTemplateInputSchema,
  schema: exerciseTemplateRpcResultSchema,
  execute: async (client, input) => {
    type RpcArgs =
      Database['public']['Functions']['edit_exercise_template']['Args'];
    const { data: result, error } = await client.rpc(
      'edit_exercise_template',
      input as RpcArgs,
    );

    if (error) {
      return { data: null, error };
    }

    return parseRpcEnvelope(result, 'Failed to edit exercise template');
  },
  targets: () => [exerciseTemplateKeys.all],
});

function toLegacyResult<T>(
  result: DalResult<T>,
): SupabaseSuccess<T> | SupabaseError {
  const [err, data] = result;
  if (err) {
    return { success: false, error: formatDalError(err) };
  }
  return { success: true, data };
}

/** Legacy facade for callers outside Wave B scope (e.g. program-assignments). */
export class ExerciseTemplatesQuery {
  public async getListPaginated(
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    sortBy: string = 'updated_at',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<
    SupabaseSuccess<PaginatedResult<ExerciseTemplate>> | SupabaseError
  > {
    return toLegacyResult(
      await queryWithSession(listExerciseTemplatesPaginated, {
        page,
        pageSize,
        search,
        sortBy,
        sortOrder,
      }),
    );
  }

  public async getById(
    id: string,
  ): Promise<SupabaseSuccess<ExerciseTemplate> | SupabaseError> {
    return toLegacyResult(await queryWithSession(getExerciseTemplateById, id));
  }

  public async getByIds(
    ids: string[],
  ): Promise<SupabaseSuccess<Map<string, ExerciseTemplate>> | SupabaseError> {
    const result = await queryWithSession(getExerciseTemplatesByIds, ids);
    const [err, data] = result;
    if (err) {
      return { success: false, error: formatDalError(err) };
    }
    return { success: true, data: new Map(Object.entries(data)) };
  }

  public async upsertExerciseTemplate(
    data: z.infer<typeof upsertExerciseTemplateInputSchema>,
  ): Promise<SupabaseSuccess<unknown> | SupabaseError> {
    const client = await createClient();
    const [err, rpcData] = await mutate(upsertExerciseTemplateMutation, data, {
      client,
    });
    if (err) {
      return { success: false, error: formatDalError(err) };
    }
    return { success: true, data: rpcData };
  }

  public async editExerciseTemplate(
    data: z.infer<typeof editExerciseTemplateInputSchema>,
  ): Promise<SupabaseSuccess<unknown> | SupabaseError> {
    const client = await createClient();
    const [err, rpcData] = await mutate(editExerciseTemplateMutation, data, {
      client,
    });
    if (err) {
      return { success: false, error: formatDalError(err) };
    }
    return { success: true, data: rpcData };
  }
}
