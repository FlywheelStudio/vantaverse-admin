import { z } from 'zod';

export const tagSchema = z.object({
  id: z.number(),
  category: z.string(),
  name: z.string(),
  created_at: z.string().nullable(),
  updated_at: z.string().nullable(),
});

export type Tag = z.infer<typeof tagSchema>;

export const tagCategorySchema = z.object({
  category: z.string(),
});

export type TagCategory = z.infer<typeof tagCategorySchema>;

export const upsertTagResultSchema = z.object({
  success: z.literal(true),
  id: z.number(),
  category: z.string(),
  name: z.string(),
  created: z.boolean(),
  is_empty_category: z.boolean(),
});

export type UpsertTagResult = z.infer<typeof upsertTagResultSchema>;

export const setExerciseTagsResultSchema = z.object({
  success: z.literal(true),
  exercise_id: z.number(),
  tag_ids: z.array(z.number()),
});

export type SetExerciseTagsResult = z.infer<typeof setExerciseTagsResultSchema>;
