'use client';

import { WeekNavigation } from './week-navigation';
import { DayBoxesGrid } from './day-boxes-grid';
import { Button } from '@/components/ui/button';
import { useBuilder } from '@/context/builder-context';
import {
  useUpsertWorkoutSchedule,
  useUpdateProgramSchedule,
} from '@/hooks/use-workout-schedule-mutations';
import { useUpdateProgramTemplate } from '@/hooks/use-program-template-mutations';
import toast from 'react-hot-toast';
import { useFormContext } from 'react-hook-form';
import type { ProgramTemplate } from '@/lib/supabase/schemas/program-templates';
import type { ProgramTemplateFormData } from '../../program/schemas';
import { cn } from '@/lib/utils';
import { createParallelQueries } from '@/lib/supabase/query';
import type { SupabaseSuccess, SupabaseError } from '@/lib/supabase/query';
import { useDefaultValues } from '../default-values/use-default-values';

interface BuildWorkoutSectionProps {
  initialWeeks: number;
  template: ProgramTemplate;
}

export function BuildWorkoutSection({
  initialWeeks,
  template,
}: BuildWorkoutSectionProps) {
  const { schedule, programAssignmentId } = useBuilder();
  const programForm = useFormContext<ProgramTemplateFormData>();
  const { values: defaultValues } = useDefaultValues();

  const updateProgramTemplateMutation = useUpdateProgramTemplate({
    suppressToast: true,
  });

  const updateProgramScheduleMutation = useUpdateProgramSchedule({
    suppressToast: true,
  });

  const upsertScheduleMutation = useUpsertWorkoutSchedule({
    suppressToast: true,
  });

  const handleSave = async () => {
    if (!programAssignmentId) {
      toast.error('No program assignment found');
      return;
    }

    const isFormValid = await programForm.trigger();
    if (!isFormValid) {
      toast.error('Fix program details errors before saving');
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

    const values = programForm.getValues();

    const oldImageUrl =
      typeof template.image_url === 'string'
        ? template.image_url
        : typeof template.image_url === 'object' &&
            template.image_url !== null &&
            'image_url' in template.image_url
          ? String((template.image_url as unknown as { image_url: string }).image_url)
          : null;

    try {
      await createParallelQueries({
        template: {
          query: async (): Promise<SupabaseSuccess<ProgramTemplate> | SupabaseError> => {
            try {
              const result = await updateProgramTemplateMutation.mutateAsync({
                templateId: template.id,
                name: values.name,
                weeks: values.weeks,
                startDate: values.startDate,
                endDate: values.endDate,
                description: values.description?.trim() || null,
                goals: values.goals?.trim() || null,
                notes: values.notes?.trim() || null,
                imageFile: values.imageFile || null,
                imagePreview: values.imagePreview || null,
                oldImageUrl,
                organizationId: template.organization_id || null,
              });
              return { success: true, data: result };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update template',
                status: 500,
              };
            }
          },
          required: true,
        },
        schedule: {
          query: async (): Promise<
            SupabaseSuccess<{ id: string; schedule_hash: string }> | SupabaseError
          > => {
            try {
              const scheduleResult = await upsertScheduleMutation.mutateAsync({
                schedule,
                assignmentId: programAssignmentId,
                defaultValues,
              });
              await updateProgramScheduleMutation.mutateAsync({
                assignmentId: programAssignmentId,
                workoutScheduleId: scheduleResult.id,
              });
              return { success: true, data: scheduleResult };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to save schedule',
                status: 500,
              };
            }
          },
          required: true,
        },
      });
      toast.success('Saved');
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Save failed';
      toast.error(message);
    }
  };

  const isSaving =
    upsertScheduleMutation.isPending ||
    updateProgramScheduleMutation.isPending ||
    updateProgramTemplateMutation.isPending;
  const isDisabled = !programAssignmentId || isSaving;

  return (
    <div className="w-full">
      <div className="w-full flex items-center justify-between px-5 py-4">
        <span className="text-lg font-semibold text-foreground">Build Workout</span>
        <Button
          onClick={handleSave}
          disabled={isDisabled}
          size="sm"
          className="cursor-pointer"
        >
          {isSaving ? 'Saving...' : 'Save'}
        </Button>
      </div>
      <div
        className={cn(
          'px-5 pb-5 pt-4 border-t border-border',
          isDisabled && 'disabled-div',
        )}
      >
        <div className="space-y-6">
          <WeekNavigation initialWeeks={initialWeeks} />
          <DayBoxesGrid />
        </div>
      </div>
    </div>
  );
}
