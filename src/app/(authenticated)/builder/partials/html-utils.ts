import { formatDistanceToNow } from 'date-fns';

/** Search param that opens the Workout schedule step on `/builder/[id]`. */
export const BUILDER_WORKOUT_TAB = 'workout';

/** Workout schedule step — server-visible (`?tab=workout`), unlike `#build-workout`. */
export function builderWorkoutHref(
  assignmentId: string,
  week?: number,
): string {
  const params = new URLSearchParams({ tab: BUILDER_WORKOUT_TAB });
  if (week != null && week >= 1) {
    params.set('week', String(week));
  }
  return `/builder/${assignmentId}?${params.toString()}`;
}

/** True when `searchParams.tab` selects the workout step. */
export function isBuilderWorkoutTab(
  tab: string | string[] | undefined,
): boolean {
  const value = Array.isArray(tab) ? tab[0] : tab;
  return value === BUILDER_WORKOUT_TAB;
}

/**
 * Parse 1-based `?week=` into a 0-based week index.
 * Returns `undefined` when missing or invalid.
 */
export function parseBuilderWeekParam(
  week: string | string[] | undefined,
): number | undefined {
  const value = Array.isArray(week) ? week[0] : week;
  if (!value) return undefined;
  const weekNumber = Number.parseInt(value, 10);
  if (!Number.isFinite(weekNumber) || weekNumber < 1) return undefined;
  return weekNumber - 1;
}

/** Relative edited label for program table rows. */
export function formatRelativeEdited(dateStr: string | null | undefined): string {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return '—';
  }
}
