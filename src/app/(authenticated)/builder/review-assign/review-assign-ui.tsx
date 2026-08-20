'use client';

import Link from 'next/link';
import { Icon } from '@/components/medvanta';
import { AppBar } from '@/components/medvanta/shell';
import { HtmlAvatar } from '../../users/html-helpers';
import { BuilderSaveBar } from '../partials/html-save-bar';
import { HtmlRowMenu } from '../partials/html-toolbar';
import { toastUnavailable } from '@/lib/medvanta/unavailable-toast';

interface ReviewAssignUIProps {
  assignmentId?: string;
}

const DEMO_TEMPLATE = {
  name: 'Lower Body & Back Mobility',
  weeks: 8,
  workoutDays: 25,
  membersOnTemplate: 14,
};

const CHECKS = [
  {
    ok: true,
    title: 'Every week has at least one workout day',
    detail: '8 of 8 weeks scheduled',
  },
  {
    ok: true,
    title: 'Every scheduled day has exercises',
    detail: '25 days, none empty',
  },
  {
    ok: true,
    title: 'Every exercise has sets, reps and rest',
    detail: '96 of 96 prescriptions complete',
  },
  {
    ok: false,
    title: 'Weeks 7 and 8 drop to 2 days a week',
    detail:
      'Intentional taper, or unfinished? Members see a lighter fortnight at the end.',
  },
  {
    ok: false,
    title: 'No cover image',
    detail: 'The generated gradient cover will be used instead.',
  },
  {
    ok: true,
    title: 'Description written',
    detail: 'Shown to members when the program is assigned',
  },
  {
    ok: false,
    title: 'Balance is mobility-heavy',
    detail: '44% mobility, 8% balance across the 8 weeks',
  },
] as const;

const WEEK_ROWS = [
  { days: 'Mon Wed Fri', sessions: 3, exercises: 11, volume: 79, note: 'Baseline' },
  { days: 'Mon Wed Fri', sessions: 3, exercises: 11, volume: 79, note: 'Baseline' },
  { days: 'Mon Wed Fri', sessions: 3, exercises: 11, volume: 79, note: 'Baseline' },
  { days: 'Mon Tue Thu Fri', sessions: 4, exercises: 14, volume: 100, note: 'Load added' },
  { days: 'Mon Tue Thu Fri', sessions: 4, exercises: 14, volume: 100, note: 'Load added' },
  { days: 'Mon Tue Thu Fri', sessions: 4, exercises: 14, volume: 100, note: 'Load added' },
  { days: 'Mon Thu', sessions: 2, exercises: 8, volume: 57, note: 'Taper' },
  { days: 'Mon Thu', sessions: 2, exercises: 8, volume: 57, note: 'Taper' },
] as const;

const TARGETS = [
  {
    type: 'group' as const,
    name: 'Capital MSK',
    detail: '9 members · Dana Reyes',
    selected: true,
  },
  {
    type: 'group' as const,
    name: 'Riverbend Spine',
    detail: '6 members · Priya Raghunathan',
    selected: false,
  },
  {
    type: 'person' as const,
    name: 'Nadia Okonjo',
    detail: 'Capital MSK · already on this program',
    selected: false,
  },
  {
    type: 'person' as const,
    name: 'Temi Adeyemi',
    detail: 'Northline Ortho · no program yet',
    selected: true,
  },
  {
    type: 'person' as const,
    name: 'Rafael Quintero',
    detail: 'No group · invite unopened',
    selected: false,
  },
] as const;

