import 'server-only';

import type { z } from 'zod';

import { formatDalError, mutate } from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import { createClient } from '@/lib/supabase/core/server';
import {
  toLegacyResult,
  type SupabaseError,
  type SupabaseSuccess,
} from '../result';
import type { ExerciseTemplate } from '../schemas/exercise-templates';
import {
  editExerciseTemplateInputSchema,
  editExerciseTemplateMutation,
  getExerciseTemplateById,
  getExerciseTemplatesByIds,
  listExerciseTemplatesPaginated,
  type PaginatedResult,
  upsertExerciseTemplateInputSchema,
  upsertExerciseTemplateMutation,
} from './exercise-templates';

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
