'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgramStatusDayCard } from './program-status-day-card';
import type { CompletionDay } from './program-status-card-utils';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/workout-schedule/utils';

interface ProgramStatusWeekCardProps {
  week: DatabaseSchedule[number];
  weekIndex: number;
  startDate: string;
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

  if (!hasExercises) {
    return null;
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
      >
        <span className="text-sm font-semibold text-[#1E3A5F]">
          Week {weekIndex + 1}
        </span>
        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          {isExpanded ? (
            <ChevronUp className="h-4 w-4 text-[#64748B]" />
          ) : (
            <ChevronDown className="h-4 w-4 text-[#64748B]" />
          )}
        </motion.div>
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="p-4 space-y-3 border-t border-gray-200">
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
    </div>
  );
}