/** HTML `scReviewAssign` placeholder — layout only, no assign RPCs. */
export function ReviewAssignUI({
  assignmentId,
}: ReviewAssignUIProps): React.ReactElement {
  const builderHref = assignmentId ? `/builder/${assignmentId}` : '/builder';
  const passedCount = CHECKS.filter((check) => check.ok).length;
  const reviewCount = CHECKS.length - passedCount;

  return (
    <>
      <AppBar
        crumbs={[
          { label: 'Programs', href: '/builder' },
          { label: DEMO_TEMPLATE.name, href: builderHref },
          { label: 'Review and assign' },
        ]}
        title={DEMO_TEMPLATE.name}
        subtitle={`Template · ${DEMO_TEMPLATE.weeks} weeks · ${DEMO_TEMPLATE.workoutDays} workout days · ${DEMO_TEMPLATE.membersOnTemplate} members already on it`}
      />
      <div className="body">
        <BuilderSaveBar
          activeStep={3}
          detailsHref={builderHref}
          workoutHref={`${builderHref}#build-workout`}
          showUnsaved={false}
          saveDisabled
        />

        <div
          className="row"
          style={{
            gap: 10,
            marginBottom: 18,
            padding: '12px 14px',
            background: 'var(--warning-soft)',
            border: '1px solid color-mix(in oklch, var(--warning) 30%, white)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-sm)',
            color: 'var(--text-body)',
          }}
        >
          <Icon name="TriangleAlert" size={18} style={{ color: 'var(--warning)' }} />
          <span>
            <b style={{ color: 'var(--text-strong)' }}>
              Placeholder — assign flow not available.
            </b>{' '}
            Layout matches HTML review &amp; assign; bulk push and assign RPCs are not wired.
          </span>
        </div>

        <div
          className="g"
          style={{
            gridTemplateColumns: 'minmax(0,1.5fr) minmax(0,1fr)',
            alignItems: 'start',
          }}
        >
          <div>
            <div className="card card-flush" style={{ marginBottom: 16 }}>
              <div className="cs">
                <span className="cs-t">Before you assign</span>
                <span className="bdg bdg-b">{passedCount} checks passed</span>
                <span className="bdg">{reviewCount} to review</span>
                <span className="sp mut" style={{ fontSize: 'var(--text-xs)' }}>
                  Nothing here blocks assigning
                </span>
              </div>
              <div style={{ padding: '6px 20px 12px' }}>
                {CHECKS.map((check) => (
                  <div
                    key={check.title}
                    className="row"
                    style={{
                      gap: 11,
                      padding: '11px 0',
                      borderBottom: '1px solid var(--border-subtle)',
                      alignItems: 'flex-start',
                    }}
                  >
                    <Icon
                      name={check.ok ? 'CircleCheck' : 'TriangleAlert'}
                      size={17}
                      style={{
                        color: check.ok ? 'var(--navy-600)' : 'var(--slate-500)',
                        marginTop: 1,
                      }}
                    />
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 'var(--text-md)',
                          fontWeight: check.ok
                            ? 'var(--fw-medium)'
                            : 'var(--fw-semibold)',
                          color: 'var(--text-strong)',
                        }}
                      >
                        {check.title}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {check.detail}
                      </span>
                    </span>
                    {!check.ok ? <span className="bdg">Review</span> : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="card card-flush">
              <div className="cs">
                <span className="cs-t">The 8 weeks at a glance</span>
                <span className="sp">
                  <Link
                    href={`${builderHref}#build-workout`}
                    className="btn btn-ghost btn-sm"
                  >
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
                    <th>Exercises</th>
                    <th>Volume</th>
                    <th>Progression</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {WEEK_ROWS.map((week, index) => (
                    <tr key={index}>
                      <td style={{ width: 74 }}>
                        <span
                          className="mono"
                          style={{
                            fontWeight: 'var(--fw-semibold)',
                            color: 'var(--text-strong)',
                          }}
                        >
                          Week {index + 1}
                        </span>
                      </td>
                      <td>{week.days}</td>
                      <td>
                        <span className="mono" style={{ fontSize: 'var(--text-sm)' }}>
                          {week.sessions}
                        </span>
                      </td>
                      <td>
                        <span className="mono" style={{ fontSize: 'var(--text-sm)' }}>
                          {week.exercises}
                        </span>
                      </td>
                      <td>
                        <div className="pbw" style={{ maxWidth: 120 }}>
                          <span className="pb pb-6 pb-n">
                            <i style={{ width: `${week.volume}%` }} />
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className="bdg" style={{ fontSize: 10 }}>
                          {week.note}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', width: 52 }}>
                        <HtmlRowMenu
                          items={[
                            {
                              id: 'open',
                              label: `Open week ${index + 1}`,
                              onSelect: () =>
                                toastUnavailable(`Open week ${index + 1}`),
                            },
                            {
                              id: 'copy',
                              label: 'Copy week',
                              onSelect: () => toastUnavailable('Copy week'),
                            },
                            {
                              id: 'clear',
                              label: 'Clear week',
                              onSelect: () => toastUnavailable('Clear week'),
                            },
                          ]}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="cf">
                <span>
                  <b className="mono" style={{ color: 'var(--text-body)' }}>
                    25
                  </b>{' '}
                  workout days ·{' '}
                  <b className="mono" style={{ color: 'var(--text-body)' }}>
                    96
                  </b>{' '}
                  prescriptions · about{' '}
                  <b className="mono" style={{ color: 'var(--text-body)' }}>
                    22
                  </b>{' '}
                  min per session
                </span>
              </div>
            </div>
          </div>

          <div>
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="ch" style={{ marginBottom: 14 }}>
                <div>
                  <div className="ch-t" style={{ fontSize: 'var(--text-base)' }}>
                    Assign it to
                  </div>
                  <div className="ch-s">
                    Groups assign to everyone in them, now and later
                  </div>
                </div>
              </div>
              <div className="row" style={{ gap: 8, marginBottom: 12 }}>
                <span className="fld grow">
                  <Icon name="Search" size={16} />
                  <input
                    placeholder="Search people or groups…"
                    disabled
                    title="Placeholder — assign flow not available"
                  />
                </span>
              </div>
              <div className="list-rows" style={{ marginBottom: 14 }}>
                {TARGETS.map((target) => (
                  <div
                    key={target.name}
                    className={`lrow${target.selected ? ' on' : ''}`}
                  >
                    <span className={`cb${target.selected ? ' on' : ''}`}>
                      {target.selected ? (
                        <Icon name="Check" size={13} strokeWidth={3} />
                      ) : null}
                    </span>
                    {target.type === 'group' ? (
                      <span
                        className="thmb gr"
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 'var(--radius-sm)',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          fontWeight: 700,
                          color: 'var(--white)',
                          background:
                            'linear-gradient(135deg, var(--navy-700), var(--cyan-600))',
                        }}
                      >
                        {target.name
                          .split(/\s+/)
                          .map((part) => part[0])
                          .join('')
                          .slice(0, 2)}
                      </span>
                    ) : (
                      <HtmlAvatar name={target.name} size={32} />
                    )}
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span
                        style={{
                          display: 'block',
                          fontSize: 'var(--text-md)',
                          fontWeight: 'var(--fw-semibold)',
                          color: 'var(--text-strong)',
                        }}
                      >
                        {target.name}
                      </span>
                      <span
                        style={{
                          fontSize: 'var(--text-xs)',
                          color: 'var(--text-muted)',
                        }}
                      >
                        {target.detail}
                      </span>
                    </span>
                    <span
                      className={`bdg${target.type === 'group' ? ' bdg-b' : ''}`}
                      style={{ fontSize: 10 }}
                    >
                      {target.type === 'group' ? 'Group' : 'Person'}
                    </span>
                  </div>
                ))}
              </div>
              <label className="lbl" style={{ marginBottom: 8 }}>
                Start date<span className="req">*</span>
              </label>
              <div
                className="row"
                style={{ gap: 7, flexWrap: 'wrap', marginBottom: 7 }}
              >
                <button type="button" className="btn btn-pri btn-sm" disabled>
                  <Icon name="Check" size={15} />
                  Mon 10 Aug
                </button>
                <button type="button" className="btn btn-sec btn-sm" disabled>
                  Mon 17 Aug
                </button>
                <button type="button" className="btn btn-ghost btn-sm" disabled>
                  <Icon name="Calendar" size={15} />
                  Another Monday
                </button>
              </div>
              <div className="hint" style={{ marginBottom: 14 }}>
                Everyone selected starts on the same Monday.
              </div>
              <div
                className="row"
                style={{
                  gap: 11,
                  padding: '12px 14px',
                  background: 'var(--navy-50)',
                  border: '1px solid var(--navy-200)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 14,
                }}
              >
                <Icon name="UsersRound" size={17} style={{ color: 'var(--navy-700)' }} />
                <div style={{ fontSize: 'var(--text-sm)', color: 'var(--text-body)' }}>
                  <b style={{ color: 'var(--text-strong)' }}>
                    10 people will start on Mon 10 Aug.
                  </b>
                  <br />
                  9 from Capital MSK plus Temi Adeyemi. Each gets their own editable copy.
                </div>
              </div>
              <button
                type="button"
                className="btn btn-acc btn-full"
                disabled
                title="Placeholder — assign flow not available"
              >
                <Icon name="BadgeCheck" size={17} />
                Assign program
              </button>
            </div>

            <div className="card">
              <div className="ch" style={{ marginBottom: 12 }}>
                <div>
                  <div className="ch-t" style={{ fontSize: 'var(--text-base)' }}>
                    Already on this template
                  </div>
                  <div className="ch-s">
                    Unaffected unless you push changes to them
                  </div>
                </div>
              </div>
              <div className="row" style={{ gap: 11, marginBottom: 12 }}>
                <span className="row" style={{ gap: -8 }}>
                  {['NO', 'CB', 'TS', 'RA', 'BR'].map((initials) => (
                    <HtmlAvatar key={initials} name={initials} size={28} />
                  ))}
                </span>
                <span className="mut" style={{ fontSize: 'var(--text-sm)' }}>
                  14 members across 3 groups
                </span>
              </div>
              <label className="cbl" style={{ alignItems: 'flex-start' }}>
                <span className="cb" style={{ marginTop: 1 }} />
                <span>
                  <span
                    style={{
                      display: 'block',
                      fontSize: 'var(--text-sm)',
                      color: 'var(--text-body)',
                    }}
                  >
                    Also push this schedule to their remaining weeks
                  </span>
                  <span
                    style={{
                      fontSize: 'var(--text-xs)',
                      color: 'var(--text-muted)',
                    }}
                  >
                    Completed weeks are never rewritten. 3 members are mid-week and
                    finish the current one first.
                  </span>
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
