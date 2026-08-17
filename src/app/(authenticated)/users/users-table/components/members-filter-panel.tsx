'use client';

import { Icon } from '@/components/medvanta';

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
export const MEMBERS_FILTER_GROUPS: FilterGroup[] = [
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
];

export interface MembersFilterPanelProps {
  open: boolean;
  onClose: () => void;
  activeCount: number;
  /** Role chip selection (wired). */
  role: 'patient' | 'admin' | null;
  onRoleChange: (role: 'patient' | 'admin' | null) => void;
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
  dueFilter,
  onDueFilterChange,
  onClear,
  onApply,
  groupSlot,
}: MembersFilterPanelProps): React.ReactElement | null {
  if (!open) return null;

  return (
    <div
      className="pop pop-full"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '100%',
        marginTop: 10,
        zIndex: 20,
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

      <div className="pop-b" style={{ maxHeight: 430 }}>
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
              value: 'patient' | 'admin' | null;
              count?: number;
            }> = [
              { label: 'Member', value: 'patient', count: 129 },
              { label: 'Physiologist', value: 'admin', count: 4 },
              { label: 'Admin', value: null, count: 6 },
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
                    const on = role === c.value;
                    const disabled = c.label === 'Admin';
                    return (
                      <button
                        key={c.label}
                        type="button"
                        className={`btn btn-sm ${on ? 'btn-pri' : 'btn-sec'}`}
                        style={{
                          height: 28,
                          padding: '0 11px',
                          fontSize: 'var(--text-xs)',
                          opacity: disabled ? 0.55 : 1,
                        }}
                        disabled={disabled}
                        title={disabled ? 'Placeholder — Admin filter not available' : undefined}
                        onClick={() => {
                          if (disabled) return;
                          onRoleChange(on ? null : c.value);
                        }}
                      >
                        {on ? <Icon name="Check" size={13} /> : null}
                        {c.label}
                        {c.count != null ? (
                          <span style={{ opacity: 0.6, marginLeft: 2 }} className="mono">
                            {c.count}
                          </span>
                        ) : null}
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
              <div key={g.title} className="fgrp" style={{ opacity: 0.7 }}>
                <div className="row" style={{ marginBottom: 10 }}>
                  <span className="fgrp-t" style={{ margin: 0 }}>
                    {g.title}
                  </span>
                  {g.hint ? (
                    <span className="sp mut" style={{ fontSize: 10 }}>
                      {g.hint} · Placeholder
                    </span>
                  ) : null}
                </div>
                <div className="row" style={{ gap: 8 }}>
                  <span className="fld fld-sm" style={{ flex: 1, padding: '0 10px', gap: 4 }}>
                    <input
                      className="mono"
                      style={{ textAlign: 'center', fontSize: 'var(--text-sm)' }}
                      value={g.min}
                      readOnly
                      disabled
                    />
                    <span className="mut" style={{ fontSize: 10 }}>
                      min
                    </span>
                  </span>
                  <span className="mut" style={{ fontSize: 'var(--text-xs)' }}>
                    to
                  </span>
                  <span className="fld fld-sm" style={{ flex: 1, padding: '0 10px', gap: 4 }}>
                    <input
                      className="mono"
                      style={{ textAlign: 'center', fontSize: 'var(--text-sm)' }}
                      value={g.max}
                      readOnly
                      disabled
                    />
                    <span className="mut" style={{ fontSize: 10 }}>
                      max
                    </span>
                  </span>
                  {g.unit ? (
                    <span className="mut" style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
                      {g.unit}
                    </span>
                  ) : null}
                </div>
                <div
                  style={{
                    position: 'relative',
                    height: 4,
                    borderRadius: 99,
                    background: 'var(--slate-200)',
                    margin: '13px 4px 2px',
                  }}
                >
                  <span
                    style={{
                      position: 'absolute',
                      left: `${g.from}%`,
                      right: `${100 - g.to}%`,
                      top: 0,
                      bottom: 0,
                      background: 'var(--navy-600)',
                      borderRadius: 99,
                    }}
                  />
                </div>
              </div>
            );
          }

          if (g.type === 'chips') {
            return (
              <div key={g.title} className="fgrp" style={{ opacity: 0.7 }}>
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
                      disabled
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
              <div key={g.title} className="fgrp" style={{ opacity: 0.7 }}>
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
                      disabled
                    >
                      {o.label}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    style={{ height: 28, padding: '0 9px', fontSize: 'var(--text-xs)' }}
                    disabled
                  >
                    <Icon name="Calendar" size={13} /> Custom…
                  </button>
                </div>
              </div>
            );
          }

          // check / radio placeholder groups
          return (
            <div key={g.title} className="fgrp" style={{ opacity: 0.75 }}>
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
                  <label
                    key={o.label}
                    className="fopt"
                    style={{ opacity: o.disabled === false ? 1 : 0.85, cursor: 'not-allowed' }}
                  >
                    {g.type === 'radio' ? <RadioMark on={o.on} /> : <CheckMark on={o.on} />}
                    <span>{o.label}</span>
                    {o.count != null ? <span className="n">{o.count}</span> : null}
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
