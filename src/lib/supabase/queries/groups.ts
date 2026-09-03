import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import {
  defineMutation,
  defineQuery,
  formatDalError,
  mutate,
  query,
  type DalResult,
} from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';
import {
  type SupabaseError,
  type SupabaseSuccess,
} from '../result';
import type { PaginatedResult } from './exercise-templates';

export const groupSchema = z.object({
  id: z.string(),
  title: z.string(),
  is_superset: z.boolean().nullable(),
  note: z.string().nullable(),
  exercise_template_ids: z.array(z.string()).nullable(),
  group_hash: z.string(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type Group = z.infer<typeof groupSchema>;

const groupListSchema = groupSchema.array();
const paginatedGroupSchema = z.object({
  data: groupListSchema,
  page: z.number().int().positive(),
  pageSize: z.number().int().positive(),
  total: z.number().int().nonnegative(),
  hasMore: z.boolean(),
});
const groupsByIdSchema = z.record(z.string(), groupSchema);

const upsertGroupInputSchema = z.object({
  p_title: z.string(),
  p_exercise_template_ids: z.array(z.string()).optional(),
  p_is_superset: z.boolean().optional(),
  p_note: z.string().optional(),
});

const upsertGroupResultSchema = z
  .object({
    id: z.string(),
    group_hash: z.string(),
    cloned: z.boolean(),
    reference_count: z.number(),
    original_id: z.string().optional(),
  })
  .passthrough();

export type ListGroupsInput = {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
};

export const groupKeys = {
  all: ['groups'] as const,
  list: (input: ListGroupsInput) =>
    [
      ...groupKeys.all,
      'list',
      input.page ?? 1,
      input.pageSize ?? 20,
      input.search ?? '',
      input.sortBy ?? 'updated_at',
      input.sortOrder ?? 'desc',
    ] as const,
  detail: (id: string) => [...groupKeys.all, 'detail', id] as const,
  byIds: (ids: string[]) =>
    [...groupKeys.all, 'byIds', ...[...ids].sort()] as const,
};

async function fetchGroupsPaginated(
  client: SupabaseClient<Database>,
  input: ListGroupsInput,
): Promise<{
  data: PaginatedResult<Group> | null;
  error: { message: string; code?: string } | null;
}> {
  const page = input.page ?? 1;
  const pageSize = input.pageSize ?? 20;
  const search = input.search;
  const sortBy = input.sortBy ?? 'updated_at';
  const sortOrder = input.sortOrder ?? 'desc';

  let request = client.from('groups').select('*', { count: 'exact' });

  if (search) {
    request = request.ilike('title', `%${search}%`);
  }

  const normalizedSortBy =
    sortBy === 'exercise_name' ? 'title' : sortBy === 'name' ? 'title' : sortBy;

  const allowedSortFields = new Set(['updated_at', 'created_at', 'title']);
  const safeSortBy = allowedSortFields.has(normalizedSortBy)
    ? normalizedSortBy
    : 'updated_at';

  request = request.order(safeSortBy, { ascending: sortOrder === 'asc' });

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

  const parsed = groupSchema.array().safeParse(data);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  const total = count ?? parsed.data.length;
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
}

async function fetchGroupsByIds(
  client: SupabaseClient<Database>,
  ids: string[],
): Promise<{
  data: Record<string, Group> | null;
  error: { message: string; code?: string } | null;
}> {
  if (ids.length === 0) {
    return { data: {}, error: null };
  }

  const { data, error } = await client.from('groups').select('*').in('id', ids);

  if (error) {
    return { data: null, error };
  }

  if (!data || data.length === 0) {
    return { data: {}, error: null };
  }

  const lookup: Record<string, Group> = {};
  for (const item of data) {
    const parsed = groupSchema.safeParse(item);
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

/** Paginated groups with search and sort. */
export const listGroupsPaginated = defineQuery({
  key: (input: ListGroupsInput) => groupKeys.list(input),
  schema: paginatedGroupSchema,
  client: 'admin',
  execute: (client, input: ListGroupsInput) =>
    fetchGroupsPaginated(client, input),
});

/** Group by id. */
export const getGroupById = defineQuery({
  key: groupKeys.detail,
  schema: groupSchema,
  client: 'admin',
  execute: async (client, id: string) => {
    const { data, error } = await client
      .from('groups')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: { message: 'Group not found' } };
    }

    return { data, error: null };
  },
});

/** Groups keyed by id. */
export const getGroupsByIds = defineQuery({
  key: (ids: string[]) => groupKeys.byIds(ids),
  schema: groupsByIdSchema,
  client: 'admin',
  execute: (client, ids: string[]) => fetchGroupsByIds(client, ids),
});

/** Upsert group via RPC. */
export const upsertGroupMutation = defineMutation({
  inputSchema: upsertGroupInputSchema,
  schema: upsertGroupResultSchema,
  client: 'admin',
  execute: async (client, input) => {
    type RpcArgs = Database['public']['Functions']['upsert_group']['Args'];
    const { data: result, error } = await client.rpc(
      'upsert_group',
      input as RpcArgs,
    );

    if (error) {
      return { data: null, error };
    }

    return parseRpcEnvelope(result, 'Failed to upsert group');
  },
  targets: () => [groupKeys.all],
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
export class GroupsQuery {
  public async getListPaginated(
    page: number = 1,
    pageSize: number = 20,
    search?: string,
    sortBy: string = 'updated_at',
    sortOrder: 'asc' | 'desc' = 'desc',
  ): Promise<SupabaseSuccess<PaginatedResult<Group>> | SupabaseError> {
    return toLegacyResult(
      await query(listGroupsPaginated, {
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
  ): Promise<SupabaseSuccess<Group> | SupabaseError> {
    return toLegacyResult(await query(getGroupById, id));
  }

  public async getByIds(
    ids: string[],
  ): Promise<SupabaseSuccess<Map<string, Group>> | SupabaseError> {
    const result = await query(getGroupsByIds, ids);
    const [err, data] = result;
    if (err) {
      return { success: false, error: formatDalError(err) };
    }
    return { success: true, data: new Map(Object.entries(data)) };
  }

  public async upsertGroup(
    data: z.infer<typeof upsertGroupInputSchema>,
  ): Promise<
    | {
        success: true;
        data: {
          id: string;
          group_hash: string;
          cloned: boolean;
          reference_count: number;
          original_id?: string;
        };
      }
    | { success: false; error: string }
  > {
    const [err, rpcData] = await mutate(upsertGroupMutation, data);
    if (err) {
      return { success: false, error: formatDalError(err) };
    }
    return {
      success: true,
      data: {
        id: rpcData.id,
        group_hash: rpcData.group_hash,
        cloned: rpcData.cloned,
        reference_count: rpcData.reference_count,
        original_id: rpcData.original_id,
      },
    };
  }
}
