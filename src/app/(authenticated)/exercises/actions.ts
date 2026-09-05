'use server';

import { mutate, query, type DalResult } from '@/lib/dal';
import { createAdminClient } from '@/lib/supabase/core/admin';
import { createClient } from '@/lib/supabase/core/server';
import type { PaginatedResult } from '@/lib/supabase/queries/exercise-templates';
import {
  getExerciseAssignmentCounts as getExerciseAssignmentCountsQuery,
  listExercises,
  listExercisesFiltered,
  updateExercise as updateExerciseMutation,
  type ExerciseAssignmentCounts,
} from '@/lib/supabase/queries/exercises';
import {
  getAllTags as getAllTagsQuery,
  getExerciseTags as getExerciseTagsQuery,
  listTagCategories as listTagCategoriesQuery,
  searchTags as searchTagsQuery,
  setExerciseTags as setExerciseTagsMutation,
  upsertTag as upsertTagMutation,
} from '@/lib/supabase/queries/tags';
import type { Exercise } from '@/lib/supabase/schemas/exercises';
import type {
  SetExerciseTagsResult,
  Tag,
  UpsertTagResult,
} from '@/lib/supabase/schemas/tags';
import type { SupabaseError, SupabaseSuccess } from '@/lib/supabase/result';

function toSupabaseResult<T>(
  result: DalResult<T>,
): SupabaseSuccess<T> | SupabaseError {
  const [err, data] = result;
  if (err) {
    return { success: false, error: err.message };
  }
  return { success: true, data };
}

/**
 * Get all exercises
 */
export async function getExercises(): Promise<
  SupabaseSuccess<Exercise[]> | SupabaseError
> {
  const client = await createClient();
  return toSupabaseResult(await query(listExercises, { client }));
}

/**
 * Update an exercise
 */
export async function updateExercise(
  id: number,
  data: Partial<Exercise>,
): Promise<SupabaseSuccess<Exercise> | SupabaseError> {
  const client = await createAdminClient();
  const [err, entity] = await mutate(
    updateExerciseMutation,
    { id, data },
    { client },
  );
  if (err) {
    return { success: false, error: err.message };
  }
  return { success: true, data: { ...entity, id: Number(entity.id) } };
}

/**
 * List distinct tag categories.
 */
export async function listTagCategories(): Promise<
  SupabaseSuccess<string[]> | SupabaseError
> {
  const client = await createClient();
  return toSupabaseResult(await query(listTagCategoriesQuery, { client }));
}

/**
 * Search tags (optional category + query).
 */
export async function searchTags(params: {
  q?: string;
  category?: string;
  limit?: number;
}): Promise<SupabaseSuccess<Tag[]> | SupabaseError> {
  const client = await createClient();
  return toSupabaseResult(await query(searchTagsQuery, params, { client }));
}

/**
 * Tags assigned to an exercise.
 */
export async function getExerciseTags(
  exerciseId: number,
): Promise<SupabaseSuccess<Tag[]> | SupabaseError> {
  const client = await createClient();
  return toSupabaseResult(
    await query(getExerciseTagsQuery, exerciseId, { client }),
  );
}

/**
 * Idempotent upsert of a catalog tag.
 */
export async function upsertTag(params: {
  category: string;
  name: string;
}): Promise<SupabaseSuccess<UpsertTagResult> | SupabaseError> {
  const client = await createClient();
  const [err, entity] = await mutate(upsertTagMutation, params, { client });
  if (err) {
    return { success: false, error: err.message };
  }
  return {
    success: true,
    data: { ...entity, id: Number(entity.id) },
  };
}

/**
 * Replace-all tag assignment for an exercise.
 */
export async function setExerciseTags(params: {
  exerciseId: number;
  tagIds: number[];
}): Promise<SupabaseSuccess<SetExerciseTagsResult> | SupabaseError> {
  const client = await createClient();
  const [err, entity] = await mutate(setExerciseTagsMutation, params, {
    client,
  });
  if (err) {
    return { success: false, error: err.message };
  }
  return {
    success: true,
    data: {
      success: entity.success,
      exercise_id: entity.exercise_id,
      tag_ids: entity.tag_ids,
    },
  };
}

/**
 * Get all catalog tags across all categories.
 */
export async function getAllTags(): Promise<
  SupabaseSuccess<Tag[]> | SupabaseError
> {
  const client = await createClient();
  return toSupabaseResult(await query(getAllTagsQuery, { client }));
}

/**
 * Get filtered paginated exercises.
 */
export async function getExercisesFiltered(params: {
  search?: string;
  type?: string | null;
  assignment?: 'all' | 'unassigned' | 'assigned';
  tagIds?: number[];
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}): Promise<
  SupabaseSuccess<PaginatedResult<Exercise>> | SupabaseError
> {
  const client = await createClient();
  return toSupabaseResult(
    await query(listExercisesFiltered, params, { client }),
  );
}

/**
 * Get assignment status counts for the exercise library filter panel.
 */
export async function getExerciseAssignmentCounts(): Promise<
  SupabaseSuccess<ExerciseAssignmentCounts> | SupabaseError
> {
  const client = await createClient();
  return toSupabaseResult(
    await query(getExerciseAssignmentCountsQuery, { client }),
  );
}
