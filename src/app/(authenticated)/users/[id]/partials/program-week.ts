import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';

export type CompletionDay = {
  status: 'complete' | 'incomplete';
  started_at: string;
  total_sets: number;
  current_set: number;
  completed_at: string | null;
} | null;

export type WeekDayState = 'done' | 'today' | 'todo' | 'rest';

export interface WeekStripDay {
  label: string;
  dateLabel: string;
  state: WeekDayState;
  currentSets: number;
  totalSets: number;
  dayIndex: number;
}

export interface DayPlanBlock {
  title: string;
  items: string[];
}

export interface AdherencePeriod {
  label: string;
  doneSessions: number;
  expectedSessions: number;
  pct: number;
}

const WEEK_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;
const MS_PER_DAY = 86_400_000;

type ScheduleDay = DatabaseSchedule[number][number];
type GroupMap = Map<string, { exercise_template_ids: string[] | null }>;

/**
 * Normalizes raw program completion JSON into typed week/day rows.
 */
export function parseCompletion(
  completion: Array<Array<unknown>> | null | undefined,
): Array<Array<CompletionDay>> {
  if (!completion || !Array.isArray(completion)) {
    return [];
  }

  return completion.map((week) => {
    if (!Array.isArray(week)) {
      return [];
    }
    return week.map((day) => {
      if (!day || typeof day !== 'object') {
        return null;
      }
      const dayData = day as Record<string, unknown>;
      if (dayData.status !== 'complete' && dayData.status !== 'incomplete') {
        return null;
      }
      return {
        status: dayData.status as 'complete' | 'incomplete',
        started_at: String(dayData.started_at || ''),
        total_sets: Number(dayData.total_sets || 0),
        current_set: Number(dayData.current_set || 0),
        completed_at: dayData.completed_at
          ? String(dayData.completed_at)
          : null,
      };
    });
  });
}

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

function getMondayOfWeekContaining(date: Date): Date {
  const monday = new Date(date);
  const dayOfWeek = monday.getDay();
  const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  monday.setDate(monday.getDate() - mondayOffset);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getDayDate(
  startDate: string | null | undefined,
  weekIndex: number,
  dayIndex: number,
): Date {
  if (!startDate) {
    const today = new Date();
    const monday = getMondayOfWeekContaining(today);
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + weekIndex * 7 + dayIndex);
    return dayDate;
  }

  const start = parseLocalDate(startDate);
  const monday = getMondayOfWeekContaining(start);
  const dayDate = new Date(monday);
  dayDate.setDate(monday.getDate() + weekIndex * 7 + dayIndex);
  return dayDate;
}

function formatDayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function isSameCalendarDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function isExpectedSessionDay(day: ScheduleDay | undefined): boolean {
  return (day?.exercises.length ?? 0) > 0;
}

function isSessionDayDone(completionDay: CompletionDay): boolean {
  if (!completionDay) return false;
  if (completionDay.status === 'complete') return true;
  if (
    completionDay.total_sets > 0 &&
    completionDay.current_set >= completionDay.total_sets
  ) {
    return true;
  }
  return false;
}

function countScheduleDaySets(day: ScheduleDay | undefined): number {
  return day?.exercises.length ?? 0;
}

function resolveExerciseLabel(
  exerciseId: string,
  exerciseNamesMap: Map<string, string>,
): string {
  return exerciseNamesMap.get(exerciseId) ?? exerciseId;
}

function resolveGroupLabel(
  groupId: string,
  exerciseNamesMap: Map<string, string>,
  groupsMap: GroupMap,
): string {
  const group = groupsMap.get(groupId);
  const exerciseTemplateIds = group?.exercise_template_ids ?? [];
  const exerciseNames = exerciseTemplateIds
    .map((id) => exerciseNamesMap.get(id))
    .filter((name): name is string => Boolean(name));

  if (exerciseNames.length > 0) {
    return exerciseNames.join(', ');
  }

  return `Group: ${groupId}`;
}

function getSetCounts(
  scheduleDay: ScheduleDay | undefined,
  completionDay: CompletionDay,
): { currentSets: number; totalSets: number } {
  const scheduleTotal = countScheduleDaySets(scheduleDay);
  const currentSets = completionDay?.current_set ?? 0;
  const totalSets =
    completionDay != null && completionDay.total_sets > 0
      ? completionDay.total_sets
      : scheduleTotal;

  return { currentSets, totalSets };
}

function getWeekDayState(args: {
  isRestDay: boolean;
  isToday: boolean;
  completionDay: CompletionDay;
}): WeekDayState {
  if (args.isRestDay) return 'rest';
  if (args.isToday) return 'today';
  if (isSessionDayDone(args.completionDay)) return 'done';
  return 'todo';
}

