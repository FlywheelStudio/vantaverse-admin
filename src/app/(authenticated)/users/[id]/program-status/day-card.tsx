import { getDayOfWeek } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import {
  type CompletionDay,
  getDayDate,
  formatDayDate,
  calculateDayCompletion,
  getProgressColor,
} from './card-utils';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/workout-schedule/utils';

interface ProgramStatusDayCardProps {
  day: DatabaseSchedule[number][number];
  dayIndex: number;
  weekIndex: number;
  startDate: string;
  completionDay: CompletionDay;
  exerciseNamesMap: Map<string, string>;
  groupsMap: Map<string, { exercise_template_ids: string[] | null }>;
}

export function ProgramStatusDayCard({
  day,
  dayIndex,
  weekIndex,
  startDate,
  completionDay,
  exerciseNamesMap,
  groupsMap,
}: ProgramStatusDayCardProps) {
  const dayExercises = day.exercises || [];
  const isRestDay = dayExercises.length === 0;

  const dayDate = getDayDate(startDate, weekIndex, dayIndex);
  const dayName = getDayOfWeek(dayIndex + 1);
  const dayCompletion = calculateDayCompletion(completionDay);

  if (isRestDay) {
    return (
      <div className="p-3 bg-gray-100/50 rounded-lg border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-[#94A3B8]">
              {dayName}
            </span>
            <span className="text-xs text-[#94A3B8]">
              {formatDayDate(dayDate)}
            </span>
          </div>
          <span className="text-xs font-medium text-[#94A3B8] italic">
            Rest
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 bg-gray-50 rounded-lg space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-[#1E3A5F]">
            {dayName}
          </span>
          <span className="text-xs text-[#64748B]">
            {formatDayDate(dayDate)}
          </span>
        </div>
        <span className="text-xs font-semibold text-[#64748B]">
          {dayCompletion}%
        </span>
      </div>
      <Progress
        value={dayCompletion}
        className="h-1.5"
        indicatorColor={getProgressColor(dayCompletion)}
      />
      <div className="space-y-1 pt-1">
        <span className="text-xs font-medium text-[#64748B]">Exercises:</span>
        <ul className="list-disc list-inside space-y-0.5 text-xs text-[#64748B]">
          {dayExercises.map((exercise, exerciseIndex) => {
            if (exercise.type === 'exercise_template') {
              const exerciseName =
                exerciseNamesMap.get(exercise.id) || exercise.id;
              return <li key={exerciseIndex}>{exerciseName}</li>;
            } else {
              // Group: get exercise names from group's exercise_template_ids
              const group = groupsMap.get(exercise.id);
              const exerciseTemplateIds = group?.exercise_template_ids || [];
              const exerciseNames = exerciseTemplateIds
                .map((id) => exerciseNamesMap.get(id))
                .filter((name): name is string => Boolean(name));
              if (exerciseNames.length > 0) {
                return <li key={exerciseIndex}>{exerciseNames.join(', ')}</li>;
              }
              return <li key={exerciseIndex}>Group: {exercise.id}</li>;
            }
          })}
        </ul>
      </div>
    </div>
  );
}
