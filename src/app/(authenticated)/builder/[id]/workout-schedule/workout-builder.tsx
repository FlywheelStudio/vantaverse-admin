'use client';

import { useMemo, useEffect, useState, useRef } from 'react';
import { useBuilder } from '@/context/builder-context';
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
  const { initializeSchedule, setSelectedAssignmentId, schedule } = useBuilder();
  const [activeStep, setActiveStep] = useState<1 | 2>(1);
  const [saveTrigger, setSaveTrigger] = useState(0);
  const [saveState, setSaveState] = useState({ disabled: true, loading: false });
  const workoutRef = useRef<HTMLDivElement>(null);

  const template = initialAssignment.program_template;
  const isPreProgramTemplate = isPreProgramTemplateStatus(initialAssignment.status);

  const formDefaultValues = useMemo(
    () => ({
      name: template?.name || '',
      description: template?.description || '',
      weeks: template?.weeks || 4,
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

  const handleStepClick = (step: 1 | 2): void => {
    setActiveStep(step);
    if (step === 2) {
      workoutRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  if (!initialAssignment || !template) {
    return (
      <div className="body">
        <p style={{ color: 'var(--text-muted)' }}>Program not found</p>
      </div>
    );
  }

  return (
    <div className="body">
      <BuilderSaveBar
        activeStep={activeStep}
        onStepClick={handleStepClick}
        onSave={() => setSaveTrigger((value) => value + 1)}
        saveDisabled={saveState.disabled}
        saveLoading={saveState.loading}
        showUnsaved={programForm.formState.isDirty}
      />

      {isPreProgramTemplate ? <PreProgramWarningBanner /> : null}

      <div id="program-details">
        <FormProvider {...programForm}>
          <ProgramDetailsSection
            template={template}
            initialAssignment={initialAssignment}
            status={initialAssignment.status}
            hideActions
            formMethods={programForm}
            defaultOpen={!programDetailsCollapsed}
          />
        </FormProvider>
      </div>

      <div ref={workoutRef} id="build-workout" style={{ marginTop: 24 }}>
        <FormProvider {...programForm}>
          <BuildWorkoutSection
            initialWeeks={template.weeks}
            template={template}
            assignmentStatus={builderAssignmentStatus}
            saveTrigger={saveTrigger}
            onSaveStateChange={setSaveState}
            onStepActive={() => setActiveStep(2)}
          />
        </FormProvider>
      </div>
    </div>
  );
}
