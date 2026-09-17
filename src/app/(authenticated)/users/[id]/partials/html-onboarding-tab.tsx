'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/medvanta';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { HabitPledge } from '@/lib/supabase/queries/habit-pledge';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';
import { HtmlGate } from '../../html-helpers';
import { HtmlStepList, type HtmlStepItem, type HtmlStepTone } from './html-step-list';
import { AdherenceCard } from './insights/adherence-card';
import type { PreprogramEngagementRow } from './insights/adherence-card';
import { PledgeCard } from './insights/pledge-card';
import { VantapointsCard } from './insights/vantapoints-card';
import {
  getOnboardingPathProgress,
  type OnboardingPathProgress,
} from '@/lib/onboarding-path';
import { getProgramSlaMode } from './program-sla';
import {
  buildAdherencePeriods,
  getCurrentWeekIndex,
  parseCompletion,
} from './program-week';

function formatPhase(phase: string): string {
  return phase.charAt(0).toUpperCase() + phase.slice(1);
}

function gateTone(
  done: boolean,
  isCurrent: boolean,
): HtmlStepTone {
  if (done) return 'done';
  if (isCurrent) return 'now';
  return 'todo';
}

function buildOnboardingSteps(
  user: ProfileWithStats,
  path: OnboardingPathProgress,
  onChangePath: () => void,
  onOpenIntake: () => void,
  onAssignProgram: () => void,
): HtmlStepItem[] {
  const { intakeDone, screeningDone, consultationDone, programDone } = path;

  const current =
    !intakeDone
      ? 0
      : !screeningDone
        ? 1
        : !consultationDone
          ? 2
          : !programDone
            ? 3
            : 4;

  return [
    {
      title: 'Intake survey signed',
      tone: gateTone(intakeDone, current === 0),
      knob: intakeDone ? 'Check' : 1,
      badge: intakeDone ? (
        <span className="bdg bdg-s">Done</span>
      ) : current === 0 ? (
        <span className="bdg bdg-b">Current</span>
      ) : (
        <span className="bdg">Queued</span>
      ),
      meta: intakeDone
        ? 'Record on file (timestamp not available in admin data).'
        : current === 0
          ? 'Waiting on the member to finish the in-app survey.'
          : 'Not started yet.',
      actions: (
        <>
          <button type="button" className="btn btn-ghost btn-sm" onClick={onOpenIntake}>
            <Icon name="FileText" size={15} />
            View survey
          </button>
          {!intakeDone && current === 0 ? (
            <button
              type="button"
              className="btn btn-sec btn-sm"
              disabled
              title="Placeholder — no reminder API"
            >
              <Icon name="Bell" size={15} />
              Send reminder
            </button>
          ) : null}
        </>
      ),
    },
    {
      title: 'Screening appointment',
      tone: gateTone(screeningDone, current === 1),
      knob: screeningDone ? 'Check' : 2,
      badge: screeningDone ? (
        <span className="bdg bdg-s">Done</span>
      ) : current === 1 ? (
        <span className="bdg bdg-b">Current</span>
      ) : (
        <span className="bdg">Queued</span>
      ),
      meta: screeningDone
        ? 'Marked complete in profile.'
        : current === 1
          ? 'Book or confirm the screening visit for this member.'
          : 'Opens after the intake survey is signed.',
      actions:
        current === 1 ? (
          <>
            <button type="button" className="btn btn-pri btn-sm" disabled title="Placeholder — no booking link API">
              <Icon name="CalendarPlus" size={15} />
              Book screening
            </button>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onChangePath}>
              Change path
            </button>
          </>
        ) : screeningDone ? (
          <button type="button" className="btn btn-ghost btn-sm" disabled title="Placeholder">
            Reschedule
          </button>
        ) : null,
    },
    {
      title: 'Virtual consultation',
      tone: gateTone(consultationDone, current === 2),
      knob: consultationDone ? 'Check' : 3,
      badge: consultationDone ? (
        <span className="bdg bdg-s">Done</span>
      ) : current === 2 ? (
        <span className="bdg bdg-b">Current</span>
      ) : (
        <span className="bdg">Queued</span>
      ),
      meta: consultationDone
        ? 'Marked complete in profile.'
        : current === 2
          ? 'Schedule the virtual consult when screening is done.'
          : 'Opens after screening is marked complete.',
      actions:
        current === 2 ? (
          <button type="button" className="btn btn-pri btn-sm" disabled title="Placeholder — no Calendly booking API">
            <Icon name="Video" size={15} />
            Book consult
          </button>
        ) : null,
    },
    {
      title: programDone ? 'Program assigned' : 'Assign program',
      tone: gateTone(programDone, current === 3),
      knob: programDone ? 'Check' : 4,
      badge: programDone ? (
        <span className="bdg bdg-s">Done</span>
      ) : current === 3 ? (
        <span className="bdg bdg-a">Ready to assign</span>
      ) : (
        <span className="bdg">Queued</span>
      ),
      meta: programDone
        ? user.program_assignment_name
          ? `Assigned: ${user.program_assignment_name}`
          : 'Active program marked assigned on profile.'
        : current === 3
          ? 'Member is clear for an active program. Pre-program alone does not count.'
          : 'Opens after the consultation.',
      actions:
        !programDone && current === 3 ? (
          <button type="button" className="btn btn-acc btn-sm" onClick={onAssignProgram}>
            <Icon name="ClipboardList" size={15} />
            Assign program
          </button>
        ) : null,
    },
  ];
}

