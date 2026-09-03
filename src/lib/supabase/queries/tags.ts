import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineMutation, defineQuery } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';
import {
  tagSchema,
  upsertTagResultSchema,
  setExerciseTagsResultSchema,
  type Tag,
} from '../schemas/tags';

const tagListSchema = z.array(tagSchema);
const tagCategoryListSchema = z.array(z.string());

const upsertTagInputSchema = z.object({
  category: z.string().min(1),
  name: z.string().min(1),
});

export type UpsertTagInput = z.infer<typeof upsertTagInputSchema>;

export type SearchTagsInput = {
  q?: string;
  category?: string;
  limit?: number;
};

const upsertTagMutationSchema = upsertTagResultSchema.extend({
  id: z.string(),
});

const setExerciseTagsInputSchema = z.object({
  exerciseId: z.number(),
  tagIds: z.array(z.number()),
});

export type SetExerciseTagsInput = z.infer<typeof setExerciseTagsInputSchema>;

const setExerciseTagsMutationSchema = setExerciseTagsResultSchema.extend({
  id: z.string(),
});

export const tagKeys = {
  all: ['tags'] as const,
  categories: () => [...tagKeys.all, 'categories'] as const,
  catalog: () => [...tagKeys.all, 'catalog'] as const,
  search: (category: string, q: string) =>
    [...tagKeys.all, 'search', category, q] as const,
  exercise: (exerciseId: number) =>
    [...tagKeys.all, 'exercise', exerciseId] as const,
};

async function fetchTagCategories(
  client: SupabaseClient<Database>,
): Promise<{
  data: string[] | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client.rpc('list_tag_categories');

  if (error) {
    return { data: null, error };
  }

  const parsed = z
    .array(z.object({ category: z.string() }))
    .safeParse(data ?? []);

  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return {
    data: parsed.data.map((row) => row.category),
    error: null,
  };
}

async function fetchAllTags(
  client: SupabaseClient<Database>,
): Promise<{
  data: Tag[] | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('tags')
    .select('*')
    .neq('name', 'empty')
    .order('category', { ascending: true })
    .order('name', { ascending: true });

  if (error) {
    return { data: null, error };
  }

  const parsed = tagListSchema.safeParse(data ?? []);
  if (!parsed.success) {
    return {
      data: null,
      error: { message: 'Response validation failed', code: 'VALIDATION' },
    };
  }

  return { data: parsed.data, error: null };
}

/** Distinct tag categories (includes empty seeded categories). */
export const listTagCategories = defineQuery({
  key: tagKeys.categories,
  schema: tagCategoryListSchema,
  execute: (client) => fetchTagCategories(client),
});

/** Search tags for autocomplete (excludes empty-category sentinel). */
export const searchTags = defineQuery({
  key: (input: SearchTagsInput) =>
    tagKeys.search(input.category ?? '', input.q ?? ''),
  schema: tagListSchema,
  execute: async (client, input: SearchTagsInput) => {
    const { data, error } = await client.rpc('search_tags', {
      p_q: input.q ?? undefined,
      p_category: input.category ?? undefined,
      p_limit: input.limit ?? 20,
    });

    if (error) {
      return { data: null, error };
    }

    const parsed = tagListSchema.safeParse(data ?? []);
    if (!parsed.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    return { data: parsed.data, error: null };
  },
});

/** All catalog tags across categories (excluding sentinel empty-category rows). */
export const getAllTags = defineQuery({
  key: tagKeys.catalog,
  schema: tagListSchema,
  execute: (client) => fetchAllTags(client),
});

/** Tags assigned to an exercise. */
export const getExerciseTags = defineQuery({
  key: tagKeys.exercise,
  schema: tagListSchema,
  execute: async (client, exerciseId: number) => {
    const { data, error } = await client.rpc('get_exercise_tags', {
      p_exercise_id: exerciseId,
    });

    if (error) {
      return { data: null, error };
    }

    const parsed = tagListSchema.safeParse(data ?? []);
    if (!parsed.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    return { data: parsed.data, error: null };
  },
});

/** Idempotent create or return existing tag. */
export const upsertTag = defineMutation({
  inputSchema: upsertTagInputSchema,
  schema: upsertTagMutationSchema,
  execute: async (client, input: UpsertTagInput) => {
    const { data, error } = await client.rpc('upsert_tag', {
      p_category: input.category,
      p_name: input.name,
    });

    if (error) {
      return { data: null, error };
    }

    const parsed = upsertTagResultSchema.safeParse(data);
    if (!parsed.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    return {
      data: { ...parsed.data, id: String(parsed.data.id) },
      error: null,
    };
  },
  targets: () => [tagKeys.all],
});

/** Replace-all tag assignment for an exercise. Empty array clears. */
export const setExerciseTags = defineMutation({
  inputSchema: setExerciseTagsInputSchema,
  schema: setExerciseTagsMutationSchema,
  execute: async (client, input: SetExerciseTagsInput) => {
    const { data, error } = await client.rpc('set_exercise_tags', {
      p_exercise_id: input.exerciseId,
      p_tag_ids: input.tagIds,
    });

    if (error) {
      return { data: null, error };
    }

    const parsed = setExerciseTagsResultSchema.safeParse(data);
    if (!parsed.success) {
      return {
        data: null,
        error: { message: 'Response validation failed', code: 'VALIDATION' },
      };
    }

    return {
      data: { ...parsed.data, id: String(parsed.data.exercise_id) },
      error: null,
    };
  },
  targets: (input) => [tagKeys.exercise(input.exerciseId), tagKeys.all],
});
