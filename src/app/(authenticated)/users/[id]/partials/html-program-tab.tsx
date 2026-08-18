'use client';

import { useState } from 'react';
import { Icon } from '@/components/medvanta';
import type { ProfileWithStats } from '@/lib/supabase/schemas/profiles';
import { HtmlProgressBar } from '@/app/(authenticated)/dashboard/html-progress-bar';
import { HtmlStepList, type HtmlStepItem } from './html-step-list';

const MOCK_WEEK_DAYS = [
  { label: 'Mon', state: 'done' as const, sets: '3/3' },
  { label: 'Tue', state: 'done' as const, sets: '2/2' },
  { label: 'Wed', state: 'today' as const, sets: '1/3' },
  { label: 'Thu', state: 'todo' as const, sets: '0/2' },
  { label: 'Fri', state: 'todo' as const, sets: '0/3' },
  { label: 'Sat', state: 'rest' as const, sets: 'Rest' },
  { label: 'Sun', state: 'rest' as const, sets: 'Rest' },
];

const MOCK_DAY_BLOCKS = [
  {
    title: 'Warm-up',
    items: ['Cat-cow × 8', 'Thoracic openers × 6/side'],
  },
  {
    title: 'Strength',
    items: ['Dead bug 3×8', 'Side plank 3×20s', 'Glute bridge 3×12'],
  },
  {
    title: 'Cooldown',
    items: ['Child’s pose 60s', 'Diaphragmatic breathing × 5'],
  },
];

function ProgramAwaitingPane({
  user,
  onAssignProgram,
}: {
  user: ProfileWithStats;
  onAssignProgram: () => void;
}): React.ReactElement {
  const due = user.program_due_date;
  const [nowMs] = useState(() => Date.now());
  const dueMs = due != null && due !== '' ? Date.parse(due) : Number.NaN;
  const overdue = !Number.isNaN(dueMs) && dueMs < nowMs;

  const steps: HtmlStepItem[] = [
    {
      title: 'Clear to assign',
      tone: 'done',
      knob: 'Check',
      badge: <span className="bdg bdg-s">Ready</span>,
      meta: 'Onboarding gates allow a program assignment.',
    },
    {
      title: overdue ? 'Assignment overdue' : 'Awaiting assignment',
      tone: overdue ? 'fail' : 'now',
      knob: overdue ? '!' : 2,
      badge: overdue ? (
        <span className="bdg bdg-d">Overdue</span>
      ) : (
        <span className="bdg bdg-b">Current</span>
      ),
      meta: due
        ? `Program due date on file: ${due}`
        : 'No program due date on this profile yet.',
      sla: overdue
        ? {
            fail: true,
            label: 'Past due — extend deadline or assign now (mutations gated)',
          }
        : due
          ? { label: `Target: ${due}` }
          : undefined,
      actions: (
        <>
          <button type="button" className="btn btn-pri btn-sm" onClick={onAssignProgram}>
            <Icon name="ClipboardList" size={15} />
            Assign program
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled
            title="Placeholder — no SLA mutation API"
          >
            Extend deadline
          </button>
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            disabled
            title="Placeholder — no owner reassign API"
          >
            Reassign owner
          </button>
        </>
      ),
    },
    {
      title: 'Member starts Week 1',
      tone: 'todo',
      knob: 3,
      badge: <span className="bdg">Queued</span>,
      meta: 'Opens after a program is assigned.',
    },
  ];

  return (
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
            <div className="ch-t">Program status</div>
            <div className="ch-s">No active assignment yet</div>
          </div>
          <span className={`bdg ${overdue ? 'bdg-d' : 'bdg-a'}`}>
            {overdue ? 'Overdue' : 'Awaiting'}
          </span>
        </div>
        <HtmlStepList steps={steps} />
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
            <Icon name="ClipboardList" size={16} />
            Assign program
          </button>
          <button type="button" className="btn btn-sec" disabled title="Placeholder">
            Browse program library
          </button>
          <button type="button" className="btn btn-ghost" disabled title="Placeholder">
            Message member about delay
          </button>
        </div>
      </div>
    </div>
  );
}

function ProgramActivePane({
  user,
  onAssignProgram,
}: {
  user: ProfileWithStats;
  onAssignProgram: () => void;
}): React.ReactElement {
  const name = user.program_assignment_name ?? 'Assigned program';
  const compliance = Math.round(user.program_completion_percentage ?? 0);
  const weeks = user.program_weeks ?? 8;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="card">
        <div className="ch">
          <div>
            <div className="ch-t">{name}</div>
            <div className="ch-s">
              {weeks}-week template · compliance {compliance}%
              {user.program_due_date ? ` · due ${user.program_due_date}` : ''}
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={onAssignProgram}>
              Reassign
            </button>
            <button type="button" className="btn btn-sec btn-sm" disabled title="Placeholder">
              Push schedule
            </button>
          </div>
        </div>
        <HtmlProgressBar pct={compliance} tone="cyan" />
      </div>

      <div className="card">
        <div className="ch">
          <div>
            <div className="ch-t">This week</div>
            <div className="ch-s">Mock week strip — day-level detail not in admin API</div>
          </div>
          <span className="bdg bdg-b">Week 3 of {weeks}</span>
        </div>
        <div className="wstrip" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {MOCK_WEEK_DAYS.map((d) => (
            <button
              key={d.label}
              type="button"
              className={`wk${d.state === 'today' ? ' on' : ''}`}
              style={{
                opacity: d.state === 'rest' ? 0.55 : 1,
                borderColor:
                  d.state === 'done'
                    ? 'var(--navy-400)'
                    : d.state === 'today'
                      ? 'var(--cyan-500)'
                      : undefined,
              }}
            >
              <span className="wn">{d.label}</span>
              <span className="wm">{d.sets}</span>
            </button>
          ))}
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
              <div className="ch-t">Wednesday — mock day plan</div>
              <div className="ch-s">Illustrative blocks until workout detail is wired</div>
            </div>
          </div>
          {MOCK_DAY_BLOCKS.map((block) => (
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
              <ul style={{ margin: 0, paddingLeft: 18, color: 'var(--text-body)', fontSize: 'var(--text-sm)' }}>
                {block.items.map((item) => (
                  <li key={item} style={{ marginBottom: 4 }}>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
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
                <span style={{ fontWeight: 'var(--fw-semibold)', color: 'var(--text-strong)' }}>{v}</span>
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
  onAssignProgram,
}: {
  user: ProfileWithStats;
  hasAssignment?: boolean;
  onAssignProgram: () => void;
}): React.ReactElement {
  const assigned =
    hasAssignment ?? Boolean(user.program_assigned || user.program_assignment_id);
  if (assigned) {
    return <ProgramActivePane user={user} onAssignProgram={onAssignProgram} />;
  }
  return <ProgramAwaitingPane user={user} onAssignProgram={onAssignProgram} />;
}
