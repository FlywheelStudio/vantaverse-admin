'use client';

import { Icon } from '@/components/medvanta';
import { toastUnavailable } from '@/lib/medvanta/unavailable-toast';

type FilterOpt = { label: string; count?: number | null; on?: boolean; disabled?: boolean };

type FilterGroup =
  | { title: string; hint?: string; type?: 'check'; opts: FilterOpt[] }
  | { title: string; hint?: string; type: 'chips'; opts: FilterOpt[] }
  | { title: string; hint?: string; type: 'radio'; opts: FilterOpt[] }
  | { title: string; hint?: string; type: 'date'; opts: FilterOpt[] }
  | {
      title: string;
      hint?: string;
      type: 'range';
      min: number;
      max: number;
      unit?: string;
      from: number;
      to: number;
    };

/** HTML `FILTERS.members` shape — non-wired groups are placeholders (disabled). */
const MEMBERS_FILTER_GROUPS: FilterGroup[] = [
  {
    title: 'Group',
    opts: [
      { label: 'Capital MSK', count: 9, on: true, disabled: true },
      { label: 'Northline Ortho', count: 5, disabled: true },
      { label: 'Riverbend Spine', count: 6, disabled: true },
      { label: 'No group', count: 41, disabled: true },
    ],
  },
  {
    title: 'Role',
    type: 'chips',
    opts: [
      { label: 'Member', count: 129 },
      { label: 'Physiologist', count: 4 },
      { label: 'Admin', count: 6 },
    ],
  },
  {
    title: 'Status',
    opts: [
      { label: 'Active', count: 61, on: true, disabled: true },
      { label: 'Invited', count: 27, disabled: true },
      { label: 'Dormant', count: 41, disabled: true },
      { label: 'Deactivated', count: 8, disabled: true },
    ],
  },
  {
    title: 'Onboarding gate',
    opts: [
      { label: '0 — invited, nothing done', count: 41, disabled: true },
      { label: '1 — intake signed', count: 18, disabled: true },
      { label: '2 — screening attended', count: 14, disabled: true },
      { label: '3 — consultation attended', count: 11, disabled: true },
      { label: '4 — program assigned', count: 45, disabled: true },
    ],
  },
  {
    title: 'Program deadline',
    hint: '5 working days from consultation',
    opts: [
      { label: 'Overdue', count: 6 },
      { label: 'Due within 2 working days', count: 5 },
      { label: 'Not yet due', count: 0, disabled: true },
    ],
  },
  {
    title: 'Program',
    opts: [
      { label: 'On a program', count: 45, disabled: true },
      { label: 'Completed a program', count: 2, disabled: true },
      { label: 'Not assigned', count: 43, disabled: true },
      { label: 'Pre-program only', count: 27, disabled: true },
    ],
  },
  {
    title: 'Completion',
    type: 'range',
    hint: 'of assigned sets',
    min: 0,
    max: 100,
    unit: '%',
    from: 0,
    to: 40,
  },
  {
    title: 'Adherence',
    type: 'radio',
    opts: [
      { label: 'Any', on: true, disabled: true },
      { label: 'On track — 75% or better', count: 22, disabled: true },
      { label: 'Slipping — 25 to 75%', count: 19, disabled: true },
      { label: 'At risk — under 25%', count: 42, disabled: true },
    ],
  },
  {
    title: 'Physiologist',
    opts: [
      { label: 'Dana Reyes', count: 14, disabled: true },
      { label: 'Marcus Ellery', count: 9, disabled: true },
      { label: 'Priya Raghunathan', count: 11, disabled: true },
      { label: 'Unassigned', count: 41, disabled: true },
    ],
  },
  {
    title: 'Last active',
    type: 'date',
    opts: [
      { label: 'Any time', on: true, disabled: true },
      { label: '7 days', disabled: true },
      { label: '30 days', disabled: true },
      { label: '90 days', disabled: true },
      { label: 'Never', disabled: true },
    ],
  },
  {
    title: 'Joined',
    type: 'date',
    opts: [
      { label: 'Any time', on: true, disabled: true },
      { label: 'This month', disabled: true },
      { label: 'This quarter', disabled: true },
      { label: 'This year', disabled: true },
    ],
  },
  {
    title: 'Flags',
    opts: [
      { label: 'Has unread messages', count: 3, disabled: true },
      { label: 'Invite never opened', count: 11, disabled: true },
      { label: 'Missing a group', count: 41, disabled: true },
      { label: 'No activity since joining', count: 17, disabled: true },
    ],
  },
];

interface MembersFilterPanelProps {
  open: boolean;
  onClose: () => void;
  activeCount: number;
  /** Role chip selection (wired). */
  role: 'patient' | 'admin' | null;
  onRoleChange: (role: 'patient' | 'admin' | null) => void;
  memberCount?: number;
  adminCount?: number;
  /** Program deadline (wired). */
  dueFilter: 'all' | 'overdue' | 'due_soon';
  onDueFilterChange: (v: 'all' | 'overdue' | 'due_soon') => void;
  onClear: () => void;
  onApply: () => void;
  /** Optional live org filter UI injected into Group section. */
  groupSlot?: React.ReactNode;
}

