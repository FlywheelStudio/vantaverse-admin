/**
 * Database schedule format: {exercises: [{id: string, type: "exercise_template" | "group"}]}[][]
 */
export type DatabaseScheduleDay = {
  exercises: Array<{ id: string; type: 'exercise_template' | 'group' }>;
};

export type DatabaseSchedule = DatabaseScheduleDay[][];

/**
 * SelectedItem types from the UI
 */
import type { SelectedItem } from '@/app/(authenticated)/builder/template-config/types';

/**
 * Merge base schedule with patient override
 * Only replaces base schedule items if override has exercises (length > 0)
 */
export function mergeScheduleWithOverride(
  baseSchedule: DatabaseSchedule | null,
  patientOverride: DatabaseSchedule | null | undefined,
): DatabaseSchedule {
  // If no base schedule, return empty or override if exists
  if (!baseSchedule) {
    return patientOverride || [];
  }

  // If no override, return base schedule
  if (!patientOverride) {
    return baseSchedule;
  }

  // Create a deep copy of base schedule
  const merged: DatabaseSchedule = baseSchedule.map((week) =>
    week.map((day) => ({ ...day, exercises: [...day.exercises] })),
  );

  // Merge override into base schedule
  for (let weekIndex = 0; weekIndex < patientOverride.length; weekIndex++) {
    const overrideWeek = patientOverride[weekIndex];
    if (!overrideWeek) continue;

    // Ensure merged schedule has enough weeks
    while (merged.length <= weekIndex) {
      merged.push([]);
    }

    for (let dayIndex = 0; dayIndex < overrideWeek.length; dayIndex++) {
      const overrideDay = overrideWeek[dayIndex];
      if (!overrideDay) continue;

      // Only replace if override has exercises (ignore empty arrays)
      if (overrideDay.exercises && overrideDay.exercises.length > 0) {
        // Ensure week has enough days
        while (merged[weekIndex].length <= dayIndex) {
          merged[weekIndex].push({ exercises: [] });
        }

        // Replace with override
        merged[weekIndex][dayIndex] = {
          exercises: [...overrideDay.exercises],
        };
      }
    }
  }

  return merged;
}

/**
 * Convert DatabaseSchedule format to 3D array format for RPC function
 * Converts [week][day] with {"exercises": [...]} to [week][day][items]
 * where items is a direct array of {id, type} objects
 */
export function formatScheduleDB(
  schedule: DatabaseSchedule,
): Array<Array<Array<{ id: string; type: 'exercise_template' | 'group' }>>> {
  // Handle empty schedule
  if (!schedule || schedule.length === 0) {
    return [[[], [], [], [], [], [], []]];
  }

  return schedule.map((week) => {
    // Ensure week has exactly 7 days
    const normalizedWeek: Array<
      Array<{ id: string; type: 'exercise_template' | 'group' }>
    > = [];

    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const day = week[dayIndex];

      // Extract exercises array from {"exercises": [...]} or use empty array
      if (day && day.exercises && Array.isArray(day.exercises)) {
        normalizedWeek.push([...day.exercises]);
      } else {
        normalizedWeek.push([]);
      }
    }

    return normalizedWeek;
  });
}

/**
 * Convert SelectedItem[][][] to DatabaseSchedule format
 * Upserts groups without IDs first, then extracts only IDs and types
 * Returns both the database schedule and the updated schedule with group IDs
 */
export async function convertSelectedItemsToDatabaseSchedule(
  schedule: SelectedItem[][][],
  upsertGroupFn: (data: {
    p_title: string;
    p_exercise_template_ids?: string[];
    p_is_superset?: boolean;
    p_note?: string;
  }) => Promise<
    { success: true; data: { id: string } } | { success: false; error: string }
  >,
): Promise<
  | {
      success: true;
      data: DatabaseSchedule;
      updatedSchedule: SelectedItem[][][];
    }
  | { success: false; error: string }
> {
  const dbSchedule: DatabaseSchedule = [];
  const updatedSchedule: SelectedItem[][][] = [];

  // Normalize schedule: ensure week 0 exists and each week has all 7 days
  const normalizedSchedule: SelectedItem[][][] =
    schedule.length === 0
      ? [[[], [], [], [], [], [], []]]
      : schedule.map((week) => {
          const normalizedWeek = [...(week || [])];
          while (normalizedWeek.length < 7) {
            normalizedWeek.push([]);
          }
          return normalizedWeek;
        });

  // Process each week
  for (let weekIndex = 0; weekIndex < normalizedSchedule.length; weekIndex++) {
    const week = normalizedSchedule[weekIndex];
    const dbWeek: DatabaseScheduleDay[] = [];
    const updatedWeek: SelectedItem[][] = [];

    // Process each day
    for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
      const day = week[dayIndex] || [];
      const dbDay: DatabaseScheduleDay = { exercises: [] };
      const updatedDay: SelectedItem[] = [];

      // Process each item
      for (const item of day) {
        // Skip exercises (no workout data)
        if (item.type === 'exercise') {
          continue;
        }

        // Handle templates
        if (item.type === 'template') {
          dbDay.exercises.push({
            id: item.data.id,
            type: 'exercise_template',
          });
          updatedDay.push(item);
          continue;
        }

        // Handle groups
        if (item.type === 'group') {
          let groupId = item.data.id;

          // If group doesn't have an ID, upsert it first
          if (!groupId) {
            // Extract exercise template IDs from group items
            const exerciseTemplateIds: string[] = [];
            if (item.data.items && Array.isArray(item.data.items)) {
              for (const groupItem of item.data.items) {
                if (
                  typeof groupItem === 'object' &&
                  groupItem !== null &&
                  'type' in groupItem &&
                  groupItem.type === 'template' &&
                  'data' in groupItem &&
                  typeof groupItem.data === 'object' &&
                  groupItem.data !== null &&
                  'id' in groupItem.data &&
                  typeof groupItem.data.id === 'string'
                ) {
                  exerciseTemplateIds.push(groupItem.data.id);
                }
              }
            }

            // Upsert the group
            const result = await upsertGroupFn({
              p_title: item.data.name || '',
              p_exercise_template_ids:
                exerciseTemplateIds.length > 0
                  ? exerciseTemplateIds
                  : undefined,
              p_is_superset: item.data.isSuperset || false,
            });

            if (!result.success) {
              return {
                success: false,
                error: result.error || 'Failed to upsert group',
              };
            }

            groupId = result.data.id;
          }

          dbDay.exercises.push({
            id: groupId,
            type: 'group',
          });

          // Update the item with the group ID
          updatedDay.push({
            ...item,
            data: {
              ...item.data,
              id: groupId,
            },
          });
        }
      }

      dbWeek.push(dbDay);
      updatedWeek.push(updatedDay);
    }

    dbSchedule.push(dbWeek);
    updatedSchedule.push(updatedWeek);
  }

  return {
    success: true,
    data: dbSchedule,
    updatedSchedule,
  };
}
