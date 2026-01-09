'use client';

import { useState, useMemo, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ExerciseBuilderModal } from './exercise-builder-modal';
import type { SelectedItem } from '@/app/(authenticated)/builder/template-config/types';
import { useBuilder } from '@/context/builder-context';
import {
  upsertWorkoutSchedule,
  updateProgramAssignmentWorkoutSchedule,
  upsertGroup,
} from '@/app/(authenticated)/builder/actions';
import { convertSelectedItemsToDatabaseSchedule } from './utils';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
import { getDayOfWeek } from '@/lib/utils';

export function DayBoxesGrid() {
  const days = Array.from({ length: 7 }, (_, i) => i + 1);
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
  } = useBuilder();

  const previousWeekDayRef = useRef<{ week: number; day: number } | null>(null);

  // Calculate the actual date for a specific week and day
  const calculateDayDate = (
    startDate: string | null,
    weekIndex: number,
    dayIndex: number,
  ): Date | null => {
    if (!startDate) return null;
    const start = new Date(startDate);
    const dayDate = new Date(start);
    dayDate.setDate(dayDate.getDate() + weekIndex * 7 + dayIndex);
    return dayDate;
  };

  // Calculate date for currently selected day
  const selectedDayDate = useMemo(() => {
    if (selectedDay === null) return null;
    return calculateDayDate(programStartDate, currentWeek, selectedDay - 1);
  }, [programStartDate, currentWeek, selectedDay]);

  const handleAddExercise = (day: number) => {
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
      // Ensure week 0 exists (database expects 1-indexed weeks, but arrays are 0-indexed)
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
      const result = await upsertWorkoutSchedule(conversionResult.data, true);

      if (!result.success) {
        console.error('Error saving workout schedule:', result.error);
        toast.error(result.error || 'Failed to save draft');
        return;
      }

      // Update program assignment if it doesn't have a workout_schedule_id
      // The function will check and only update if null
      const updateResult = await updateProgramAssignmentWorkoutSchedule(
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
    () => (day: number) => getDayItems(currentWeek, day - 1),
    [currentWeek, getDayItems],
  );

  return (
    <>
      <div className="mt-6 overflow-x-auto slim-scrollbar">
        <div className="flex gap-4">
          {days.map((day, index) => {
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
            const dayDate = calculateDayDate(
              programStartDate,
              currentWeek,
              day,
            );
            const formattedDate = dayDate
              ? dayDate.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : null;

            return (
              <div key={day} className="flex flex-col flex-1 min-w-[160px]">
                <h3 className="text-base font-semibold text-[#1E3A5F] mb-1 text-center">
                  {getDayOfWeek(day)}
                </h3>
                {formattedDate && (
                  <p className="text-xs text-gray-500 mb-3 text-center">
                    {formattedDate}
                  </p>
                )}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[200px] flex flex-col items-center justify-center gap-4 bg-gray-50/50">
                  {hasItems ? (
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
                          className="cursor-default text-sm text-gray-600"
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
                          className="cursor-default text-sm text-gray-600"
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
                  ) : (
                    <motion.p
                      key={`week-${currentWeek}-day-${day}-rest`}
                      className="h-full flex flex-col items-center justify-center text-gray-400 text-sm cursor-default"
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                    >
                      Rest Day
                    </motion.p>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-dashed border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"
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
