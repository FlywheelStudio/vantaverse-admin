'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { CopyPasteButtons } from '@/components/ui/copy-paste-buttons';
import { motion } from 'framer-motion';
import { getDayOfWeek } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { SelectedItem } from '@/app/(authenticated)/builder/[id]/template-config/types';

interface DayBoxProps {
  day: number;
  weekIndex: number;
  items: SelectedItem[];
  formattedDate: string | null;
  isBeforeStart: boolean;
  isDayCopied: boolean;
  isDayPasteDisabled: boolean;
  isPasteAnimating?: boolean;
  index: number;
  onAddExercise: (day: number) => void;
  onCopyDay: () => void;
  onPasteDay: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export function DayBox({
  day,
  weekIndex,
  items,
  formattedDate,
  isBeforeStart,
  isDayCopied,
  isDayPasteDisabled,
  isPasteAnimating = false,
  index,
  onAddExercise,
  onCopyDay,
  onPasteDay,
  onMouseEnter,
  onMouseLeave,
}: DayBoxProps) {
  const hasItems = items.length > 0;
  const templateCount = items.filter(
    (item) => item.type === 'template',
  ).length;
  const exerciseCount = items.filter(
    (item) => item.type === 'exercise',
  ).length;
  const totalExerciseCount = templateCount + exerciseCount;
  const groupCount = items.filter((item) => item.type === 'group').length;

  const copyPasteButtons = (
    <CopyPasteButtons
      size="sm"
      onCopy={onCopyDay}
      onPaste={onPasteDay}
      isCopied={isDayCopied}
      isPasteDisabled={isDayPasteDisabled}
      pasteJustTriggered={isPasteAnimating}
      copyTooltip="Copy Day"
      pasteTooltip="Paste Day"
      copiedTooltip="Day already copied"
      showCopy={hasItems}
      showPaste={true}
    />
  );

  return (
    <div className="flex flex-col flex-1 min-w-[160px]">
      <div className="relative mb-1">
        <h3
          className={cn(
            'text-base font-semibold text-center',
            isBeforeStart ? 'text-destructive' : 'text-foreground',
          )}
        >
          {getDayOfWeek(day)}
        </h3>
      </div>
      {formattedDate && (
        <p
          className={cn(
            'text-xs mb-3 text-center',
            isBeforeStart ? 'text-destructive/70' : 'text-muted-foreground',
          )}
        >
          {formattedDate} {isBeforeStart ? ' (Before Start)' : ''}
        </p>
      )}
      <div
        className={cn(
          'group relative border-2 border-dashed rounded-[var(--radius-xl)] p-6 min-h-[200px] flex flex-col items-center justify-center gap-4',
          isBeforeStart
            ? 'border-destructive/40 bg-destructive/5'
            : 'border-border bg-muted/30',
        )}
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        <div className="absolute top-2 right-2 opacity-0 translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 ease-out">
          {copyPasteButtons}
        </div>
        {hasItems ? (
          <>
            <motion.div
              key={`week-${weekIndex}-day-${day}-items`}
              className="w-full h-full flex flex-col items-center justify-center gap-1"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              {totalExerciseCount > 0 && (
                <motion.p
                  key={`week-${weekIndex}-day-${day}-exercises`}
                  className={cn(
                    'cursor-default text-sm',
                    isBeforeStart ? 'text-destructive/70' : 'text-muted-foreground',
                  )}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                >
                  {totalExerciseCount} exercise
                  {totalExerciseCount !== 1 ? 's' : ''}
                </motion.p>
              )}
              {groupCount > 0 && (
                <motion.p
                  key={`week-${weekIndex}-day-${day}-groups`}
                  className={cn(
                    'cursor-default text-sm',
                    isBeforeStart ? 'text-destructive/70' : 'text-muted-foreground',
                  )}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{
                    duration: 0.3,
                    delay: 0.1 * index,
                  }}
                >
                  {groupCount} group{groupCount !== 1 ? 's' : ''}
                </motion.p>
              )}
            </motion.div>
          </>
        ) : (
          <>
            <motion.p
              key={`week-${weekIndex}-day-${day}-rest`}
              className={cn(
                'h-full flex flex-col items-center justify-center text-sm cursor-default',
                isBeforeStart ? 'text-destructive/70' : 'text-muted-foreground',
              )}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 * index }}
            >
              Rest Day
            </motion.p>
          </>
        )}
        <Button
          variant="outline"
          size="sm"
          className={cn(
            'border-dashed',
            isBeforeStart
              ? 'border-destructive/40 text-destructive cursor-not-allowed bg-destructive/5'
              : 'border-border text-muted-foreground hover:bg-muted/60 hover:text-foreground cursor-pointer',
          )}
          onClick={() => onAddExercise(day)}
        >
          <Plus className="h-4 w-4 mr-2" />
          {hasItems ? 'Edit' : 'Add Exercise'}
        </Button>
      </div>
    </div>
  );
}
