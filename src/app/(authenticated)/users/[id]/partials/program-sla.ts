export type ProgramSlaMode = 'assigned' | 'due' | 'overdue' | 'none';

const SLA_WINDOW_DAYS = 5;
const MS_PER_DAY = 86_400_000;

interface DueLabelResult {
  pct: number;
  label: string;
  dueText: string;
}

/**
 * Parses a `YYYY-MM-DD` string as a local calendar date (midnight local time).
 */
function parseLocalDate(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr.trim());
  if (match == null) return null;

  const year = Number(match[1]);
  const month = Number(match[2]) - 1;
  const day = Number(match[3]);
  const date = new Date(year, month, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
}

function startOfLocalDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

/** Whole calendar days from `from` to `to` (negative when `to` is before `from`). */
function calendarDaysBetween(from: Date, to: Date): number {
  const fromStart = startOfLocalDay(from);
  const toStart = startOfLocalDay(to);
  return Math.round((toStart.getTime() - fromStart.getTime()) / MS_PER_DAY);
}

function addCalendarDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function clampPct(value: number): number {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function formatDisplayDate(date: Date): string {
  return date.toLocaleDateString(undefined, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

function pluralDays(count: number): string {
  return `${count} day${count === 1 ? '' : 's'}`;
}

/**
 * Derives the member profile program SLA mode from assignment and due-date state.
 */
export function getProgramSlaMode(args: {
  programDueDate: string | null | undefined;
  hasAssignment: boolean;
  now?: Date;
}): ProgramSlaMode {
  if (args.hasAssignment) return 'assigned';

  const now = args.now ?? new Date();
  const rawDueDate = args.programDueDate;
  const dueDate =
    rawDueDate != null && rawDueDate !== ''
      ? parseLocalDate(rawDueDate)
      : null;

  if (dueDate == null) return 'none';

  const daysUntilDue = calendarDaysBetween(now, dueDate);
  if (daysUntilDue < 0) return 'overdue';
  return 'due';
}

/**
 * Best-effort calendar-day SLA label for awaiting-program UI.
 *
 * Uses calendar days as an approximation of the 5 working-day assignment window
 * (working-day math is not available without consultation timestamps).
 *
 * - `overdue`: `pct` is clamped to 100; label reflects days past due.
 * - `due`: `pct` is progress through the 5-day window ending on `programDueDate`.
 */
export function formatDueLabel(args: {
  programDueDate: string;
  mode: 'due' | 'overdue';
  now?: Date;
}): DueLabelResult {
  const now = args.now ?? new Date();
  const dueDate = parseLocalDate(args.programDueDate);

  if (dueDate == null) {
    return { pct: 0, label: 'Due date unavailable', dueText: '—' };
  }

  if (args.mode === 'overdue') {
    const daysOverdue = Math.max(0, calendarDaysBetween(dueDate, now));
    return {
      pct: 100,
      label:
        daysOverdue === 0
          ? 'Past due'
          : `${pluralDays(daysOverdue)} overdue`,
      dueText: `was due ${formatDisplayDate(dueDate)}`,
    };
  }

  const daysRemaining = Math.max(0, calendarDaysBetween(now, dueDate));
  const windowStart = addCalendarDays(dueDate, -SLA_WINDOW_DAYS);
  const daysElapsed = Math.max(0, calendarDaysBetween(windowStart, now));
  const pct = clampPct((daysElapsed / SLA_WINDOW_DAYS) * 100);

  return {
    pct,
    label:
      daysRemaining === 0
        ? 'Due today'
        : `${pluralDays(daysRemaining)} left`,
    dueText: `due ${formatDisplayDate(dueDate)}`,
  };
}
