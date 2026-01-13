'use client';

import { useState } from 'react';
import { WeekNavigation } from './week-navigation';
import { DayBoxesGrid } from './day-boxes-grid';
import { Button } from '@/components/ui/button';
import { useBuilder } from '@/context/builder-context';
import {
  upsertWorkoutSchedule,
  updateProgramSchedule,
  upsertGroup,
} from '@/app/(authenticated)/builder/actions';
import { convertSelectedItemsToDatabaseSchedule } from './utils';
import toast from 'react-hot-toast';

interface BuildWorkoutSectionProps {
  initialWeeks: number;
}

export function BuildWorkoutSection({
  initialWeeks,
}: BuildWorkoutSectionProps) {
  const { schedule, programAssignmentId } = useBuilder();
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!programAssignmentId) {
      toast.error('No program assignment found');
      return;
    }

    // Check if schedule has any content
    const hasContent = schedule.some((week) =>
      week.some((day) => day.length > 0),
    );

    if (!hasContent) {
      toast.error('Cannot save empty schedule');
      return;
    }

    setIsSaving(true);

    try {
      // Create updated schedule array
      const updatedSchedule = [...schedule];
      if (updatedSchedule.length === 0) {
        updatedSchedule.push(Array.from({ length: 7 }, () => []));
      }
      // Ensure each week has all 7 days
      for (let w = 0; w < updatedSchedule.length; w++) {
        while (updatedSchedule[w].length < 7) {
          updatedSchedule[w].push([]);
        }
      }

      // Convert to database format (upserts groups without IDs)
      const conversionResult = await convertSelectedItemsToDatabaseSchedule(
        updatedSchedule,
        upsertGroup,
      );

      if (!conversionResult.success) {
        console.error('Error converting schedule:', conversionResult.error);
        toast.error(conversionResult.error || 'Failed to convert schedule');
        setIsSaving(false);
        return;
      }

      // Save to database as final (not draft)
      const result = await upsertWorkoutSchedule(conversionResult.data, false);

      if (!result.success) {
        console.error('Error saving workout schedule:', result.error);
        toast.error(result.error || 'Failed to save workout schedule');
        setIsSaving(false);
        return;
      }

      // Always update program assignment workout_schedule_id
      const updateResult = await updateProgramSchedule(
        programAssignmentId,
        result.data.id,
      );

      if (!updateResult.success) {
        console.error('Error updating program assignment:', updateResult.error);
        toast.error(
          updateResult.error || 'Failed to update program assignment',
        );
        setIsSaving(false);
        return;
      }

      toast.success('Workout schedule saved successfully');
    } catch (error) {
      console.error('Error saving workout schedule:', error);
      toast.error('An unexpected error occurred');
    } finally {
      setIsSaving(false);
    }
  };

  const isDisabled = !programAssignmentId || isSaving;

  return (
    <div className="w-full">
      <div className="w-full flex items-center justify-between p-4 rounded-t-lg">
        <span className="text-lg font-semibold text-[#1E3A5F]">
          Build Workout
        </span>
        <Button
          onClick={handleSave}
          disabled={isDisabled}
          variant="default"
          size="sm"
          className="bg-[#2454FF] hover:bg-[#1E3FCC] cursor-pointer"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
      <div className="p-4 border-t border-gray-200">
        <div className="space-y-6">
          <WeekNavigation initialWeeks={initialWeeks} />
          <DayBoxesGrid />
        </div>
      </div>
    </div>
  );
}
