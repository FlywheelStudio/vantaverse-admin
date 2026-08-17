'use client';

import { Icon } from '@/components/medvanta';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import { HtmlAvatar } from '@/app/(authenticated)/dashboard/html-avatar';
import { HtmlProgressBar } from '@/app/(authenticated)/dashboard/html-progress-bar';
import { HtmlStepList, type HtmlStepItem, type HtmlStepTone } from './html-step-list';

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
  onChangePath: () => void,
  onOpenIntake: () => void,
  onAssignProgram: () => void,
): HtmlStepItem[] {
  const intakeDone = Boolean(user.intro_completed);
  const screeningDone = Boolean(user.screening_completed);
  const consultDone = Boolean(user.consultation_completed);
  const programDone = Boolean(user.program_assigned);

  const current =
    !intakeDone
      ? 0
      : !screeningDone
        ? 1
        : !consultDone
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
            <button type="button" className="btn btn-ghost btn-sm" disabled title="Placeholder">
              Reminder
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
      tone: gateTone(consultDone, current === 2),
      knob: consultDone ? 'Check' : 3,
      badge: consultDone ? (
        <span className="bdg bdg-s">Done</span>
      ) : current === 2 ? (
        <span className="bdg bdg-b">Current</span>
      ) : (
        <span className="bdg">Queued</span>
      ),
      meta: consultDone
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
      title: 'Program assigned',
      tone: gateTone(programDone, current === 3),
      knob: programDone ? 'Check' : 4,
      badge: programDone ? (
        <span className="bdg bdg-s">Done</span>
      ) : current === 3 ? (
        <span className="bdg bdg-a">Ready</span>
      ) : (
        <span className="bdg">Queued</span>
      ),
      meta: programDone
        ? user.program_assignment_name
          ? `Assigned: ${user.program_assignment_name}`
          : 'Program marked assigned on profile.'
        : current === 3
          ? 'Member is clear to receive a program.'
          : 'Opens after the consultation.',
      actions:
        !programDone && current === 3 ? (
          <button type="button" className="btn btn-pri btn-sm" onClick={onAssignProgram}>
            <Icon name="ClipboardList" size={15} />
            Assign program
          </button>
        ) : null,
    },
  ];
}

function InsightCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="card">
      <div className="ch" style={{ marginBottom: 12 }}>
        <div>
          <div className="ch-t" style={{ fontSize: 'var(--text-md)' }}>
            {title}
          </div>
          {subtitle ? <div className="ch-s">{subtitle}</div> : null}
        </div>
      </div>
      {children}
    </div>
  );
}

export function HtmlOnboardingTab({
  user,
  onChangePath,
  onAssignProgram,
  onOpenIntake,
}: {
  user: ProfileWithStats;
  onChangePath: () => void;
  onAssignProgram: () => void;
  onOpenIntake: () => void;
}): React.ReactElement {
  const steps = buildOnboardingSteps(
    user,
    onChangePath,
    onOpenIntake,
    onAssignProgram,
  );

  const cleared = [
    user.intro_completed,
    user.screening_completed,
    user.consultation_completed,
    user.program_assigned,
  ].filter(Boolean).length;

  const compliance = Math.round(user.program_completion_percentage ?? 0);
  const hp = user.hp_points ?? null;
  const empowerment = user.empowerment ?? null;

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
              <div className="ch-s">
                {cleared} of 4 gates cleared
                {user.journey_phase ? ` · phase ${user.journey_phase}` : ''}
              </div>
            </div>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onChangePath}>
              <Icon name="Route" size={15} />
              Change path
            </button>
          </div>
          <HtmlStepList steps={steps} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <InsightCard title="Program compliance" subtitle="Sets and exercises finished vs. assigned">
            <div className="row" style={{ justifyContent: 'center', marginBottom: 12 }}>
              <div
                style={{
                  width: 96,
                  height: 96,
                  borderRadius: '50%',
                  background: `conic-gradient(var(--navy-700) ${compliance}%, var(--slate-200) 0)`,
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <span
                  style={{
                    width: 68,
                    height: 68,
                    borderRadius: '50%',
                    background: 'var(--surface-card)',
                    display: 'grid',
                    placeItems: 'center',
                    fontWeight: 'var(--fw-bold)',
                    color: 'var(--text-strong)',
                  }}
                >
                  {compliance}%
                </span>
              </div>
            </div>
            <HtmlProgressBar value={compliance} tone="navy" />
          </InsightCard>

          <InsightCard title="Health points" subtitle="From member stats when available">
            <div className="row" style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 'var(--text-2xl)', fontWeight: 'var(--fw-bold)' }}>
                {hp ?? '—'}
              </span>
              <span className="bdg">Level {user.current_level ?? '—'}</span>
            </div>
            <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              Empowerment score: {empowerment ?? '—'}
              {user.empowerment_title ? ` · ${user.empowerment_title}` : ''}
            </div>
          </InsightCard>

          <InsightCard title="Care team" subtitle="Assignments on this profile">
            <div className="row" style={{ gap: 10, marginBottom: 10 }}>
              <HtmlAvatar name={user.first_name ?? user.email ?? 'M'} size={32} />
              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
                Group / physician cards remain available via Assign actions in the header.
                Detailed roster UI matches HTML when linked records exist.
              </span>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ marginLeft: -8 }}
              onClick={onAssignProgram}
            >
              Assign program
              <Icon name="ArrowRight" size={15} />
            </button>
          </InsightCard>
        </div>
      </div>
    </>
  );
}