function CheckMark({ on }: { on?: boolean }): React.ReactElement {
  return (
    <span className={`cb${on ? ' on' : ''}`}>
      {on ? <Icon name="Check" size={13} style={{ strokeWidth: 3 }} /> : null}
    </span>
  );
}

function RadioMark({ on }: { on?: boolean }): React.ReactElement {
  return <span className={`rd${on ? ' on' : ''}`}>{on ? <i /> : null}</span>;
}

/**
 * HTML `filterPanel` chrome for members.
 * Wire: Role chips + Program deadline. Other groups are layout placeholders.
 */
export function MembersFilterPanel({
  open,
  onClose,
  activeCount,
  role,
  onRoleChange,
  memberCount = 0,
  adminCount = 0,
  dueFilter,
  onDueFilterChange,
  onClear,
  onApply,
  groupSlot,
}: MembersFilterPanelProps): React.ReactElement | null {
  if (!open) return null;

  return (
    <div
      className="pop"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 340,
        zIndex: 120,
      }}
    >
      <div className="pop-h">
        <Icon name="Funnel" size={16} style={{ color: 'var(--navy-600)' }} />
        <span
          style={{
            fontSize: 'var(--text-md)',
            fontWeight: 'var(--fw-bold)',
            color: 'var(--text-strong)',
          }}
        >
          Filter members
        </span>
        {activeCount > 0 ? <span className="bdg bdg-b">{activeCount} active</span> : null}
        <span className="sp">
          <button type="button" className="ib ib-sm" aria-label="Close" onClick={onClose}>
            <Icon name="X" size={17} />
          </button>
        </span>
      </div>

      <div className="pop-b">
        {MEMBERS_FILTER_GROUPS.map((g) => {
          if (g.title === 'Group' && groupSlot) {
            return (
              <div key={g.title} className="fgrp">
                <div className="row" style={{ marginBottom: 10 }}>
                  <span className="fgrp-t" style={{ margin: 0 }}>
                    {g.title}
                  </span>
                </div>
                {groupSlot}
              </div>
            );
          }

          if (g.title === 'Role' && g.type === 'chips') {
            const chips: Array<{
              label: string;
              value: 'patient' | 'admin' | 'physiologist';
              count: number;
            }> = [
              { label: 'Member', value: 'patient', count: memberCount },
              { label: 'Physiologist', value: 'physiologist', count: 0 },
              { label: 'Admin', value: 'admin', count: adminCount },
            ];
            return (
              <div key={g.title} className="fgrp">
                <div className="row" style={{ marginBottom: 10 }}>
                  <span className="fgrp-t" style={{ margin: 0 }}>
                    Role
                  </span>
                </div>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {chips.map((c) => {
                    if (c.value === 'physiologist') {
                      return (
                        <button
                          key={c.label}
                          type="button"
                          className="btn btn-sm btn-sec"
                          style={{
                            height: 28,
                            padding: '0 11px',
                            fontSize: 'var(--text-xs)',
                          }}
                          onClick={() => toastUnavailable('Physiologist role filter')}
                        >
                          {c.label}
                        </button>
                      );
                    }
                    const on = role === c.value;
                    return (
                      <button
                        key={c.label}
                        type="button"
                        className={`btn btn-sm ${on ? 'btn-pri' : 'btn-sec'}`}
                        style={{
                          height: 28,
                          padding: '0 11px',
                          fontSize: 'var(--text-xs)',
                        }}
                        onClick={() => {
                          const nextRole: 'patient' | 'admin' | null = on
                            ? null
                            : c.value === 'admin'
                              ? 'admin'
                              : 'patient';
                          onRoleChange(nextRole);
                        }}
                      >
                        {on ? <Icon name="Check" size={13} /> : null}
                        {c.label}
                        <span style={{ opacity: 0.6, marginLeft: 2 }} className="mono">
                          {c.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (g.title === 'Program deadline' && g.type !== 'range') {
            const opts = [
              { label: 'Overdue', value: 'overdue' as const, count: 6 },
              { label: 'Due within 2 working days', value: 'due_soon' as const, count: 5 },
              { label: 'Not yet due', value: 'all' as const, count: 0, disabled: true },
            ];
            return (
              <div key={g.title} className="fgrp">
                <div className="row" style={{ marginBottom: 10 }}>
                  <span className="fgrp-t" style={{ margin: 0 }}>
                    {g.title}
                  </span>
                  <span className="sp mut" style={{ fontSize: 10 }}>
                    5 working days from consultation
                  </span>
                </div>
                <div>
                  {opts.map((o) => {
                    const on = !o.disabled && dueFilter === o.value;
                    return (
                      <label
                        key={o.label}
                        className="fopt"
                        style={o.disabled ? { opacity: 0.55, cursor: 'not-allowed' } : undefined}
                      >
                        <button
                          type="button"
                          disabled={o.disabled}
                          onClick={() => {
                            if (o.disabled) return;
                            onDueFilterChange(on ? 'all' : o.value);
                          }}
                          style={{
                            display: 'contents',
                            cursor: o.disabled ? 'not-allowed' : 'pointer',
                          }}
                        >
                          <CheckMark on={on} />
                          <span>{o.label}</span>
                          <span className="n">{o.count}</span>
                        </button>
                      </label>
                    );
                  })}
                </div>
              </div>
            );
          }

          if (g.type === 'range') {
            return (
              <div key={g.title} className="fgrp" style={{ opacity: 0.85 }}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <span className="fgrp-t" style={{ margin: 0 }}>
                    {g.title}
                  </span>
                  {g.hint ? (
                    <span className="sp mut" style={{ fontSize: 10 }}>
                      {g.hint}
                    </span>
                  ) : null}
                </div>
                <button
                  type="button"
                  className="btn btn-sec btn-sm"
                  style={{ width: '100%' }}
                  onClick={() => toastUnavailable(`${g.title} range filter`)}
                >
                  {g.from}–{g.to}
                  {g.unit ? ` ${g.unit}` : ''} · not wired
                </button>
              </div>
            );
          }

          if (g.type === 'chips') {
            return (
              <div key={g.title} className="fgrp" style={{ opacity: 0.85 }}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <span className="fgrp-t" style={{ margin: 0 }}>
                    {g.title}
                  </span>
                  <span className="sp mut" style={{ fontSize: 10 }}>
                    Placeholder
                  </span>
                </div>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {g.opts.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      className={`btn btn-sm ${o.on ? 'btn-pri' : 'btn-sec'}`}
                      style={{ height: 28, padding: '0 11px', fontSize: 'var(--text-xs)' }}
                      onClick={() => toastUnavailable(`${g.title}: ${o.label}`)}
                    >
                      {o.on ? <Icon name="Check" size={13} /> : null}
                      {o.label}
                      {o.count != null ? (
                        <span style={{ opacity: 0.6, marginLeft: 2 }} className="mono">
                          {o.count}
                        </span>
                      ) : null}
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          if (g.type === 'date') {
            return (
              <div key={g.title} className="fgrp" style={{ opacity: 0.85 }}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <span className="fgrp-t" style={{ margin: 0 }}>
                    {g.title}
                  </span>
                  <span className="sp mut" style={{ fontSize: 10 }}>
                    Placeholder
                  </span>
                </div>
                <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                  {g.opts.map((o) => (
                    <button
                      key={o.label}
                      type="button"
                      className={`btn btn-sm ${o.on ? 'btn-pri' : 'btn-sec'}`}
                      style={{ height: 28, padding: '0 11px', fontSize: 'var(--text-xs)' }}
                      onClick={() => toastUnavailable(`${g.title}: ${o.label}`)}
                    >
                      {o.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ height: 28, padding: '0 9px', fontSize: 'var(--text-xs)' }}
                    onClick={() => toastUnavailable(`${g.title}: Custom date`)}
                  >
                    <Icon name="Calendar" size={13} /> Custom…
                  </button>
                </div>
              </div>
            );
          }

          // check / radio placeholder groups
          return (
            <div key={g.title} className="fgrp" style={{ opacity: 0.85 }}>
              <div className="row" style={{ marginBottom: 10 }}>
                <span className="fgrp-t" style={{ margin: 0 }}>
                  {g.title}
                </span>
                {'hint' in g && g.hint ? (
                  <span className="sp mut" style={{ fontSize: 10 }}>
                    {g.hint}
                  </span>
                ) : (
                  <span className="sp mut" style={{ fontSize: 10 }}>
                    Placeholder
                  </span>
                )}
              </div>
              <div>
                {g.opts.map((o) => (
                  <label key={o.label} className="fopt">
                    <button
                      type="button"
                      onClick={() => toastUnavailable(`${g.title}: ${o.label}`)}
                      style={{ display: 'contents', cursor: 'pointer' }}
                    >
                      {g.type === 'radio' ? <RadioMark on={o.on} /> : <CheckMark on={o.on} />}
                      <span>{o.label}</span>
                      {o.count != null ? <span className="n">{o.count}</span> : null}
                    </button>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div className="pop-f">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
          Clear all
        </button>
        <span className="sp row" style={{ gap: 8 }}>
          <button type="button" className="btn btn-sec btn-sm" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="btn btn-pri btn-sm" onClick={onApply}>
            Show results
          </button>
        </span>
      </div>
    </div>
  );
}
