'use server';

import { ExercisesQuery } from '@/lib/supabase/queries/exercises';
import { TagsQuery } from '@/lib/supabase/queries/tags';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

/**
 * Get all exercises
 */
export async function getExercises() {
  const query = new ExercisesQuery();
  return query.getList();
}

/**
 * Update an exercise
 */
export async function updateExercise(id: number, data: Partial<Exercise>) {
  const query = new ExercisesQuery();
  return query.update(id, data);
}

/**
 * List distinct tag categories.
 */
export async function listTagCategories() {
  const query = new TagsQuery();
  return query.listCategories();
}

/**
 * Search tags (optional category + query).
 */
export async function searchTags(params: {
  q?: string;
  category?: string;
  limit?: number;
}) {
  const query = new TagsQuery();
  return query.search(params);
}

/**
 * Tags assigned to an exercise.
 */
export async function getExerciseTags(exerciseId: number) {
  const query = new TagsQuery();
  return query.getExerciseTags(exerciseId);
}

/**
 * Idempotent upsert of a catalog tag.
 */
export async function upsertTag(params: { category: string; name: string }) {
  const query = new TagsQuery();
  return query.upsertTag(params);
}

/**
 * Replace-all tag assignment for an exercise.
 */
export async function setExerciseTags(params: {
  exerciseId: number;
  tagIds: number[];
}) {
  const query = new TagsQuery();
  return query.setExerciseTags(params);
}


/**
 * Get all catalog tags across all categories.
 */
export async function getAllTags() {
  const query = new TagsQuery();
  return query.getAllTags();
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
}) {
  const query = new ExercisesQuery();
  return query.getListFiltered(params);
}

/**
 * Get assignment status counts for the exercise library filter panel.
 */
export async function getExerciseAssignmentCounts() {
  const query = new ExercisesQuery();
  return query.getAssignmentCounts();
}
