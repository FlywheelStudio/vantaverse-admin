import { formatDistanceToNow } from 'date-fns';

/** Search param that opens the Workout schedule step on `/builder/[id]`. */
export const BUILDER_WORKOUT_TAB = 'workout';

/** Workout schedule step — server-visible (`?tab=workout`), unlike `#build-workout`. */
export function builderWorkoutHref(assignmentId: string): string {
  return `/builder/${assignmentId}?tab=${BUILDER_WORKOUT_TAB}`;
}

/** True when `searchParams.tab` selects the workout step. */
export function isBuilderWorkoutTab(
  tab: string | string[] | undefined,
): boolean {
  const value = Array.isArray(tab) ? tab[0] : tab;
  return value === BUILDER_WORKOUT_TAB;
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
