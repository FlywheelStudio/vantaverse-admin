'use client';

import { useState, useMemo, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ExerciseBuilderModal } from './exercise-builder-modal';
import type { SelectedItem } from '@/app/(authenticated)/builder/template-config/types';
import { useBuilder } from '@/context/builder-context';
import { CopyPasteButtons } from '@/components/ui/copy-paste-buttons';
import {
  upsertWorkoutSchedule,
  updateProgramSchedule,
  upsertGroup,
} from '@/app/(authenticated)/builder/actions';
import { convertSelectedItemsToDatabaseSchedule } from './utils';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { getDayOfWeek } from '@/lib/utils';
import { cn } from '@/lib/utils';

export function DayBoxesGrid() {
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [pendingItems, setPendingItems] = useState<SelectedItem[]>([]);

  const {
    currentWeek,
    programAssignmentId,
    programStartDate,
    resetProgramAssignmentId,
    setScheduleItem,
    getDayItems,
    schedule,
    copiedDayIndex,
    copiedDayData,
    copyDay,
    pasteDay,
  } = useBuilder();

  const previousWeekDayRef = useRef<{ week: number; day: number } | null>(null);

  // Parse date string to local date (avoiding timezone issues)
  const parseLocalDate = useCallback((dateString: string): Date => {
    // Parse YYYY-MM-DD format to local date
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }, []);

  // Days always show Monday-Sunday (1-7)
  const days = Array.from({ length: 7 }, (_, i) => i + 1);

  // Get the Monday of the week containing the start date
  const getWeekStartMonday = useCallback((): Date | null => {
    if (!programStartDate) return null;
    const start = parseLocalDate(programStartDate);
    // getDay() returns 0=Sunday, 1=Monday, ..., 6=Saturday
    // Convert to 0=Monday, 1=Tuesday, ..., 6=Sunday
    const dayOfWeek = start.getDay();
    const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(start);
    monday.setDate(monday.getDate() - mondayOffset);
    return monday;
  }, [programStartDate, parseLocalDate]);

  // Calculate the actual date for a specific week and day (Monday=0, Tuesday=1, ..., Sunday=6)
  const calculateDayDate = useCallback(
    (weekIndex: number, dayOfWeek: number): Date | null => {
      // dayOfWeek: 1=Monday, 2=Tuesday, ..., 7=Sunday
      // Convert to 0=Monday, 1=Tuesday, ..., 6=Sunday
      const dayIndex = dayOfWeek - 1;
      const weekStartMonday = getWeekStartMonday();
      if (!weekStartMonday) return null;
      const dayDate = new Date(weekStartMonday);
      dayDate.setDate(dayDate.getDate() + weekIndex * 7 + dayIndex);
      return dayDate;
    },
    [getWeekStartMonday],
  );

  // Check if a day is before start_date
  const isDayBeforeStart = useCallback(
    (weekIndex: number, dayOfWeek: number): boolean => {
      if (!programStartDate) return false;

      const start = parseLocalDate(programStartDate);
      start.setHours(0, 0, 0, 0);

      const dayDate = calculateDayDate(weekIndex, dayOfWeek);
      if (!dayDate) return false;
      dayDate.setHours(0, 0, 0, 0);

      return dayDate.getTime() < start.getTime();
    },
    [programStartDate, parseLocalDate, calculateDayDate],
  );

  // Calculate date for currently selected day
  const selectedDayDate = useMemo(() => {
    if (selectedDay === null) return null;
    return calculateDayDate(currentWeek, selectedDay);
  }, [currentWeek, selectedDay, calculateDayDate]);

  const handleAddExercise = (day: number) => {
    // day is 1-7 (Monday-Sunday), convert to 0-6 for storage
    const dayIndex = day - 1;

    // Check if weekday changed (different week or day) and reset program assignment ID
    const previous = previousWeekDayRef.current;
    if (
      previous !== null &&
      (previous.week !== currentWeek || previous.day !== dayIndex)
    ) {
      resetProgramAssignmentId();
    }

    setSelectedDay(day);
    previousWeekDayRef.current = { week: currentWeek, day: dayIndex };
    // Load existing items for this day
    setPendingItems(getDayItems(currentWeek, dayIndex));
    setModalOpen(true);
  };

  const saveDraft = async (
    items: SelectedItem[],
    week: number,
    day: number,
  ) => {
    if (!programAssignmentId) {
      toast.error('No program assignment found');
      return;
    }

    try {
      // Update schedule in context first
      setScheduleItem(week, day, items);

      // Create updated schedule array
      const updatedSchedule = [...schedule];
      if (updatedSchedule.length === 0) {
        updatedSchedule.push(Array.from({ length: 7 }, () => []));
      }
      while (updatedSchedule.length <= week) {
        updatedSchedule.push(Array.from({ length: 7 }, () => []));
      }
      // Ensure each week has all 7 days
      for (let w = 0; w < updatedSchedule.length; w++) {
        while (updatedSchedule[w].length < 7) {
          updatedSchedule[w].push([]);
        }
      }
      updatedSchedule[week] = [...updatedSchedule[week]];
      updatedSchedule[week][day] = items;

      // Convert to database format (upserts groups without IDs)
      const conversionResult = await convertSelectedItemsToDatabaseSchedule(
        updatedSchedule,
        upsertGroup,
      );

      if (!conversionResult.success) {
        console.error('Error converting schedule:', conversionResult.error);
        toast.error(conversionResult.error || 'Failed to convert schedule');
        return;
      }

      // Update context with IDs (from the updated schedule returned by conversion)
      for (let w = 0; w < conversionResult.updatedSchedule.length; w++) {
        const week = conversionResult.updatedSchedule[w];
        if (!week) continue;
        for (let d = 0; d < week.length; d++) {
          const day = week[d];
          if (day && day.length > 0) {
            setScheduleItem(w, d, day);
          }
        }
      }

      // Save to database
      const result = await upsertWorkoutSchedule(conversionResult.data);

      if (!result.success) {
        console.error('Error saving workout schedule:', result.error);
        toast.error(result.error || 'Failed to save draft');
        return;
      }

      // Update program assignment workout_schedule_id
      const updateResult = await updateProgramSchedule(
        programAssignmentId,
        result.data.id,
      );

      if (!updateResult.success) {
        console.error('Error updating program assignment:', updateResult.error);
        toast.error(
          updateResult.error || 'Failed to update program assignment',
        );
      }
    } catch (error) {
      console.error('Error saving draft:', error);
      toast.error('An unexpected error occurred');
    }
  };

  const handleModalDone = async (selectedItems: SelectedItem[]) => {
    if (selectedDay === null) return;

    const dayIndex = selectedDay - 1;
    const previousItems = getDayItems(currentWeek, dayIndex);
    const hasChanges =
      selectedItems.length > 0 ||
      JSON.stringify(previousItems) !== JSON.stringify(selectedItems);

    if (hasChanges) {
      await saveDraft(selectedItems, currentWeek, dayIndex);
    }

    setModalOpen(false);
    setSelectedDay(null);
    previousWeekDayRef.current = null;
    setPendingItems([]);
  };

  const handleItemsChange = (items: SelectedItem[]) => {
    setPendingItems(items);
  };

  const handleModalClose = async (open: boolean) => {
    if (!open && selectedDay !== null) {
      // Modal is closing, check if there are pending items
      const dayIndex = selectedDay - 1;
      if (pendingItems.length > 0) {
        const previousItems = getDayItems(currentWeek, dayIndex);
        const hasChanges =
          pendingItems.length > 0 ||
          JSON.stringify(previousItems) !== JSON.stringify(pendingItems);

        if (hasChanges) {
          await saveDraft(pendingItems, currentWeek, dayIndex);
        }
      }
      setSelectedDay(null);
      previousWeekDayRef.current = null;
      setPendingItems([]);
    }
    setModalOpen(open);
  };

  const dayItems = useMemo(
    () => (day: number) => {
      // day is 1-7 (Monday-Sunday), convert to 0-6 for storage
      const dayIndex = day - 1;
      return getDayItems(currentWeek, dayIndex);
    },
    [currentWeek, getDayItems],
  );

  return (
    <>
      <div className="mt-6 overflow-x-auto slim-scrollbar">
        <div className="flex gap-4">
          {days.map((day, index) => {
            // day is 1-7 (Monday-Sunday), convert to 0-6 for storage
            const dayIndex = day - 1;
            const items = dayItems(day);
            const hasItems = items.length > 0;
            const templateCount = items.filter(
              (item) => item.type === 'template',
            ).length;
            const exerciseCount = items.filter(
              (item) => item.type === 'exercise',
            ).length;
            const totalExerciseCount = templateCount + exerciseCount;
            const groupCount = items.filter(
              (item) => item.type === 'group',
            ).length;
            const dayDate = calculateDayDate(currentWeek, day);
            const formattedDate = dayDate
              ? dayDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : null;

            const isBeforeStart = isDayBeforeStart(currentWeek, day);
            const isDayCopied =
              copiedDayIndex?.week === currentWeek &&
              copiedDayIndex?.day === dayIndex;
            const isDayPasteDisabled =
              !copiedDayData ||
              (copiedDayIndex?.week === currentWeek &&
                copiedDayIndex?.day === dayIndex);

            return (
              <div key={day} className="flex flex-col flex-1 min-w-[160px]">
                <div className="relative mb-1">
                  <h3
                    className={cn(
                      'text-base font-semibold text-center',
                      isBeforeStart ? 'text-red-500' : 'text-[#1E3A5F]',
                    )}
                  >
                    {getDayOfWeek(day)}
                  </h3>
                </div>
                {formattedDate && (
                  <p
                    className={cn(
                      'text-xs mb-3 text-center',
                      isBeforeStart ? 'text-red-400' : 'text-gray-500',
                    )}
                  >
                    {formattedDate} {isBeforeStart ? ' (Before Start)' : ''}
                  </p>
                )}
                <div
                  className={cn(
                    'relative border-2 border-dashed rounded-lg p-6 min-h-[200px] flex flex-col items-center justify-center gap-4',
                    isBeforeStart
                      ? 'border-red-400 bg-red-50/50'
                      : 'border-gray-300 bg-gray-50/50',
                  )}
                >
                  {hasItems ? (
                    <>
                      <div className="absolute top-2 right-2">
                        {!isBeforeStart && (<CopyPasteButtons
                          size="sm"
                          onCopy={() => copyDay(currentWeek, dayIndex)}
                          onPaste={() => pasteDay(currentWeek, dayIndex)}
                          isCopied={isDayCopied}
                          isPasteDisabled={isDayPasteDisabled || isBeforeStart}
                          copyTooltip="Copy Day"
                          pasteTooltip="Paste Day"
                          copiedTooltip="Day already copied"
                        />)}
                      </div>
                      <motion.div
                        key={`week-${currentWeek}-day-${day}-items`}
                        className="w-full h-full flex flex-col items-center justify-center gap-1"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3, delay: 0.1 * index }}
                      >
                        {totalExerciseCount > 0 && (
                          <motion.p
                            key={`week-${currentWeek}-day-${day}-exercises`}
                            className={cn(
                              'cursor-default text-sm',
                              isBeforeStart ? 'text-red-400' : 'text-gray-600',
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
                            key={`week-${currentWeek}-day-${day}-groups`}
                            className={cn(
                              'cursor-default text-sm',
                              isBeforeStart ? 'text-red-400' : 'text-gray-600',
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
                      <div className="absolute top-2 right-2">
                        {!isBeforeStart && (<CopyPasteButtons
                          size="sm"
                          onCopy={() => copyDay(currentWeek, dayIndex)}
                          onPaste={() => pasteDay(currentWeek, dayIndex)}
                          isCopied={isDayCopied}
                          isPasteDisabled={isDayPasteDisabled || isBeforeStart}
                          copyTooltip="Copy Day"
                          pasteTooltip="Paste Day"
                          copiedTooltip="Day already copied"
                          showCopy={false}
                          showPaste={true}
                        />)}
                      </div>
                      <motion.p
                        key={`week-${currentWeek}-day-${day}-rest`}
                        className={cn(
                          'h-full flex flex-col items-center justify-center text-sm cursor-default',
                          isBeforeStart ? 'text-red-400' : 'text-gray-400',
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
                    disabled={isBeforeStart}
                    className={cn(
                      'border-dashed',
                      isBeforeStart
                        ? 'border-red-400 text-red-500 cursor-not-allowed bg-red-50/30'
                        : 'border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer',
                    )}
                    onClick={() => handleAddExercise(day)}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {hasItems ? 'Edit' : 'Add Exercise'}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <ExerciseBuilderModal
        key={`modal-${currentWeek}-${selectedDay}`}
        open={modalOpen}
        onOpenChange={handleModalClose}
        onDone={handleModalDone}
        initialItems={pendingItems}
        onItemsChange={handleItemsChange}
        weekIndex={selectedDay !== null ? currentWeek : undefined}
        dayIndex={selectedDay !== null ? selectedDay - 1 : undefined}
        date={selectedDayDate}
      />
    </>
  );
}