function countWeekAdherence(args: {
  week: DatabaseSchedule[number] | undefined;
  completionWeek: Array<CompletionDay> | undefined;
}): { doneSessions: number; expectedSessions: number; pct: number } {
  let doneSessions = 0;
  let expectedSessions = 0;

  for (let dayIndex = 0; dayIndex < 7; dayIndex += 1) {
    const day = args.week?.[dayIndex];
    if (!isExpectedSessionDay(day)) continue;

    expectedSessions += 1;
    const completionDay = args.completionWeek?.[dayIndex] ?? null;
    if (isSessionDayDone(completionDay)) {
      doneSessions += 1;
    }
  }

  const pct =
    expectedSessions === 0
      ? 0
      : Math.round((doneSessions / expectedSessions) * 100);

  return { doneSessions, expectedSessions, pct };
}

/**
 * Derives the active program week index from assignment start date and today.
 */
export function getCurrentWeekIndex(args: {
  startDate: string | null | undefined;
  weekCount: number;
  now?: Date;
}): number {
  if (args.weekCount <= 0) return 0;

  const now = args.now ?? new Date();
  const nowMonday = getMondayOfWeekContaining(now);
  const anchorMonday =
    args.startDate != null && args.startDate !== ''
      ? getMondayOfWeekContaining(parseLocalDate(args.startDate))
      : nowMonday;

  const diffDays = Math.round(
    (nowMonday.getTime() - anchorMonday.getTime()) / MS_PER_DAY,
  );
  const weekIndex = Math.floor(diffDays / 7);

  return Math.min(Math.max(0, weekIndex), args.weekCount - 1);
}

/**
 * Builds the 7-day week strip for the member program tab.
 */
export function buildWeekStrip(args: {
  schedule: DatabaseSchedule | null;
  completion: Array<Array<CompletionDay>>;
  startDate: string | null | undefined;
  weekIndex: number;
  now?: Date;
}): WeekStripDay[] {
  const now = args.now ?? new Date();
  const week = args.schedule?.[args.weekIndex];

  return WEEK_LABELS.map((label, dayIndex) => {
    const scheduleDay = week?.[dayIndex];
    const completionDay = args.completion[args.weekIndex]?.[dayIndex] ?? null;
    const dayDate = getDayDate(args.startDate, args.weekIndex, dayIndex);
    const isRestDay = !isExpectedSessionDay(scheduleDay);
    const { currentSets, totalSets } = getSetCounts(scheduleDay, completionDay);

    return {
      label,
      dateLabel: formatDayDate(dayDate),
      state: getWeekDayState({
        isRestDay,
        isToday: isSameCalendarDay(dayDate, now),
        completionDay,
      }),
      currentSets,
      totalSets,
      dayIndex,
    };
  });
}

/**
 * Builds day-plan blocks from schedule exercises and name maps.
 */
export function buildDayPlan(args: {
  schedule: DatabaseSchedule | null;
  weekIndex: number;
  dayIndex: number;
  exerciseNamesMap: Map<string, string>;
  groupsMap: GroupMap;
}): DayPlanBlock[] {
  const day = args.schedule?.[args.weekIndex]?.[args.dayIndex];
  if (!day || day.exercises.length === 0) {
    return [];
  }

  const items = day.exercises.map((exercise) => {
    if (exercise.type === 'exercise_template') {
      return resolveExerciseLabel(exercise.id, args.exerciseNamesMap);
    }

    return resolveGroupLabel(
      exercise.id,
      args.exerciseNamesMap,
      args.groupsMap,
    );
  });

  return [{ title: 'Exercises', items }];
}

/**
 * Builds adherence summaries for this week, last week, and 4-week average.
 */
export function buildAdherencePeriods(args: {
  schedule: DatabaseSchedule | null;
  completion: Array<Array<CompletionDay>>;
  weekIndex: number;
}): AdherencePeriod[] {
  const thisWeek = countWeekAdherence({
    week: args.schedule?.[args.weekIndex],
    completionWeek: args.completion[args.weekIndex],
  });

  const lastWeekIndex = args.weekIndex - 1;
  const lastWeek =
    lastWeekIndex >= 0
      ? countWeekAdherence({
          week: args.schedule?.[lastWeekIndex],
          completionWeek: args.completion[lastWeekIndex],
        })
      : { doneSessions: 0, expectedSessions: 0, pct: 0 };

  const averageWeekIndexes = [
    args.weekIndex,
    args.weekIndex - 1,
    args.weekIndex - 2,
    args.weekIndex - 3,
  ].filter((weekIndex) => weekIndex >= 0);

  const averageRatios = averageWeekIndexes
    .map((weekIndex) => {
      const weekStats = countWeekAdherence({
        week: args.schedule?.[weekIndex],
        completionWeek: args.completion[weekIndex],
      });
      if (weekStats.expectedSessions === 0) return null;
      return weekStats.doneSessions / weekStats.expectedSessions;
    })
    .filter((ratio): ratio is number => ratio != null);

  const averagePct =
    averageRatios.length === 0
      ? 0
      : Math.round(
          (averageRatios.reduce((sum, ratio) => sum + ratio, 0) /
            averageRatios.length) *
            100,
        );

  return [
    { label: 'This week', ...thisWeek },
    { label: 'Last week', ...lastWeek },
    { label: '4-week average', doneSessions: 0, expectedSessions: 0, pct: averagePct },
  ];
}
