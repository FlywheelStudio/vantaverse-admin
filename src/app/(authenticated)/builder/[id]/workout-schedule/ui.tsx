'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { WeekNavigation } from './week-navigation';
import { DayBoxesGrid } from './day-boxes-grid';
import { Icon, Tooltip } from '@/components/medvanta';
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
import { useDefaultValues } from '../default-values/use-default-values';
import { UpdateDerivedDialog } from './update-derived-dialog';
import { updateDerivedProgramSchedules, updateDerivedPreProgramSchedules } from '../../actions';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';
import { useQueryClient } from '@tanstack/react-query';
import { programAssignmentsKeys } from '@/hooks/use-passignments';
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
    clearWeek,
    duplicateWeekToAll,
    duplicateWeekToEveryOther,
    resizeSchedule,
    programStartDate,
  } = useBuilder();
  const programForm = useFormContext<ProgramTemplateFormData>();
  const { values: defaultValues } = useDefaultValues();
  const [showDerivedDialog, setShowDerivedDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState<
    'duplicate' | 'apply_all' | 'clear' | null
  >(null);
  const queryClient = useQueryClient();
  const scheduleBaselineRef = useRef<string | null>(null);

  const weeksValue = programForm.watch('weeks') ?? initialWeeks;
  const comingSoonWeeksValue = programForm.watch('coming_soon_weeks') ?? 0;
  const programEndDate = useMemo(() => {
    if (!programStartDate || weeksValue < 1) return null;
    const end = calculateEndDate(new Date(`${programStartDate}T00:00:00`), weeksValue);
    return end ? formatDateForDB(end) : null;
  }, [programStartDate, weeksValue]);

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
      const [, scheduleResult] = await Promise.all([
        (async (): Promise<ProgramTemplate> => {
          return updateProgramTemplateMutation.mutateAsync({
            templateId: template.id,
            name: isPreProgramTemplate ? template.name : values.name,
            weeks: values.weeks,
            coming_soon_weeks: values.coming_soon_weeks ?? 0,
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
        })(),
        (async (): Promise<{ id: string; schedule_hash: string }> => {
          return upsertScheduleMutation.mutateAsync({
            schedule,
            assignmentId: programAssignmentId,
            defaultValues,
          });
        })(),
      ]);

      try {
        await updateProgramScheduleMutation.mutateAsync({
          assignmentId: programAssignmentId,
          workoutScheduleId: scheduleResult.id,
        });
      } catch {
        // Assignment link is best-effort; template and schedule already saved.
      }

      if (isPreProgramTemplate) {
        const derivedResult = await updateDerivedPreProgramSchedules(
          programAssignmentId,
          scheduleResult.id,
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
      } else if (isRegularTemplate && updateDerived) {
        const derivedResult = await updateDerivedProgramSchedules(
          programAssignmentId,
          scheduleResult.id,
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


  const handleDecreaseWeeks = (): void => {
    const next = Math.max(1, Number(weeksValue) - 1);
    programForm.setValue('weeks', next, { shouldDirty: true, shouldValidate: true });
    const comingSoon = Number(programForm.getValues('coming_soon_weeks') ?? 0);
    if (comingSoon > next) {
      programForm.setValue('coming_soon_weeks', next, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    resizeSchedule(next);
  };

  const handleIncreaseWeeks = (): void => {
    const next = Math.min(52, Number(weeksValue) + 1);
    programForm.setValue('weeks', next, { shouldDirty: true, shouldValidate: true });
    resizeSchedule(next);
  };

  const handleDecreaseComingSoon = (): void => {
    const next = Math.max(0, Number(comingSoonWeeksValue) - 1);
    programForm.setValue('coming_soon_weeks', next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleIncreaseComingSoon = (): void => {
    const next = Math.min(Number(weeksValue), Number(comingSoonWeeksValue) + 1);
    programForm.setValue('coming_soon_weeks', next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const weekHasContent = (weekIndex: number): boolean =>
    (schedule[weekIndex] ?? []).some((day) => day.length > 0);

  const getEveryOtherTargetWeeks = (): number[] => {
    const targets: number[] = [];
    for (let target = currentWeek + 2; target < schedule.length; target += 2) {
      targets.push(target);
    }
    return targets;
  };

  const getAllOtherTargetWeeks = (): number[] =>
    schedule.map((_, index) => index).filter((index) => index !== currentWeek);

  const runDuplicate = (everyOther: boolean): void => {
    if (everyOther) {
      duplicateWeekToEveryOther(currentWeek, programEndDate);
    } else {
      duplicateWeekToAll(currentWeek, programEndDate);
    }
    const label = everyOther ? 'every other week' : 'all other weeks';
    toast.success(`Week ${currentWeek + 1} copied to ${label}`);
  };

  const handleMenuAction = (action: 'duplicate' | 'apply_all' | 'clear'): void => {
    const wouldOverwrite =
      action === 'duplicate'
        ? getEveryOtherTargetWeeks().some(weekHasContent)
        : action === 'apply_all'
          ? getAllOtherTargetWeeks().some(weekHasContent)
          : weekHasContent(currentWeek);
    if (wouldOverwrite) {
      setConfirmAction(action);
      return;
    }
    if (action === 'clear') {
      clearWeek(currentWeek);
      toast.success(`Week ${currentWeek + 1} cleared`);
    } else {
      runDuplicate(action === 'duplicate');
    }
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
            <label className="lbl row" style={{ gap: 6, alignItems: 'center' }}>
              Coming soon
              <Tooltip
                placement="top"
                className="max-w-xs whitespace-normal"
                label="Marks the last N weeks as Coming soon. Empty/rest days in those weeks show as coming soon in the app calendar so you can publish a partial program and finish the later weeks later. Workout days still work normally."
              >
                <button
                  type="button"
                  className="ib ib-ghost ib-sq ib-sm"
                  aria-label="About Coming soon"
                  style={{ width: 22, height: 22 }}
                >
                  <Icon name="CircleHelp" size={14} />
                </button>
              </Tooltip>
            </label>
            <div className="row" style={{ gap: 7 }}>
              <button
                type="button"
                className="ib ib-sec ib-sq ib-sm"
                aria-label="Decrease Coming soon"
                disabled={Number(comingSoonWeeksValue) <= 0}
                onClick={handleDecreaseComingSoon}
              >
                <Icon name="Minus" size={15} />
              </button>
              <span className="fld fld-sm" style={{ width: 66, placeContent: 'center' }}>
                <input
                  value={String(comingSoonWeeksValue)}
                  readOnly
                  className="mono"
                  style={{ textAlign: 'center', fontWeight: 600 }}
                />
              </span>
              <button
                type="button"
                className="ib ib-sec ib-sq ib-sm"
                aria-label="Increase Coming soon"
                disabled={Number(comingSoonWeeksValue) >= Number(weeksValue)}
                onClick={handleIncreaseComingSoon}
              >
                <Icon name="Plus" size={15} />
              </button>
              <span className="mut" style={{ fontSize: 'var(--text-sm)' }}>
                weeks
              </span>
            </div>
          </div>
          <span className="sp" style={{ alignSelf: 'flex-end', paddingBottom: 6 }}>
            <HtmlActionsMenu
              variant="button"
              label="Week actions"
              items={[
                {
                  id: 'duplicate',
                  label: 'Duplicate to every other week',
                  onSelect: () => handleMenuAction('duplicate'),
                },
                {
                  id: 'apply_all',
                  label: 'Apply to all weeks',
                  onSelect: () => handleMenuAction('apply_all'),
                },
                {
                  id: 'clear',
                  label: 'Clear week',
                  onSelect: () => handleMenuAction('clear'),
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

      {confirmAction ? (
        <HtmlModal
          open
          title="Overwrite existing weeks?"
          onClose={() => setConfirmAction(null)}
          width={460}
          footer={
            <>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => setConfirmAction(null)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-acc"
                onClick={() => {
                  if (confirmAction === 'clear') {
                    clearWeek(currentWeek);
                    toast.success(`Week ${currentWeek + 1} cleared`);
                  } else {
                    runDuplicate(confirmAction === 'duplicate');
                  }
                  setConfirmAction(null);
                }}
              >
                <Icon name="Check" size={17} />
                Overwrite
              </button>
            </>
          }
        >
          <div className="alert alert-i">
            <Icon name="TriangleAlert" size={18} />
            <div>
              <div className="at">
                {confirmAction === 'clear'
                  ? `All exercises in Week ${currentWeek + 1} will be removed.`
                  : `Week ${currentWeek + 1} will replace the exercises in Week${confirmAction === 'duplicate' ? 's' : ''} ${(confirmAction === 'duplicate' ? getEveryOtherTargetWeeks() : getAllOtherTargetWeeks())
                    .map((week) => week + 1)
                    .join(', ')}.`}
              </div>
              This cannot be undone until you save.
            </div>
          </div>
        </HtmlModal>
      ) : null}
    </>
  );
}
