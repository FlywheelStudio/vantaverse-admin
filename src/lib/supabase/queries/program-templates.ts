import { z } from 'zod';

import {
  defineMutation,
  defineQuery,
  formatDalError,
  mutate,
  type DalResult,
} from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import type { Database } from '@/lib/supabase/database.types';
import { createClient } from '@/lib/supabase/core/server';

import { type SupabaseError, type SupabaseSuccess } from '../result';
import {
  programTemplateSchema,
  type ProgramTemplate,
} from '../schemas/program-templates';

const programTemplateListSchema = programTemplateSchema.array();

const createProgramTemplateInputSchema = z.object({
  name: z.string().min(1),
  weeks: z.number().int().positive(),
  description: z.string().nullable().optional(),
  goals: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  organizationId: z.string().uuid().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
});

const updateProgramTemplateInputSchema = z.object({
  id: z.string().uuid(),
  data: programTemplateSchema.partial(),
});

const deleteProgramTemplateInputSchema = z.object({
  id: z.string().uuid(),
});

const deleteProgramTemplateResultSchema = z.object({
  id: z.string().uuid(),
});

export type CreateProgramTemplateInput = z.infer<
  typeof createProgramTemplateInputSchema
>;
export type UpdateProgramTemplateInput = z.infer<
  typeof updateProgramTemplateInputSchema
>;

export const programTemplateKeys = {
  all: ['program-templates'] as const,
  list: () => [...programTemplateKeys.all, 'list'] as const,
  detail: (id: string) => [...programTemplateKeys.all, 'detail', id] as const,
};

/** All program templates. */
export const listProgramTemplates = defineQuery({
  key: programTemplateKeys.list,
  schema: programTemplateListSchema,
  execute: async (client) => {
    const { data, error } = await client
      .from('program_template')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return { data: null, error };
    }

    return { data: data ?? [], error: null };
  },
});

/** Program template by id. */
export const getProgramTemplateById = defineQuery({
  key: programTemplateKeys.detail,
  schema: programTemplateSchema,
  execute: async (client, id: string) => {
    const { data, error } = await client
      .from('program_template')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: { message: 'Program template not found' } };
    }

    return { data, error: null };
  },
});

/** Create program template. */
export const createProgramTemplate = defineMutation({
  inputSchema: createProgramTemplateInputSchema,
  schema: programTemplateSchema,
  execute: async (client, input) => {
    const { data, error } = await client
      .from('program_template')
      .insert({
        name: input.name.trim(),
        weeks: input.weeks,
        description: input.description?.trim() || null,
        goals: input.goals?.trim() || null,
        notes: input.notes?.trim() || null,
        organization_id: input.organizationId || null,
        active: true,
        image_url: input.imageUrl ? { image_url: input.imageUrl } : null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: { message: 'Failed to create program template' } };
    }

    return { data, error: null };
  },
  targets: () => [programTemplateKeys.all],
});

/** Update program template (service role). */
export const updateProgramTemplate = defineMutation({
  inputSchema: updateProgramTemplateInputSchema,
  schema: programTemplateSchema,
  client: 'admin',
  execute: async (client, input) => {
    type ProgramTemplateUpdate =
      Database['public']['Tables']['program_template']['Update'];
    const { data, error } = await client
      .from('program_template')
      .update({
        ...(input.data as ProgramTemplateUpdate),
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: { message: 'Failed to update program template' } };
    }

    return { data, error: null };
  },
  targets: (input) => [programTemplateKeys.all, programTemplateKeys.detail(input.id)],
});

/** Delete program template. */
export const deleteProgramTemplate = defineMutation({
  inputSchema: deleteProgramTemplateInputSchema,
  schema: deleteProgramTemplateResultSchema,
  execute: async (client, input) => {
    const { error } = await client
      .from('program_template')
      .delete()
      .eq('id', input.id);

    if (error) {
      return { data: null, error };
    }

    return { data: { id: input.id }, error: null };
  },
  targets: () => [programTemplateKeys.all],
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
