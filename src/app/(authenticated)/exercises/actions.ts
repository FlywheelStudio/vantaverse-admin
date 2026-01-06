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
 * Update an exercise
 */
export async function updateExercise(id: number, data: Partial<Exercise>) {
  const query = new ExercisesQuery();
  return query.update(id, data);
}
