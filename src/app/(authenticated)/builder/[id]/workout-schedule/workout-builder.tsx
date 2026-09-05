'use client';

import { useMemo, useEffect, useState, useCallback, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { useBuilder } from '@/context/builder-context';
import { BUILDER_WORKOUT_TAB } from '../../partials/html-utils';
import { ProgramDetailsSection } from '../../program/ui';
import { BuildWorkoutSection } from './ui';
import { FormProvider, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  programTemplateFormSchema,
  type ProgramTemplateFormData,
} from '../../program/schemas';
import { getNextProgramStartMonday, parseLocalDateString } from '@/lib/utils';
import {
  isPreProgramTemplateStatus,
  PROGRAM_ASSIGNMENT_STATUS,
} from '@/lib/constants/program-assignment-status';
import { PreProgramWarningBanner } from '../pre-program-warning-banner';
import { BuilderSaveBar } from '../../partials/html-save-bar';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

interface WorkoutBuilderProps {
  assignmentId: string | undefined;
  initialAssignment: ProgramAssignmentWithTemplate;
  programDetailsCollapsed?: boolean;
}

export function WorkoutBuilder({
  assignmentId,
  initialAssignment,
  programDetailsCollapsed = false,
}: WorkoutBuilderProps): React.ReactElement {
  const router = useRouter();
  const { initializeSchedule, setSelectedAssignmentId, schedule } = useBuilder();
  const locationHash = useSyncExternalStore(
    subscribeLocationHash,
    getLocationHash,
    getServerLocationHash,
  );
  const [userStep, setUserStep] = useState<1 | 2 | null>(null);
  const activeStep: 1 | 2 =
    userStep ??
    (locationHash === '#build-workout' || programDetailsCollapsed ? 2 : 1);
  const [saveTrigger, setSaveTrigger] = useState(0);
  const [saveState, setSaveState] = useState({ disabled: true, loading: false });
  const [scheduleDirty, setScheduleDirty] = useState(false);


  const template = initialAssignment.program_template;
  const isPreProgramTemplate = isPreProgramTemplateStatus(initialAssignment.status);

  const formDefaultValues = useMemo(
    () => ({
      name: template?.name || '',
      description: template?.description || '',
      weeks: template?.weeks || 4,
      coming_soon_weeks: template?.coming_soon_weeks ?? 0,
      goals: template?.goals || '',
      notes: template?.notes || '',
      startDate:
        initialAssignment.status === PROGRAM_ASSIGNMENT_STATUS.TEMPLATE ||
        isPreProgramTemplate
          ? undefined
          : initialAssignment.start_date
            ? parseLocalDateString(initialAssignment.start_date)
            : getNextProgramStartMonday(),
      endDate:
        initialAssignment.status === PROGRAM_ASSIGNMENT_STATUS.TEMPLATE ||
        isPreProgramTemplate
          ? undefined
          : initialAssignment.end_date
            ? parseLocalDateString(initialAssignment.end_date)
            : undefined,
      imageFile: undefined,
      imagePreview: undefined,
    }),
    [initialAssignment, template, isPreProgramTemplate],
  );

  const builderAssignmentStatus =
    initialAssignment.status === PROGRAM_ASSIGNMENT_STATUS.ACTIVE
      ? PROGRAM_ASSIGNMENT_STATUS.ACTIVE
      : initialAssignment.status === PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM_TEMPLATE
        ? PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM_TEMPLATE
        : PROGRAM_ASSIGNMENT_STATUS.TEMPLATE;

  useEffect(() => {
    if (assignmentId) {
      setSelectedAssignmentId(assignmentId);
    }

    if (initialAssignment.program_template && assignmentId && schedule.length === 0) {
      initializeSchedule(template?.weeks ?? 4);
    }
  }, [
    assignmentId,
    initialAssignment.program_template,
    template?.weeks,
    setSelectedAssignmentId,
    initializeSchedule,
    schedule.length,
  ]);

  const programForm = useForm<ProgramTemplateFormData>({
    resolver: zodResolver(programTemplateFormSchema),
    defaultValues: formDefaultValues,
  });

  // Rebase RHF defaults after child init effects load saved data (dates),
  // so formState.isDirty reflects real edits only.
  useEffect(() => {
    if (!initialAssignment || !template) return;
    programForm.reset(programForm.getValues());
  }, [initialAssignment, template, programForm]);

  const replaceBuilderStep = useCallback(
    (step: 1 | 2): void => {
      if (typeof window === 'undefined') return;
      const url = new URL(window.location.href);
      if (step === 2) url.searchParams.set('tab', BUILDER_WORKOUT_TAB);
      else url.searchParams.delete('tab');
      url.hash = '';
      router.replace(`${url.pathname}${url.search}`, { scroll: false });
    },
    [router],
  );

  // Legacy `#build-workout` links: hash is not on searchParams, so migrate after mount.
  useEffect(() => {
    if (locationHash !== '#build-workout') return;
    replaceBuilderStep(2);
  }, [locationHash, replaceBuilderStep]);

  const handleStepClick = useCallback(
    (step: 1 | 2): void => {
      setUserStep(step);
      replaceBuilderStep(step);
    },
    [replaceBuilderStep],
  );

  const handleScheduleDirtyChange = useCallback((dirty: boolean): void => {
    setScheduleDirty(dirty);
  }, []);

  const handleSaved = useCallback((): void => {
    programForm.reset(programForm.getValues());
    setScheduleDirty(false);
  }, [programForm]);

  // Save stays disabled until the Details form or Workout schedule changes.
  const hasChanges = programForm.formState.isDirty || scheduleDirty;

  if (!initialAssignment || !template) {
    return (
      <div className="body">
        <p style={{ color: 'var(--text-muted)' }}>Program not found</p>
      </div>
    );
  }

  return (
    <div className="body">
      <FormProvider {...programForm}>
        <BuilderSaveBar
          activeStep={activeStep}
          onStepClick={handleStepClick}
          reviewAssignHref={
            assignmentId ? `/builder/review-assign?id=${assignmentId}` : undefined
          }
          onSave={() => setSaveTrigger((value) => value + 1)}
          assignmentId={assignmentId}
          templateName={template?.name}
          saveDisabled={saveState.disabled || !hasChanges}
          saveLoading={saveState.loading}
          showUnsaved={programForm.formState.isDirty || scheduleDirty}
        />

        {isPreProgramTemplate ? <PreProgramWarningBanner /> : null}

        <div
          id="program-details"
          style={{ display: activeStep === 1 ? undefined : 'none' }}
        >
          <ProgramDetailsSection
            template={template}
            status={initialAssignment.status}
            hideActions
            formMethods={programForm}
            defaultOpen
          />
        </div>

        <div
          id="build-workout"
          style={{ display: activeStep === 2 ? undefined : 'none' }}
        >
          <BuildWorkoutSection
            initialWeeks={template.weeks}
            template={template}
            assignmentStatus={builderAssignmentStatus}
            saveTrigger={saveTrigger}
            onSaveStateChange={setSaveState}
            onScheduleDirtyChange={handleScheduleDirtyChange}
            onSaved={handleSaved}
          />
        </div>
      </FormProvider>
    </div>
  );
}

const subscribeLocationHash = (onStoreChange: () => void): (() => void) => {
  window.addEventListener('hashchange', onStoreChange);
  return (): void => {
    window.removeEventListener('hashchange', onStoreChange);
  };
};

const getLocationHash = (): string => window.location.hash;

const getServerLocationHash = (): string => '';
