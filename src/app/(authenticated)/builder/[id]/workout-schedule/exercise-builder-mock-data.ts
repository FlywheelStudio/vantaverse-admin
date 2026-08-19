/** Mock defaults for Edit Workout Day modal (HTML `mdDayEditor` parity). */

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

export interface DayPrescription {
  sets: string;
  reps: string;
  rest: string;
}

/** Client-only metadata for a schedule day (no RPC persistence). */
export interface DayScheduleMeta {
  isRestDay?: boolean;
  sessionNote?: string;
}

export const EMPTY_DAY_SCHEDULE_META: DayScheduleMeta = {
  isRestDay: false,
  sessionNote: '',
};

/** Mock default Rx shown on selected rows: 3×10 · 60s */
export const DEFAULT_DAY_PRESCRIPTION: DayPrescription = {
  sets: '3',
  reps: '10',
  rest: '60s',
};


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
