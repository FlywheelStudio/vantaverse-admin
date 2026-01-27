'use client';

import { ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProgramStatusDayCard } from './day-card';
import type { CompletionDay } from './card-utils';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';

// okLCH blueish color palette (matching habit-pledge-card)
const primaryBlue = 'oklch(0.55 0.2 250)';
const lightBlue = 'oklch(0.95 0.05 250)';

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
    <div 
      className="border rounded-lg overflow-hidden"
      style={{ 
        borderColor: primaryBlue,
        background: `linear-gradient(135deg, ${lightBlue} 0%, white 80%)`
      }}
    >
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
              style={{
                background: `linear-gradient(135deg, ${lightBlue} 0%, white 100%)`
              }}
            >
              <div className="relative p-4 pl-10 border-t" style={{ borderColor: primaryBlue }}>
                {/* Timeline line */}
                <div 
                  className="absolute left-5 top-0 bottom-0 w-0.5"
                  style={{ backgroundColor: primaryBlue }}
                />
                
                {/* Timeline items */}
                <div className="space-y-3">
                  {week.map((day, dayIndex) => {
                    const completionDay =
                      parsedCompletion[weekIndex]?.[dayIndex] || null;
                    return (
                      <div key={dayIndex} className="relative">
                        {/* Timeline dot - centered on the main timeline line */}
                        <div 
                          className="absolute w-3 h-3 rounded-full border-2 z-10"
                          style={{ 
                            left: '-25px',
                            top: '20px',
                            backgroundColor: 'white',
                            borderColor: primaryBlue
                          }}
                        />
                        <ProgramStatusDayCard
                          day={day}
                          dayIndex={dayIndex}
                          weekIndex={weekIndex}
                          startDate={startDate}
                          completionDay={completionDay}
                          exerciseNamesMap={exerciseNamesMap}
                          groupsMap={groupsMap}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}
    </div>
  );
}
