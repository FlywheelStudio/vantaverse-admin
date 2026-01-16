export type CompletionDay = {
  status: 'complete' | 'incomplete';
  started_at: string;
  total_sets: number;
  current_set: number;
  completed_at: string | null;
} | null;

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

export function getDayDate(
  startDate: string,
  weekIndex: number,
  dayIndex: number,
): Date {
  const start = new Date(startDate);
  const dayOffset = weekIndex * 7 + dayIndex;
  const dayDate = new Date(start);
  dayDate.setDate(start.getDate() + dayOffset);
  return dayDate;
}

export function formatDayDate(date: Date): string {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function calculateDayCompletion(completionDay: CompletionDay): number {
  if (!completionDay) {
    return 0;
  }
  if (completionDay.status === 'complete') {
    return 100;
  }
  if (completionDay.total_sets === 0) {
    return 0;
  }
  return Math.round(
    (completionDay.current_set / completionDay.total_sets) * 100,
  );
}

export function calculateOverallCompletion(
  startDate: string,
  weeks: number,
): number {
  const start = new Date(startDate);
  const now = new Date();
  const totalDays = weeks * 7;
  const daysElapsed = Math.floor(
    (now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24),
  );
  const completion = Math.min(
    Math.max((daysElapsed / totalDays) * 100, 0),
    100,
  );
  return Math.round(completion);
}

export function getProgressColor(percentage: number): string {
  const red = { r: 239, g: 68, b: 68 };
  const green = { r: 34, g: 197, b: 94 };
  const ratio = percentage / 100;
  const r = Math.round(red.r + (green.r - red.r) * ratio);
  const g = Math.round(red.g + (green.g - red.g) * ratio);
  const b = Math.round(red.b + (green.b - red.b) * ratio);
  return `rgb(${r}, ${g}, ${b})`;
}
