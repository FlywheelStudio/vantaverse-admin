'use client';

import { WeekNavigation } from './week-navigation';
import { DayBoxesGrid } from './day-boxes-grid';
import { Button } from '@/components/ui/button';
import { useBuilder } from '@/context/builder-context';
import {
  useUpsertWorkoutSchedule,
  useUpdateProgramSchedule,
} from '@/hooks/use-workout-schedule-mutations';
import toast from 'react-hot-toast';

interface BuildWorkoutSectionProps {
  initialWeeks: number;
}

export function BuildWorkoutSection({
  initialWeeks,
}: BuildWorkoutSectionProps) {
  const { schedule, programAssignmentId } = useBuilder();

  // Chain mutations: first upsert schedule, then update program assignment
  const updateProgramScheduleMutation = useUpdateProgramSchedule();

  const upsertScheduleMutation = useUpsertWorkoutSchedule({
    onSuccess: (data) => {
      console.log('Schedule saved', data);
      // After schedule is saved, update program assignment
      if (programAssignmentId) {
        updateProgramScheduleMutation.mutate({
          assignmentId: programAssignmentId,
          workoutScheduleId: data.id,
        });
      }
    },
  });

  const handleSave = () => {
    if (!programAssignmentId) {
      toast.error('No program assignment found');
      return;
    }

    console.log('Saving schedule', schedule);

    // Check if schedule has any content
    const hasContent = schedule.some((week) =>
      week.some((day) => day.length > 0),
    );

    if (!hasContent) {
      toast.error('Cannot save empty schedule');
      return;
    }

    // Trigger the mutation chain
    upsertScheduleMutation.mutate({
      schedule,
      assignmentId: programAssignmentId,
    });
  };

  const isSaving =
    upsertScheduleMutation.isPending || updateProgramScheduleMutation.isPending;
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
      <div className={`p-4 border-t border-gray-200 ${isDisabled ? 'disabled-div' : ''}`}>
        <div className="space-y-6">
          <WeekNavigation initialWeeks={initialWeeks} />
          <DayBoxesGrid />
        </div>
      </div>
    </div>
  );
}