function buildPreprogramRows(
  user: ProfileWithStats,
): PreprogramEngagementRow[] {
  const rows: PreprogramEngagementRow[] = [];

  if (user.program_completion_percentage != null) {
    const pct = Math.round(user.program_completion_percentage);
    rows.push({
      label: 'Program completion',
      value: `${pct}%`,
      pct,
    });
  }

  return rows;
}

export function HtmlOnboardingTab({
  user,
  habitPledge,
  programAssignment,
  schedule,
  completion,
  onChangePath,
  onAssignProgram,
  onOpenIntake,
}: {
  user: ProfileWithStats;
  habitPledge: HabitPledge | null;
  programAssignment: ProgramAssignmentWithTemplate | null;
  schedule: DatabaseSchedule | null;
  completion: Array<Array<unknown>> | null | undefined;
  onChangePath: () => void;
  onAssignProgram: () => void;
  onOpenIntake: () => void;
}): React.ReactElement {
  const path = getOnboardingPathProgress(user);
  const steps = buildOnboardingSteps(
    user,
    path,
    onChangePath,
    onOpenIntake,
    onAssignProgram,
  );
  const { cleared, total: pathTotal } = path;

  const slaMode = getProgramSlaMode({
    programDueDate: user.program_due_date,
    hasAssignment: Boolean(programAssignment),
  });

  const adherenceCard = useMemo(() => {
    if (slaMode === 'assigned') {
      const parsedCompletion = parseCompletion(completion);
      const weekCount =
        programAssignment?.program_template?.weeks ??
        schedule?.length ??
        0;
      const weekIndex = getCurrentWeekIndex({
        startDate: programAssignment?.start_date ?? null,
        weekCount,
      });

      return (
        <AdherenceCard
          variant="assigned"
          periods={buildAdherencePeriods({
            schedule,
            completion: parsedCompletion,
            weekIndex,
          })}
        />
      );
    }

    return (
      <AdherenceCard variant="preprogram" rows={buildPreprogramRows(user)} />
    );
  }, [completion, programAssignment, schedule, slaMode, user]);

  return (
    <>
      <div
        className="g"
        style={{
          gridTemplateColumns: 'minmax(0, 1.55fr) minmax(0, 1fr)',
          alignItems: 'start',
        }}
      >
        <div className="card">
          <div className="ch">
            <div>
              <div className="ch-t">Onboarding path</div>
              <div className="sl-head-sub">
                <HtmlGate unlocked={cleared} total={pathTotal} />
                <span className="sl-count">gates cleared</span>
                {user.journey_phase ? (
                  <>
                    <span className="sl-dot" aria-hidden />
                    <span className="bdg bdg-o">{formatPhase(user.journey_phase)}</span>
                  </>
                ) : null}
              </div>
            </div>
            <button type="button" className="btn btn-sec btn-sm" onClick={onChangePath}>
              <Icon name="Route" size={15} />
              Change path
            </button>
          </div>
          <HtmlStepList steps={steps} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <VantapointsCard
            level={user.current_level}
            hpPoints={user.hp_points}
            pointsForNextLevel={user.points_for_next_level}
            pointsMissingForNextLevel={null}
          />

          <PledgeCard habitPledge={habitPledge} />

          {adherenceCard}
        </div>
      </div>
    </>
  );
}
