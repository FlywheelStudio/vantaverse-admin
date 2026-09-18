/** Helpers for Edit Workout Day modal (HTML `mdDayEditor` parity). */

const DAY_NAMES = [
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
] as const;

type DayName = (typeof DAY_NAMES)[number];

/** Quick-assign bubble values shown on selected exercise rows. */
export interface DayPrescription {
  sets: string;
  reps: string;
  time: string;
  rest: string;
}

const MINUTES_PER_EXERCISE = 5;

/**
 * Resolves weekday label from a 0-based day index (Mon=0).
 */
export function getDayName(dayIndex: number | undefined): DayName {
  if (dayIndex === undefined) return DAY_NAMES[0];
  const normalized = ((dayIndex % 7) + 7) % 7;
  return DAY_NAMES[normalized] ?? DAY_NAMES[0];
}

/**
 * Rough session length estimate for the volume footer.
 */
export function estimateSessionMinutes(exerciseCount: number): number {
  return exerciseCount * MINUTES_PER_EXERCISE;
}

/**
 * Formats volume footer copy: "N exercises · ~M min".
 */
export function formatVolumeFooter(exerciseCount: number): string {
  const mins = estimateSessionMinutes(exerciseCount);
  return `${exerciseCount} exercises · ~${mins} min`;
}
