'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
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
import { cn, calculateEndDate, formatDateForDB } from '@/lib/utils';
import { createParallelQueries } from '@/lib/supabase/query';
import type { SupabaseSuccess, SupabaseError } from '@/lib/supabase/query';
import { useDefaultValues } from '../default-values/use-default-values';
import { UpdateDerivedDialog } from './update-derived-dialog';
import { updateDerivedProgramSchedules, updateDerivedPreProgramSchedules } from '../../actions';
import { useQueryClient } from '@tanstack/react-query';
import { programAssignmentsKeys } from '@/hooks/use-passignments';
import { ProgramAssignment } from '@/lib/supabase/schemas/program-assignments';
import { PROGRAM_ASSIGNMENT_STATUS } from '@/lib/constants/program-assignment-status';
import { estimateSessionMinutes } from './exercise-builder-mock-data';

const SESSION_OPTIONS = ['2 days', '3 days', '4 days', '5 days'] as const;

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
  onScheduleDirtyChange?: (dirty: boolean) => void;
  onSaved?: () => void;
}

export function BuildWorkoutSection({
  initialWeeks,
  template,
  assignmentStatus = 'template',
  saveTrigger = 0,
  onSaveStateChange,
  onStepActive,
  onScheduleDirtyChange,
  onSaved,
}: BuildWorkoutSectionProps) {
  const {
    schedule,
    programAssignmentId,
    currentWeek,
    copyWeek,
    pasteWeek,
    clearWeek,
    duplicateWeekToAll,
    copiedWeekData,
    resizeSchedule,
    programStartDate,
  } = useBuilder();
  const programForm = useFormContext<ProgramTemplateFormData>();
  const { values: defaultValues } = useDefaultValues();
  const [showDerivedDialog, setShowDerivedDialog] = useState(false);
  const queryClient = useQueryClient();
  const scheduleBaselineRef = useRef<string | null>(null);

  const weeksValue = programForm.watch('weeks') ?? initialWeeks;
  const programEndDate = useMemo(() => {
    if (!programStartDate || weeksValue < 1) return null;
    const end = calculateEndDate(new Date(`${programStartDate}T00:00:00`), weeksValue);
    return end ? formatDateForDB(end) : null;
  }, [programStartDate, weeksValue]);

  const [sessionsPerWeek, setSessionsPerWeek] = useState<string>(() => {
    const week = schedule[0] ?? [];
    const filled = week.filter((day) => day.length > 0).length;
    const clamped = Math.min(5, Math.max(2, filled || 3));
    return `${clamped} days`;
  });

  const updateProgramTemplateMutation = useUpdateProgramTemplate({
    suppressToast: true,
  });

  const updateProgramScheduleMutation = useUpdateProgramSchedule({
    suppressToast: true,
  });

  const upsertScheduleMutation = useUpsertWorkoutSchedule({
    suppressToast: true,
  });

  useEffect(() => {
    if (scheduleBaselineRef.current === null && schedule.length > 0) {
      scheduleBaselineRef.current = JSON.stringify(schedule);
      onScheduleDirtyChange?.(false);
      return;
    }
    if (scheduleBaselineRef.current === null) return;
    const dirty = JSON.stringify(schedule) !== scheduleBaselineRef.current;
    onScheduleDirtyChange?.(dirty);
  }, [schedule, onScheduleDirtyChange]);

  const handleSave = async (): Promise<void> => {
    if (!programAssignmentId) {
      toast.error('No program assignment found');
      return;
    }

    const isFormValid = await programForm.trigger();
    if (!isFormValid) {
      toast.error('Fix program details errors before saving');
      return;
    }

    const hasContent = schedule.some((week) =>
      week.some((day) => day.length > 0),
    );

    if (!hasContent) {
      toast.error('Cannot save empty schedule');
      return;
    }

    if (assignmentStatus === PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM_TEMPLATE) {
      await performSave(true);
      return;
    }

    if (assignmentStatus === PROGRAM_ASSIGNMENT_STATUS.TEMPLATE) {
      setShowDerivedDialog(true);
      return;
    }

    await performSave(false);
  };

  const performSave = async (updateDerived: boolean): Promise<void> => {
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

      scheduleBaselineRef.current = JSON.stringify(schedule);
      onScheduleDirtyChange?.(false);
      onSaved?.();
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
    const avgPerSession =
      workoutDays > 0 ? Math.round(exerciseCount / workoutDays) : 0;
    const minutesPerSession = estimateSessionMinutes(avgPerSession);
    return { workoutDays, exerciseCount, minutesPerSession };
  }, [schedule, currentWeek]);

  const handleDecreaseWeeks = (): void => {
    const next = Math.max(1, Number(weeksValue) - 1);
    programForm.setValue('weeks', next, { shouldDirty: true, shouldValidate: true });
    resizeSchedule(next);
  };

  const handleIncreaseWeeks = (): void => {
    const next = Math.min(52, Number(weeksValue) + 1);
    programForm.setValue('weeks', next, { shouldDirty: true, shouldValidate: true });
    resizeSchedule(next);
  };

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
              <button
                type="button"
                className="ib ib-sec ib-sq ib-sm"
                aria-label="Decrease"
                disabled={Number(weeksValue) <= 1}
                onClick={handleDecreaseWeeks}
              >
                <Icon name="Minus" size={15} />
              </button>
              <span className="fld fld-sm" style={{ width: 66, justifyContent: 'center' }}>
                <input
                  value={String(weeksValue)}
                  readOnly
                  className="mono"
                  style={{ textAlign: 'center', fontWeight: 600 }}
                />
              </span>
              <button
                type="button"
                className="ib ib-sec ib-sq ib-sm"
                aria-label="Increase"
                disabled={Number(weeksValue) >= 52}
                onClick={handleIncreaseWeeks}
              >
                <Icon name="Plus" size={15} />
              </button>
              <span className="mut" style={{ fontSize: 'var(--text-sm)' }}>
                weeks
              </span>
            </div>
          </div>
          <div>
            <label className="lbl">Sessions per week</label>
            <span className="sel" style={{ minWidth: 140 }}>
              <select
                value={sessionsPerWeek}
                aria-label="Sessions per week"
                onChange={(event) => {
                  const next = event.target.value;
                  setSessionsPerWeek(next);
                  onScheduleDirtyChange?.(true);
                }}
              >
                {SESSION_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
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
                {
                  id: 'copy',
                  label: 'Copy week',
                  onSelect: () => {
                    copyWeek(currentWeek);
                    toast.success(`Week ${currentWeek + 1} copied`);
                  },
                },
                {
                  id: 'paste',
                  label: 'Paste into week',
                  onSelect: () => {
                    if (!copiedWeekData) {
                      toast.error('Nothing to paste — copy a week first');
                      return;
                    }
                    pasteWeek(currentWeek);
                    toast.success(`Pasted into week ${currentWeek + 1}`);
                  },
                },
                {
                  id: 'duplicate',
                  label: 'Duplicate to all weeks',
                  onSelect: () => {
                    duplicateWeekToAll(currentWeek);
                    toast.success(`Week ${currentWeek + 1} duplicated to all weeks`);
                  },
                },
                {
                  id: 'clear',
                  label: 'Clear week',
                  onSelect: () => {
                    clearWeek(currentWeek);
                    toast.success(`Week ${currentWeek + 1} cleared`);
                  },
                },
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
              {weekStats.exerciseCount} exercise
              {weekStats.exerciseCount === 1 ? '' : 's'}
              {weekStats.workoutDays > 0
                ? ` · ~${weekStats.minutesPerSession} min per session`
                : ''}
              {` · target ${sessionsPerWeek}`}
            </span>
            <span className="sp mut row" style={{ gap: 6, fontSize: 'var(--text-xs)' }}>
              <Icon name="GripVertical" size={14} />
              Drag exercises between days, or click a day to edit it
            </span>
          </div>

          <DayBoxesGrid programEndDate={programEndDate} />
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
