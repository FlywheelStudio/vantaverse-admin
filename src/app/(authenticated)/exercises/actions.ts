'use server';

import { ExercisesQuery } from '@/lib/supabase/queries/exercises';
import { EquipmentsQuery } from '@/lib/supabase/queries/equipments';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

/**
 * Get all exercises
 */
export async function getExercises() {
  const query = new ExercisesQuery();
  return query.getList();
}

/**
 * Get all equipment options
 */
export async function getEquipments() {
  const query = new EquipmentsQuery();
  return query.getList();
}

/**
 * Update an exercise
 */
export async function updateExercise(id: number, data: Partial<Exercise>) {
  const query = new ExercisesQuery();
  return query.update(id, data);
}
