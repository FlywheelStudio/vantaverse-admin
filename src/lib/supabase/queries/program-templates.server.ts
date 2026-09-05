import 'server-only';

import { mutate } from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import { createClient } from '@/lib/supabase/core/server';
import {
  toLegacyResult,
  type SupabaseError,
  type SupabaseSuccess,
} from '../result';
import type { ProgramTemplate } from '../schemas/program-templates';
import {
  createProgramTemplate,
  deleteProgramTemplate,
  getProgramTemplateById,
  listProgramTemplates,
  updateProgramTemplate,
} from './program-templates';


/** Legacy facade for callers outside Wave B scope. */
export class ProgramTemplatesQuery {
  public async getList(): Promise<
    SupabaseSuccess<ProgramTemplate[]> | SupabaseError
  > {
    return toLegacyResult(await queryWithSession(listProgramTemplates));
  }

  public async getById(
    id: string,
  ): Promise<SupabaseSuccess<ProgramTemplate> | SupabaseError> {
    return toLegacyResult(await queryWithSession(getProgramTemplateById, id));
  }

  public async create(
    name: string,
    weeks: number,
    description?: string | null,
    goals?: string | null,
    notes?: string | null,
    organizationId?: string | null,
    imageUrl?: string | null,
  ): Promise<SupabaseSuccess<ProgramTemplate> | SupabaseError> {
    const client = await createClient();
    return toLegacyResult(
      await mutate(
        createProgramTemplate,
        {
          name,
          weeks,
          description,
          goals,
          notes,
          organizationId,
          imageUrl,
        },
        { client },
      ),
    );
  }

  public async update(
    id: string,
    data: Partial<ProgramTemplate>,
  ): Promise<SupabaseSuccess<ProgramTemplate> | SupabaseError> {
    return toLegacyResult(await mutate(updateProgramTemplate, { id, data }));
  }

  public async delete(
    id: string,
  ): Promise<SupabaseSuccess<void> | SupabaseError> {
    const client = await createClient();
    const result = await mutate(deleteProgramTemplate, { id }, { client });
    const mapped = toLegacyResult(result);
    if (!mapped.success) {
      return mapped;
    }
    return { success: true, data: undefined };
  }
}
