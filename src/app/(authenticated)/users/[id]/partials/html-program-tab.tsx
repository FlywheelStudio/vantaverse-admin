'use client';

import { useMemo, useState } from 'react';
import { Icon } from '@/components/medvanta';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import type { DatabaseSchedule } from '@/app/(authenticated)/builder/[id]/workout-schedule/utils';
import { HtmlProgressBar } from '@/app/(authenticated)/dashboard/html-progress-bar';
import { formatDueLabel, getProgramSlaMode } from './program-sla';
import {
  buildAdherencePeriods,
  buildDayPlan,
  buildWeekStrip,
  getCurrentWeekIndex,
  parseCompletion,
  type WeekStripDay,
} from './program-week';

interface HtmlProgramTabProps {
  user: ProfileWithStats;
  hasAssignment?: boolean;
  schedule: DatabaseSchedule | null;
  completion: Array<Array<unknown>> | null | undefined;
  exerciseNamesMap: Map<string, string>;
  groupsMap: Map<string, { exercise_template_ids: string[] | null }>;
  programAssignment: ProgramAssignmentWithTemplate | null;
  compliance: number | null;
  onAssignProgram: () => void;
}

interface HoldingRow {
  icon: string;
  title: string;
  meta: string;
  done: boolean;
}

function buildHoldingRows(user: ProfileWithStats, overdue: boolean): HoldingRow[] {
  return [
    {
      icon: 'CircleCheck',
      title: 'Intake survey read',
      meta: user.intro_completed
        ? 'Availability confirmed on profile'
        : 'Waiting on member intake survey',
      done: Boolean(user.intro_completed),
    },
    {
      icon: 'CircleCheck',
      title: 'Screening notes available',
      meta: user.screening_completed
        ? 'No red flags, cleared to load'
        : 'Screening not marked complete',
      done: Boolean(user.screening_completed),
    },
    {
      icon: 'CircleCheck',
      title: 'Consultation notes available',
      meta: user.consultation_completed
        ? 'Consultation marked complete on profile'
        : 'Consultation not marked complete',
      done: Boolean(user.consultation_completed),
    },
    {
      icon: 'Circle',
      title: 'Program not built yet',
      meta: overdue
        ? 'Nothing is blocking this — it needs a physiologist to sit down with it'
        : 'Assign when the member is clear to receive a program',
      done: false,
    },
  ];
}

function formatWeekDaySets(day: WeekStripDay): string {
  if (day.state === 'rest') return 'Rest';
  if (day.totalSets <= 0) return '—';
  return `${day.currentSets}/${day.totalSets}`;
}

function findDefaultDayIndex(strip: WeekStripDay[]): number {
  const todayIndex = strip.findIndex((day) => day.state === 'today');
  if (todayIndex >= 0) return todayIndex;

  const firstSessionIndex = strip.findIndex((day) => day.state !== 'rest');
  return firstSessionIndex >= 0 ? firstSessionIndex : 0;
}

function formatAdherenceValue(
  doneSessions: number,
  expectedSessions: number,
): string {
  if (expectedSessions > 0) {
    return `${doneSessions} of ${expectedSessions} sessions`;
  }
  if (doneSessions > 0) {
    return `${doneSessions} sessions`;
  }
  return '—';
}

