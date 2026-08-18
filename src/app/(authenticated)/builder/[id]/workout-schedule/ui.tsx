'use client';

import { useState, useEffect, useMemo } from 'react';
import { WeekNavigation } from './week-navigation';
import { DayBoxesGrid } from './day-boxes-grid';
import { Icon } from '@/components/medvanta';
import { HtmlActionsMenu } from '@/components/medvanta/shell/HtmlActionsMenu';
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
import { UpdateDerivedDialog } from './update-derived-dialog';
import { updateDerivedProgramSchedules, updateDerivedPreProgramSchedules } from '../../actions';
import { useQueryClient } from '@tanstack/react-query';
import { programAssignmentsKeys } from '@/hooks/use-passignments';
import { ProgramAssignment } from '@/lib/supabase/schemas/program-assignments';
import { PROGRAM_ASSIGNMENT_STATUS } from '@/lib/constants/program-assignment-status';

type BuilderAssignmentStatus =
  | typeof PROGRAM_ASSIGNMENT_STATUS.ACTIVE
  | typeof PROGRAM_ASSIGNMENT_STATUS.TEMPLATE
  | typeof PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM_TEMPLATE;

interface BuildWorkoutSectionProps {
  initialWeeks: number;
  template: ProgramTemplate;
  assignmentStatus?: BuilderAssignmentStatus;
  saveTrigger?: number;
  onSaveStateChange?: (state: { disabled: boolean; loading: boolean }) => void;
  onStepActive?: () => void;
}

