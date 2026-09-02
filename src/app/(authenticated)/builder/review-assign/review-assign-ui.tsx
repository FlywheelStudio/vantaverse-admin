'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import toast from 'react-hot-toast';
import { Icon } from '@/components/medvanta';
import { AppBar } from '@/components/medvanta/shell';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useQueryClient } from '@tanstack/react-query';
import { HtmlAvatar } from '../../users/html-helpers';
import { BuilderSaveBar } from '../partials/html-save-bar';
import {
  calculateEndDate,
  formatDateForDB,
  parseLocalDateString,
} from '@/lib/utils';
import { createParallelQueries } from '@/lib/supabase/query';
import type { SupabaseSuccess, SupabaseError } from '@/lib/supabase/query';
import { programAssignmentsKeys } from '@/hooks/use-passignments';
import { useUpsertWorkoutSchedule, useUpdateProgramSchedule } from '@/hooks/use-workout-schedule-mutations';
import { useUpdateProgramTemplate } from '@/hooks/use-program-template-mutations';
import { useDefaultValues } from '../[id]/default-values/use-default-values';
import { UpdateDerivedDialog } from '../[id]/workout-schedule/update-derived-dialog';
import {
  updateDerivedProgramSchedules,
  updateAssignmentDates,
} from '../actions';
import {
  estimateSessionMinutes,
  getDayName,
} from '../[id]/workout-schedule/exercise-builder-mock-data';
import { PROGRAM_ASSIGNMENT_STATUS } from '@/lib/constants/program-assignment-status';
import type { ProgramAssignmentWithTemplate, ProgramAssignmentMember } from '@/lib/supabase/schemas/program-assignments';
import type { SelectedItem } from '../[id]/template-config/types';
import { QuickAssignModal } from './quick-assign-modal';
import { PropagateDatesDialog } from './propagate-dates-dialog';
import { getMemberName, isOngoingProgram } from './program-window';

interface ReviewAssignUIProps {
  assignmentId: string;
  programAssignment: ProgramAssignmentWithTemplate;
  schedule: SelectedItem[][][];
  members: ProgramAssignmentMember[];
}

interface WeekStat {
  days: string[];
  sessions: number;
  exercises: number;
  minutes: number | null;
}