function ProgramAwaitingPane({
  user,
  onAssignProgram,
}: {
  user: ProfileWithStats;
  onAssignProgram: () => void;
}): React.ReactElement {
  const slaMode = getProgramSlaMode({
    programDueDate: user.program_due_date,
    hasAssignment: false,
  });
  const overdue = slaMode === 'overdue';
  const dueLabel =
    slaMode === 'due' || slaMode === 'overdue'
      ? formatDueLabel({
          programDueDate: user.program_due_date ?? '',
          mode: slaMode,
        })
      : null;

  const holdingRows = buildHoldingRows(user, overdue);

  const title = overdue ? 'This program is overdue' : 'Waiting for a program';
  const subtitle =
    overdue && user.consultation_completed
      ? 'Consultation is complete and the member has been on the shared Pre-program since. Programs are due within 5 days of the consultation.'
      : user.consultation_completed && dueLabel
        ? `Consultation is complete on this profile. Programs are due within 5 days of consultation, so the target is ${dueLabel.dueText}.`
        : 'Member is cleared through onboarding gates but has no program assignment yet.';

  return (
    <div
      className="g"
      style={{
        gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 1fr)',
        alignItems: 'start',
      }}
    >
      <div
        className="card"
        style={
          overdue
            ? {
                borderColor:
                  'color-mix(in oklch, var(--danger) 35%, var(--white))',
              }
            : undefined
        }
      >
        <div
          className="row"
          style={{ gap: 13, alignItems: 'flex-start', marginBottom: 18 }}
        >
          <span
            style={{
              width: 42,
              height: 42,
              borderRadius: 'var(--radius-sm)',
              flex: '0 0 auto',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: overdue ? 'var(--danger-soft)' : 'var(--navy-50)',
              color: overdue ? 'var(--danger)' : 'var(--navy-600)',
            }}
          >
            <Icon name={overdue ? 'CircleAlert' : 'Hourglass'} size={21} />
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 9 }}>
              <span
                style={{
                  fontSize: 'var(--text-lg)',
                  fontWeight: 'var(--fw-bold)',
                  color: 'var(--text-strong)',
                }}
              >
                {title}
              </span>
              {dueLabel ? (
                overdue ? (
                  <span className="bdg bdg-d">
                    <Icon name="CircleAlert" size={12} />
                    {dueLabel.label}
                  </span>
                ) : (
                  <span className="bdg">{dueLabel.label}</span>
                )
              ) : null}
            </div>
            <div
              style={{
                fontSize: 'var(--text-sm)',
                color: 'var(--text-body)',
                marginTop: 4,
              }}
            >
              {subtitle}
            </div>
          </div>
          <button type="button" className="btn btn-pri" onClick={onAssignProgram}>
            <Icon name="Plus" size={17} />
            Assign program
          </button>
        </div>

        {dueLabel ? (
          <div
            className="sla"
            style={{
              borderTop: 'none',
              paddingTop: 0,
              marginTop: 0,
              marginBottom: 20,
            }}
          >
            <Icon
              name={overdue ? 'CircleAlert' : 'Hourglass'}
              size={14}
              style={{
                color: overdue ? 'var(--danger)' : 'var(--text-muted)',
              }}
            />
            <span className="sla-bar" style={{ maxWidth: 'none' }}>
              <i
                style={{
                  width: `${dueLabel.pct}%`,
                  ...(overdue ? { background: 'var(--danger)' } : {}),
                }}
              />
            </span>
            <span
              className="sla-t"
              style={overdue ? { color: 'var(--danger)' } : undefined}
            >
              {dueLabel.label}
            </span>
            <span
              className="mut"
              style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}
            >
              {dueLabel.dueText}
            </span>
          </div>
        ) : null}

        <div className="sec-t">What is holding it up</div>
        <div className="list-rows" style={{ marginBottom: 20 }}>
          {holdingRows.map((row) => (
            <div
              key={row.title}
              className="row"
              style={{
                gap: 11,
                padding: '11px 14px',
                background: 'var(--surface-card)',
              }}
            >
              <Icon
                name={row.icon}
                size={16}
                style={{
                  color: row.done
                    ? 'var(--navy-600)'
                    : overdue
                      ? 'var(--danger)'
                      : 'var(--slate-400)',
                }}
              />
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--fw-semibold)',
                    color: 'var(--text-strong)',
                  }}
                >
                  {row.title}
                </span>
                <span
                  style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)' }}
                >
                  {row.meta}
                </span>
              </span>
            </div>
          ))}
        </div>

        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button type="button" className="btn btn-pri btn-sm" onClick={onAssignProgram}>
            <Icon name="Plus" size={15} />
            Assign program
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled
            title="Extend deadline isn't available yet — missing data or APIs for this action."
          >
            Extend deadline
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled
            title="Reassign owner isn't available yet — missing data or APIs for this action."
          >
            Reassign owner
          </button>
        </div>
      </div>

      <div className="card">
        <div className="ch">
          <div>
            <div className="ch-t">Shortcuts</div>
            <div className="ch-s">Same actions as the HTML awaiting pane</div>
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button type="button" className="btn btn-pri" onClick={onAssignProgram}>
            <Icon name="Plus" size={16} />
            Assign program
          </button>
          <button
            type="button"
            className="btn btn-sec"
            disabled
            title="Browse program library isn't available yet — missing data or APIs for this action."
          >
            Browse program library
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            disabled
            title="Message member about delay isn't available yet — missing data or APIs for this action."
          >
            Message member about delay
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgramActivePane({
  user,
  programAssignment,
  schedule,
  completion,
  exerciseNamesMap,
  groupsMap,
  compliance,
  onAssignProgram,
}: {
  user: ProfileWithStats;
  programAssignment: ProgramAssignmentWithTemplate;
  schedule: DatabaseSchedule | null;
  completion: Array<Array<unknown>> | null | undefined;
  exerciseNamesMap: Map<string, string>;
  groupsMap: Map<string, { exercise_template_ids: string[] | null }>;
  compliance: number | null;
  onAssignProgram: () => void;
}): React.ReactElement {
  const parsedCompletion = useMemo(
    () => parseCompletion(completion),
    [completion],
  );

  const weekCount =
    programAssignment.program_template?.weeks ?? schedule?.length ?? 0;
  const weekIndex = getCurrentWeekIndex({
    startDate: programAssignment.start_date,
    weekCount,
  });

  const weekStrip = useMemo(
    () =>
      buildWeekStrip({
        schedule,
        completion: parsedCompletion,
        startDate: programAssignment.start_date,
        weekIndex,
      }),
    [parsedCompletion, programAssignment.start_date, schedule, weekIndex],
  );

  const defaultDayIndex = useMemo(
    () => findDefaultDayIndex(weekStrip),
    [weekStrip],
  );
  const [manualDayIndex, setManualDayIndex] = useState<number | null>(null);
  const [manualWeekIndex, setManualWeekIndex] = useState(weekIndex);
  const selectedDayIndex =
    manualWeekIndex === weekIndex && manualDayIndex != null
      ? manualDayIndex
      : defaultDayIndex;

  const handleSelectDay = (dayIndex: number): void => {
    setManualDayIndex(dayIndex);
    setManualWeekIndex(weekIndex);
  };

  const selectedDay = weekStrip[selectedDayIndex] ?? weekStrip[0];
  const dayPlan = useMemo(
    () =>
      selectedDay
        ? buildDayPlan({
            schedule,
            weekIndex,
            dayIndex: selectedDay.dayIndex,
            exerciseNamesMap,
            groupsMap,
          })
        : [],
    [exerciseNamesMap, groupsMap, schedule, selectedDay, weekIndex],
  );

  const adherenceThisWeek = useMemo(() => {
    const periods = buildAdherencePeriods({
      schedule,
      completion: parsedCompletion,
      weekIndex,
    });
    return periods[0];
  }, [parsedCompletion, schedule, weekIndex]);

  const name =
    programAssignment.program_template?.name ??
    user.program_assignment_name ??
    'Assigned program';
  const completionPct = Math.round(
    compliance ?? user.program_completion_percentage ?? 0,
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card card-flush">
        <div className="cs" style={{ padding: '16px 20px' }}>
          <span className="cs-t">{name}</span>
          <span className="bdg bdg-b">
            Week {weekIndex + 1} of {weekCount || '—'}
          </span>
          <span className="sp row" style={{ gap: 8 }}>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={onAssignProgram}
            >
              Reassign
            </button>
            <button
              type="button"
              className="btn btn-sec btn-sm"
              disabled
              title="Push schedule isn't available yet — missing data or APIs for this action."
            >
              Push schedule
            </button>
          </span>
        </div>

        <div style={{ padding: '18px 20px' }}>
          <div
            className="row"
            style={{ gap: 24, flexWrap: 'wrap', marginBottom: 18 }}
          >
            <span>
              <span
                className="row"
                style={{
                  gap: 5,
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 700,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-faint)',
                }}
              >
                <Icon name="Percent" size={12} />
                Completion
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--text-md)',
                  fontWeight: 'var(--fw-semibold)',
                  color: 'var(--text-strong)',
                  marginTop: 3,
                }}
              >
                {completionPct}%
              </span>
            </span>
            <span>
              <span
                className="row"
                style={{
                  gap: 5,
                  fontSize: 'var(--text-2xs)',
                  fontWeight: 700,
                  letterSpacing: '.06em',
                  textTransform: 'uppercase',
                  color: 'var(--text-faint)',
                }}
              >
                <Icon name="Activity" size={12} />
                Adherence
              </span>
              <span
                style={{
                  display: 'block',
                  fontSize: 'var(--text-md)',
                  fontWeight: 'var(--fw-semibold)',
                  color: 'var(--text-strong)',
                  marginTop: 3,
                }}
              >
                {formatAdherenceValue(
                  adherenceThisWeek.doneSessions,
                  adherenceThisWeek.expectedSessions,
                )}
              </span>
            </span>
          </div>

          <HtmlProgressBar pct={completionPct} tone="cyan" />

          <div className="wstrip" style={{ marginTop: 18 }}>
            {weekStrip.map((day) => {
              const isSelected = day.dayIndex === selectedDay?.dayIndex;
              const className = [
                'wk',
                isSelected ? 'on' : '',
                day.state === 'rest' ? 'mt' : '',
              ]
                .filter(Boolean)
                .join(' ');

              return (
                <button
                  key={day.label}
                  type="button"
                  className={className}
                  onClick={() => handleSelectDay(day.dayIndex)}
                >
                  <span className="wn">{day.label}</span>
                  <span className="wm">{formatWeekDaySets(day)}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div
        className="g"
        style={{
          gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)',
          alignItems: 'start',
        }}
      >
        <div className="card">
          <div className="ch">
            <div>
              <div className="ch-t">
                {selectedDay
                  ? `${selectedDay.label} — ${selectedDay.dateLabel}`
                  : 'Day plan'}
              </div>
              <div className="ch-s">
                {selectedDay?.state === 'rest'
                  ? 'Rest day on the schedule'
                  : selectedDay?.state === 'done'
                    ? 'Session marked complete'
                    : selectedDay?.state === 'today'
                      ? 'Today’s scheduled session'
                      : 'Scheduled session'}
              </div>
            </div>
          </div>
          {selectedDay?.state === 'rest' ? (
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              No exercises scheduled for this day.
            </p>
          ) : dayPlan.length === 0 ? (
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              No exercises on file for this day.
            </p>
          ) : (
            dayPlan.map((block) => (
              <div key={block.title} style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 'var(--text-sm)',
                    fontWeight: 'var(--fw-bold)',
                    color: 'var(--text-strong)',
                    marginBottom: 6,
                  }}
                >
                  {block.title}
                </div>
                <ul
                  style={{
                    margin: 0,
                    paddingLeft: 18,
                    color: 'var(--text-body)',
                    fontSize: 'var(--text-sm)',
                  }}
                >
                  {block.items.map((item) => (
                    <li key={item} style={{ marginBottom: 4 }}>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div className="card">
            <div className="ch">
              <div>
                <div className="ch-t">Check-in responses</div>
                <div className="ch-s">Mock — last 24h</div>
              </div>
            </div>
            {[
              ['Pain', '2 / 10'],
              ['Energy', 'Good'],
              ['Session RPE', '6'],
            ].map(([k, v]) => (
              <div
                key={k}
                className="row"
                style={{
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  borderBottom: '1px solid var(--border-subtle)',
                  fontSize: 'var(--text-sm)',
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>{k}</span>
                <span
                  style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}
                >
                  {v}
                </span>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="ch">
              <div>
                <div className="ch-t">Adjustments</div>
                <div className="ch-s">Placeholder clinical notes link</div>
              </div>
            </div>
            <p style={{ margin: 0, fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
              No adjustment log in admin yet. Use Notes for staff commentary when available.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function HtmlProgramTab({
  user,
  hasAssignment,
  schedule,
  completion,
  exerciseNamesMap,
  groupsMap,
  programAssignment,
  compliance,
  onAssignProgram,
}: HtmlProgramTabProps): React.ReactElement {
  const assigned =
    hasAssignment ?? Boolean(user.program_assigned || user.program_assignment_id);

  if (assigned && programAssignment) {
    return (
      <ProgramActivePane
        user={user}
        programAssignment={programAssignment}
        schedule={schedule}
        completion={completion}
        exerciseNamesMap={exerciseNamesMap}
        groupsMap={groupsMap}
        compliance={compliance}
        onAssignProgram={onAssignProgram}
      />
    );
  }

  return <ProgramAwaitingPane user={user} onAssignProgram={onAssignProgram} />;
}