export function BuildWorkoutSection({
  initialWeeks,
  template,
  assignmentStatus = 'template',
  saveTrigger = 0,
  onSaveStateChange,
  onStepActive,
}: BuildWorkoutSectionProps) {
  const { schedule, programAssignmentId, currentWeek } = useBuilder();
  const programForm = useFormContext<ProgramTemplateFormData>();
  const { values: defaultValues } = useDefaultValues();
  const [showDerivedDialog, setShowDerivedDialog] = useState(false);
  const queryClient = useQueryClient();

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

    // Pre-program template: always propagate, no confirmation dialog
    if (assignmentStatus === PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM_TEMPLATE) {
      await performSave(true);
      return;
    }

    // If editing a template, show confirmation dialog
    if (assignmentStatus === PROGRAM_ASSIGNMENT_STATUS.TEMPLATE) {
      setShowDerivedDialog(true);
      return;
    }

    // If editing active assignment, proceed directly
    await performSave(false);
  };

  const performSave = async (updateDerived: boolean) => {
    if (!programAssignmentId) return;

    const values = programForm.getValues();
    const isPreProgramTemplate =
      assignmentStatus === PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM_TEMPLATE;
    const isRegularTemplate =
      assignmentStatus === PROGRAM_ASSIGNMENT_STATUS.TEMPLATE;

    const oldImageUrl =
      typeof template.image_url === 'string'
        ? template.image_url
        : typeof template.image_url === 'object' &&
            template.image_url !== null &&
            'image_url' in template.image_url
          ? String((template.image_url as unknown as { image_url: string }).image_url)
          : null;

    try {
      const result = await createParallelQueries({
        template: {
          query: async (): Promise<SupabaseSuccess<ProgramTemplate> | SupabaseError> => {
            try {
              const result = await updateProgramTemplateMutation.mutateAsync({
                templateId: template.id,
                name: isPreProgramTemplate ? template.name : values.name,
                weeks: values.weeks,
                startDate: isRegularTemplate || isPreProgramTemplate
                  ? undefined
                  : values.startDate,
                endDate: isRegularTemplate || isPreProgramTemplate
                  ? undefined
                  : values.endDate,
                description: isPreProgramTemplate
                  ? template.description ?? null
                  : values.description?.trim() || null,
                goals: isPreProgramTemplate
                  ? template.goals ?? null
                  : values.goals?.trim() || null,
                notes: isPreProgramTemplate
                  ? template.notes ?? null
                  : values.notes?.trim() || null,
                imageFile: isPreProgramTemplate ? null : values.imageFile || null,
                imagePreview: isPreProgramTemplate ? null : values.imagePreview || null,
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
        assignment: {
          query: async (
            deps: {
              template: ProgramTemplate;
              schedule: { id: string; schedule_hash: string };
            },
          ): Promise<SupabaseSuccess<ProgramAssignment> | SupabaseError> => {
            try {
              await updateProgramScheduleMutation.mutateAsync({
                assignmentId: programAssignmentId,
                workoutScheduleId: deps.schedule.id,
              });
              return { success: true, data: { id: programAssignmentId } as ProgramAssignment };
            } catch (error) {
              return {
                success: false,
                error: error instanceof Error ? error.message : 'Failed to update assignment',
                status: 500,
              };
            }
          },
          dependsOn: ['template', 'schedule'] as const,
          required: false,
        },
      });

      if (isPreProgramTemplate && result.schedule) {
        const derivedResult = await updateDerivedPreProgramSchedules(
          programAssignmentId,
          result.schedule.id,
        );

        if (derivedResult.success) {
          const count = derivedResult.data;

          await queryClient.invalidateQueries({
            queryKey: programAssignmentsKeys.all,
          });

          if (count > 0) {
            toast.success(
              `Saved and updated ${count} pre-program user${count !== 1 ? 's' : ''}`,
            );
          } else {
            toast.success('Saved (no pre-program users to update)');
          }
        } else {
          toast.success('Template saved, but failed to update pre-program users');
        }
      } else if (isRegularTemplate && updateDerived && result.schedule) {
        const derivedResult = await updateDerivedProgramSchedules(
          programAssignmentId,
          result.schedule.id,
        );

        if (derivedResult.success) {
          const count = derivedResult.data;
          
          // Invalidate all program assignment queries to refresh UI
          await queryClient.invalidateQueries({
            queryKey: programAssignmentsKeys.all,
          });

          if (count > 0) {
            toast.success(`Saved and updated ${count} active program${count !== 1 ? 's' : ''}`);
          } else {
            toast.success('Saved (no active programs to update)');
          }
        } else {
          toast.success('Template saved, but failed to update active programs');
        }
      } else {
        toast.success('Saved');
      }

      setShowDerivedDialog(false);
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Save failed';
      toast.error(message);
      setShowDerivedDialog(false);
    }
  };

  const isSaving =
    upsertScheduleMutation.isPending ||
    updateProgramScheduleMutation.isPending ||
    updateProgramTemplateMutation.isPending;
  const isDisabled = !programAssignmentId || isSaving;

  useEffect(() => {
    onSaveStateChange?.({ disabled: isDisabled, loading: isSaving });
  }, [isDisabled, isSaving, onSaveStateChange]);

  useEffect(() => {
    if (saveTrigger > 0) {
      void handleSave();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- saveTrigger is external pulse
  }, [saveTrigger]);

  useEffect(() => {
    onStepActive?.();
  }, [onStepActive]);

  const weekStats = useMemo(() => {
    const week = schedule[currentWeek] ?? [];
    let workoutDays = 0;
    let exerciseCount = 0;
    week.forEach((day) => {
      if (day.length > 0) {
        workoutDays += 1;
        exerciseCount += day.length;
      }
    });
    return { workoutDays, exerciseCount };
  }, [schedule, currentWeek]);

  return (
    <>
      <div
        className="card"
        style={{ marginBottom: 16, padding: '16px 18px' }}
      >
        <div className="row" style={{ gap: 26, flexWrap: 'wrap' }}>
          <div>
            <label className="lbl">Duration</label>
            <div className="row" style={{ gap: 7 }}>
              <button type="button" className="ib ib-sec ib-sq ib-sm" disabled aria-label="Decrease">
                <Icon name="Minus" size={15} />
              </button>
              <span className="fld fld-sm" style={{ width: 66, justifyContent: 'center' }}>
                <input
                  value={String(programForm.watch('weeks') ?? initialWeeks)}
                  readOnly
                  className="mono"
                  style={{ textAlign: 'center', fontWeight: 600 }}
                />
              </span>
              <button type="button" className="ib ib-sec ib-sq ib-sm" disabled aria-label="Increase">
                <Icon name="Plus" size={15} />
              </button>
              <span className="mut" style={{ fontSize: 'var(--text-sm)' }}>
                weeks
              </span>
            </div>
          </div>
          <div>
            <label className="lbl">Sessions per week</label>
            <span className="sel">
              <select disabled defaultValue="3 days" aria-label="Sessions per week">
                <option>3 days</option>
              </select>
              <span className="ci">
                <Icon name="ChevronDown" size={16} />
              </span>
            </span>
          </div>
          <span className="sp" style={{ alignSelf: 'flex-end', paddingBottom: 6 }}>
            <HtmlActionsMenu
              variant="button"
              label="Week actions"
              items={[
                { id: 'copy', label: 'Copy week' },
                { id: 'paste', label: 'Paste into week' },
                { id: 'duplicate', label: 'Duplicate to all weeks' },
                { id: 'clear', label: 'Clear week' },
              ]}
            />
          </span>
        </div>
      </div>

      <div className={cn('card card-flush', isDisabled && 'disabled-div')}>
        <div style={{ padding: '16px 18px 6px' }}>
          <WeekNavigation initialWeeks={initialWeeks} />

          <div
            className="row"
            style={{
              gap: 16,
              padding: '11px 14px',
              background: 'var(--slate-50)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-sm)',
              marginBottom: 14,
              marginTop: 16,
              fontSize: 'var(--text-sm)',
            }}
          >
            <span
              className="row"
              style={{ gap: 7, fontWeight: 'var(--fw-bold)', color: 'var(--text-strong)' }}
            >
              <Icon name="CalendarDays" size={16} style={{ color: 'var(--navy-600)' }} />
              Week {currentWeek + 1}
            </span>
            <span className="mut">
              {weekStats.workoutDays} workout day{weekStats.workoutDays === 1 ? '' : 's'} ·{' '}
              {weekStats.exerciseCount} exercise{weekStats.exerciseCount === 1 ? '' : 's'}
            </span>
            <span className="sp mut row" style={{ gap: 6, fontSize: 'var(--text-xs)' }}>
              <Icon name="GripVertical" size={14} />
              Drag exercises between days, or click a day to edit it
            </span>
          </div>

          <DayBoxesGrid />
          <div style={{ height: 16 }} />
        </div>
      </div>

      <UpdateDerivedDialog
        open={showDerivedDialog}
        onOpenChange={setShowDerivedDialog}
        onConfirm={performSave}
        loading={isSaving}
      />
    </>
  );
}