/** HTML `scReviewAssign` — real data: program window, weeks at a glance, members. */
export function ReviewAssignUI({
  assignmentId,
  programAssignment,
  schedule,
  members,
}: ReviewAssignUIProps): React.ReactElement {
  const builderHref = `/builder/${assignmentId}`;
  const template = programAssignment.program_template;
  const templateName = template?.name ?? 'Program';
  const weeks = template?.weeks ?? 0;
  const status = programAssignment.status;
  const isPreProgramTemplate =
    status === PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM_TEMPLATE;

  // Dates: local edit state vs saved baseline (drives Unsaved changes).
  const [savedDates, setSavedDates] = useState<{
    start: string | null;
    end: string | null;
  }>({
    start: programAssignment.start_date,
    end: programAssignment.end_date,
  });
  const [startDate, setStartDate] = useState<Date | undefined>(
    savedDates.start ? parseLocalDateString(savedDates.start) : undefined,
  );
  const [endDate, setEndDate] = useState<Date | undefined>(
    savedDates.end ? parseLocalDateString(savedDates.end) : undefined,
  );
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [showDerivedDialog, setShowDerivedDialog] = useState(false);
  const [showPropagateDialog, setShowPropagateDialog] = useState(false);
  const [isQuickAssignOpen, setIsQuickAssignOpen] = useState(false);

  const isUnassigned =
    status === PROGRAM_ASSIGNMENT_STATUS.TEMPLATE ||
    isPreProgramTemplate;
  const ownOngoing = isOngoingProgram(status, savedDates.start);
  const canEditDates =
    !isUnassigned &&
    (status === PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM || !ownOngoing);

  const queryClient = useQueryClient();
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

  const isSaving =
    upsertScheduleMutation.isPending ||
    updateProgramScheduleMutation.isPending ||
    updateProgramTemplateMutation.isPending;

  const datesDirty =
    canEditDates &&
    ((startDate ? formatDateForDB(startDate) : null) !== savedDates.start ||
      (endDate ? formatDateForDB(endDate) : null) !== savedDates.end);

  const handleDateSelect = (range: DateRange | undefined): void => {
    const from = range?.from;
    if (!from) {
      setStartDate(undefined);
      setEndDate(undefined);
      return;
    }
    // End date is always calculated from the template length.
    setStartDate(from);
    setEndDate(calculateEndDate(from, weeks));
  };

  /**
   * Save template + schedule (+ assignment link). When `propagateIds` is set
   * (assigned-program date edit), also write the new window to this assignment
   * plus every propagated assignment.
   */
  const performSave = async (
    updateDerived: boolean,
    propagateIds?: string[],
  ): Promise<void> => {
    try {
      const result = await createParallelQueries({
        template: {
          query: async (): Promise<SupabaseSuccess<unknown> | SupabaseError> => {
            try {
              const saved = await updateProgramTemplateMutation.mutateAsync({
                templateId: template.id,
                name: template.name,
                weeks: template.weeks,
                coming_soon_weeks: template.coming_soon_weeks ?? 0,
                description: template.description ?? null,
                goals: template.goals ?? null,
                notes: template.notes ?? null,
                imageFile: null,
                imagePreview: null,
                oldImageUrl:
                  typeof template.image_url === 'string'
                    ? template.image_url
                    : null,
                organizationId: template.organization_id || null,
              });
              return { success: true, data: saved };
            } catch (error) {
              return {
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : 'Failed to update template',
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
                assignmentId,
                defaultValues,
              });
              return { success: true, data: scheduleResult };
            } catch (error) {
              return {
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : 'Failed to save schedule',
                status: 500,
              };
            }
          },
          required: true,
        },
        assignment: {
          query: async (deps: {
            template: unknown;
            schedule: { id: string; schedule_hash: string };
          }): Promise<SupabaseSuccess<unknown> | SupabaseError> => {
            try {
              await updateProgramScheduleMutation.mutateAsync({
                assignmentId,
                workoutScheduleId: deps.schedule.id,
              });
              return { success: true, data: { id: assignmentId } };
            } catch (error) {
              return {
                success: false,
                error:
                  error instanceof Error
                    ? error.message
                    : 'Failed to update assignment',
                status: 500,
              };
            }
          },
          dependsOn: ['template', 'schedule'] as const,
          required: false,
        },
      });

      if (propagateIds) {
        if (!(startDate && endDate)) {
          throw new Error('Pick a start and end date before saving');
        }
        const datesResult = await updateAssignmentDates(
          [assignmentId, ...propagateIds],
          formatDateForDB(startDate),
          formatDateForDB(endDate),
        );
        if (!datesResult.success) {
          throw new Error(datesResult.error);
        }
      }

      if (isUnassigned && updateDerived && result.schedule) {
        const derivedResult = await updateDerivedProgramSchedules(
          assignmentId,
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
      setSavedDates({
        start: startDate ? formatDateForDB(startDate) : null,
        end: endDate ? formatDateForDB(endDate) : null,
      });
      setShowDerivedDialog(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
      setShowDerivedDialog(false);
    }
  };

  const handleSaveTriggered = (): void => {
    void (async () => {
      if (isPreProgramTemplate) {
        await performSave(true);
        return;
      }
      if (isUnassigned) {
        setShowDerivedDialog(true);
        return;
      }
      if (!(startDate && endDate)) {
        toast.error('Pick a start and end date before saving');
        return;
      }
      setShowPropagateDialog(true);
      setShowPropagateDialog(true);
    })();
  };

  // Weeks at a glance: real stats from the converted schedule.
  const weekStats: WeekStat[] = useMemo(() => {
    return schedule.map((week) => {
      const days: string[] = [];
      let exercises = 0;
      week.forEach((dayItems, dayIndex) => {
        if (dayItems.length > 0) {
          days.push(getDayName(dayIndex));
          exercises += dayItems.length;
        }
      });
      return {
        days,
        sessions: days.length,
        exercises,
        minutes: days.length > 0 ? estimateSessionMinutes(Math.round(exercises / days.length)) : null,
      };
    });
  }, [schedule]);

  const totalWorkoutDays = weekStats.reduce((sum, w) => sum + w.sessions, 0);
  const totalExercises = weekStats.reduce((sum, w) => sum + w.exercises, 0);

  const activeMembers = members.filter(
    (member) => member.status === PROGRAM_ASSIGNMENT_STATUS.ACTIVE,
  );
  const dateRange: DateRange | undefined =
    startDate || endDate ? { from: startDate, to: endDate } : undefined;

  return (
    <>
      <AppBar
        crumbs={[
          { label: 'Programs', href: '/builder' },
          { label: templateName, href: builderHref },
          { label: 'Review and assign' },
        ]}
        title={templateName}
        subtitle={`Template · ${weeks} week${weeks === 1 ? '' : 's'}`}
      />
      <div className="body">
        <BuilderSaveBar
          activeStep={3}
          detailsHref={builderHref}
          workoutHref={`${builderHref}#build-workout`}
          onSave={handleSaveTriggered}
          saveDisabled={!datesDirty || isSaving}
          saveLoading={isSaving}
          showUnsaved={datesDirty}
          assignmentId={assignmentId}
          templateName={templateName}
        />

        <div
          className="g"
          style={{
            gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)',
            alignItems: 'start',
          }}
        >
          <div>
            <div className="card card-flush">
              <div className="cs">
                <span className="cs-t">The {weeks} weeks at a glance</span>
                <span className="sp">
                  <Link href={`${builderHref}#build-workout`} className="btn btn-ghost btn-sm">
                    <Icon name="SquarePen" size={15} />
                    Edit the schedule
                  </Link>
                </span>
              </div>
              <table className="tbl">
                <thead>
                  <tr>
                    <th>Week</th>
                    <th>Days</th>
                    <th>Sessions</th>
                    <th>Avg session</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {weekStats.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="mut" style={{ padding: 14 }}>
                        No workout days scheduled yet — build the schedule first.
                      </td>
                    </tr>
                  ) : (
                    weekStats.map((week, index) => (
                      <tr key={index}>
                        <td style={{ width: 74 }}>
                          <span
                            className="mono"
                            style={{
                              fontWeight: 'var(--fw-semibold)',
                              color: 'var(--text-strong)',
                            }}
                          >
                            {index + 1}
                          </span>
                        </td>
                        <td>{week.days.length > 0 ? week.days.join(' ') : <span className="mut">—</span>}</td>
                        <td>
                          <span className="mono" style={{ fontSize: 'var(--text-sm)' }}>
                            {week.sessions}
                          </span>
                        </td>
                        <td>
                          {week.minutes !== null ? (
                            <span className="mono" style={{ fontSize: 'var(--text-sm)' }}>
                              ~{week.minutes} min
                            </span>
                          ) : (
                            <span className="mut" style={{ fontSize: 'var(--text-sm)' }}>
                              Unspecified
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', width: 52 }}>
                          <Link
                            href={`${builderHref}#build-workout`}
                            className="ib ib-ghost ib-sm"
                            aria-label={`Edit week ${index + 1}`}
                          >
                            <Icon name="SquarePen" size={15} />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
              <div className="cf">
                <span>
                  <b className="mono" style={{ color: 'var(--text-body)' }}>
                    {totalWorkoutDays}
                  </b>{' '}
                  workout days ·{' '}
                  <b className="mono" style={{ color: 'var(--text-body)' }}>
                    {totalExercises}
                  </b>{' '}
                  prescriptions
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="ch" style={{ marginBottom: 14 }}>
                <div>
                  <div className="ch-t" style={{ fontSize: 'var(--text-base)' }}>
                    Program window
                  </div>
                  <div className="ch-s">
                    {isUnassigned
                      ? 'Dates are set per member when assigned'
                      : ownOngoing
                        ? 'Locked while the program runs'
                        : 'End date follows the template length'}
                  </div>
                </div>
              </div>

              {isUnassigned ? (
                <>
                  <p className="mut" style={{ fontSize: 'var(--text-sm)', marginBottom: 10 }}>
                    Assign this template to one or more members with a shared start date.
                  </p>
                  <button
                    type="button"
                    className="btn btn-acc btn-full"
                    onClick={() => setIsQuickAssignOpen(true)}
                  >
                    <Icon name="ClipboardList" size={16} />
                    Quick assign
                  </button>
                </>
              ) : canEditDates ? (
                <>
                  <label className="lbl" style={{ marginBottom: 8 }}>
                    Start date<span className="req">*</span>
                  </label>
                  <Popover open={isDatePickerOpen} onOpenChange={setIsDatePickerOpen}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="btn btn-sec btn-full"
                        style={{ justifyContent: 'flex-start' }}
                      >
                        <Icon name="Calendar" size={16} />
                        {startDate
                          ? `${format(startDate, 'EEE, MMM d')} – ${endDate ? format(endDate, 'EEE, MMM d, yyyy') : '…'}`
                          : 'Select start date'}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="range"
                        selected={dateRange}
                        onSelect={handleDateSelect}
                        defaultMonth={startDate}
                        numberOfMonths={1}
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <div className="hint" style={{ marginTop: 8 }}>
                    End date auto-calculates from the {weeks}-week length.
                  </div>
                </>
              ) : (
                <>
                  <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
                    {savedDates.start ? (
                      <>
                        <b>{format(parseLocalDateString(savedDates.start), 'EEE, MMM d, yyyy')}</b>
                        {' – '}
                        <b>
                          {savedDates.end
                            ? format(parseLocalDateString(savedDates.end), 'EEE, MMM d, yyyy')
                            : 'ongoing'}
                        </b>
                      </>
                    ) : (
                      <span className="mut">No dates set</span>
                    )}
                  </div>
                  {ownOngoing && savedDates.start ? (
                    <div className="hint" style={{ marginTop: 8 }}>
                      Start date locked while running — extend weeks in Workout
                      Schedule to extend the end date.
                    </div>
                  ) : null}
                </>
              )}
            </div>

            <div className="card">
              <div className="ch" style={{ marginBottom: 12 }}>
                <div>
                  <div className="ch-t" style={{ fontSize: 'var(--text-base)' }}>
                    Already on this template
                  </div>
                  <div className="ch-s">Live programs; unaffected unless you push changes</div>
                </div>
              </div>
              {members.length === 0 ? (
                <p className="mut" style={{ fontSize: 'var(--text-sm)' }}>
                  No members assigned yet — assign this template to add the first one.
                </p>
              ) : (
                <>
                  <div className="row" style={{ gap: 11, marginBottom: 12 }}>
                    <span className="row" style={{ gap: -8 }}>
                      {members.slice(0, 5).map((member) => (
                        <HtmlAvatar
                          key={member.id}
                          name={getMemberName(member)}
                          size={28}
                        />
                      ))}
                    </span>
                    <span className="mut" style={{ fontSize: 'var(--text-sm)' }}>
                      {activeMembers.length} active · {members.length} total
                    </span>
                  </div>
                  <div className="list-rows">
                    {members.map((member) => (
                      <div key={member.id} className="lrow">
                        <HtmlAvatar name={getMemberName(member)} size={32} />
                        <span style={{ flex: 1, minWidth: 0 }}>
                          <span
                            style={{
                              display: 'block',
                              fontSize: 'var(--text-md)',
                              fontWeight: 'var(--fw-medium)',
                              color: 'var(--text-strong)',
                            }}
                          >
                            {getMemberName(member)}
                          </span>
                          <span
                            style={{
                              fontSize: 'var(--text-xs)',
                              color: 'var(--text-muted)',
                            }}
                          >
                            {member.start_date
                              ? `Started ${format(parseLocalDateString(member.start_date), 'MMM d, yyyy')}`
                              : 'No start date'}
                          </span>
                        </span>
                        <span className={`bdg${member.status === PROGRAM_ASSIGNMENT_STATUS.ACTIVE ? ' bdg-b' : ''}`} style={{ fontSize: 10 }}>
                          {member.status === PROGRAM_ASSIGNMENT_STATUS.ACTIVE ? 'Active' : 'Pre-program'}
                        </span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      <UpdateDerivedDialog
        open={showDerivedDialog}
        onOpenChange={(open) => {
          if (!open) setShowDerivedDialog(false);
        }}
        onConfirm={(updateDerived) => void performSave(updateDerived)}
        loading={isSaving}
        templateName={templateName}
      />

      <PropagateDatesDialog
        open={showPropagateDialog}
        onOpenChange={setShowPropagateDialog}
        members={members.filter((member) => member.id !== assignmentId)}
        startDate={startDate}
        endDate={endDate}
        loading={isSaving}
        onConfirm={(ids) => void performSave(false, ids)}
      />

      <QuickAssignModal
        open={isQuickAssignOpen}
        onOpenChange={setIsQuickAssignOpen}
        templateAssignmentId={assignmentId}
        weeks={weeks}
        organizationId={programAssignment.organization_id ?? null}
        assignedUserIds={members
          .map((member) => member.user_id)
          .filter((id): id is string => !!id)}
      />
    </>
  );
}
