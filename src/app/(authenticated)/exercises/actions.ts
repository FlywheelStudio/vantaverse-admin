'use server';

import { ExercisesQuery } from '@/lib/supabase/queries/exercises';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

/**
 * Get all exercises
 */
export async function getExercises() {
  const query = new ExercisesQuery();
  return query.getList();
}

/**
 * Get exercise by ID
 */
export async function getExerciseById(id: number) {
  const query = new ExercisesQuery();
  return query.getById(id);
}

/**
 * Update an exercise
 */
export async function updateExercise(
  id: number,
  data: Partial<Exercise>,
) {
  const query = new ExercisesQuery();
  return query.update(id, data);
}
