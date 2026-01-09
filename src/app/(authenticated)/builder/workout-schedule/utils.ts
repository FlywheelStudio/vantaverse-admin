/**
 * Database schedule format: {exercises: [{id: string, type: "exercise_template" | "group"}]}[][]
 */
type DatabaseScheduleDay = {
  exercises: Array<{ id: string; type: 'exercise_template' | 'group' }>;
};

type DatabaseSchedule = DatabaseScheduleDay[][];

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
