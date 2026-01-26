'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgramStatusDayCard } from './day-card';
import type { CompletionDay } from './card-utils';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';

interface ProgramStatusWeekCardProps {
  week: DatabaseSchedule[number];
  weekIndex: number;
  startDate: string | null;
  isExpanded: boolean;
  onToggle: () => void;
  parsedCompletion: Array<Array<CompletionDay>>;
  exerciseNamesMap: Map<string, string>;
  groupsMap: Map<string, { exercise_template_ids: string[] | null }>;
}

export function ProgramStatusWeekCard({
  week,
  weekIndex,
  startDate,
  isExpanded,
  onToggle,
  parsedCompletion,
  exerciseNamesMap,
  groupsMap,
}: ProgramStatusWeekCardProps) {
  const hasExercises = week.some(
    (day) => day.exercises && day.exercises.length > 0,
  );

  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      <button
        onClick={hasExercises ? onToggle : undefined}
        disabled={!hasExercises}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/40 transition-colors disabled:cursor-default disabled:hover:bg-transparent"
      >
        <span className="text-sm font-semibold text-foreground">
          Week {weekIndex + 1}
        </span>
        {hasExercises ? (
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </motion.div>
        ) : (
          <span className="text-xs font-medium text-muted-foreground italic">
            Rest
          </span>
        )}
      </button>

      {hasExercises && (
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
              className="overflow-hidden"
            >
              <div className="p-4 space-y-3 border-t border-border">
                {week.map((day, dayIndex) => {
                  const completionDay =
                    parsedCompletion[weekIndex]?.[dayIndex] || null;
                  return (
                    <ProgramStatusDayCard
                      key={dayIndex}
                      day={day}
                      dayIndex={dayIndex}
                      weekIndex={weekIndex}
                      startDate={startDate}
                      completionDay={completionDay}
                      exerciseNamesMap={exerciseNamesMap}
                      groupsMap={groupsMap}
                    />
                  );
                })}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
