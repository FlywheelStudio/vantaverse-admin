import { z } from 'zod';

import {
  defineMutation,
  defineQuery,
} from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';

import {
  programTemplateSchema,
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

