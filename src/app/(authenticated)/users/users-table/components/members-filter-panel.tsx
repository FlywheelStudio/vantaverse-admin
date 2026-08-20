'use client';

import { Icon } from '@/components/medvanta';
import { toastUnavailable } from '@/lib/medvanta/unavailable-toast';

type MembersStatusFilter = 'all' | 'pending' | 'invited' | 'active' | 'assigned';
type MembersProgramFilter =
  | 'all'
  | 'on_program'
  | 'completed'
  | 'not_assigned'
  | 'pre_program';
type MembersLastActiveFilter = 'all' | '7d' | '30d' | '90d' | 'never';
type MembersJoinedFilter = 'all' | 'month' | 'quarter' | 'year';

export interface MembersExtraFilters {
  status: MembersStatusFilter;
  program: MembersProgramFilter;
  physiologist: string | null;
  lastActive: MembersLastActiveFilter;
  joined: MembersJoinedFilter;
}

export const DEFAULT_MEMBERS_EXTRA_FILTERS: MembersExtraFilters = {
  status: 'all',
  program: 'all',
  physiologist: null,
  lastActive: 'all',
  joined: 'all',
};

export interface PhysiologistOption {
  label: string;
  count: number;
}

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
  extraFilters: MembersExtraFilters;
  onExtraFiltersChange: (filters: MembersExtraFilters) => void;
  physiologistOptions: PhysiologistOption[];
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

/** A single-select list of options where re-clicking the active one clears back to `allValue`. */
function SingleSelectGroup<T extends string>({
  title,
  hint,
  value,
  allValue,
  options,
  onChange,
  trailing,
}: {
  title: string;
  hint?: string;
  value: T;
  allValue: T;
  options: Array<{ label: string; value: T; count?: number }>;
  onChange: (value: T) => void;
  trailing?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="fgrp">
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="fgrp-t" style={{ margin: 0 }}>
          {title}
        </span>
        {hint ? (
          <span className="sp mut" style={{ fontSize: 10 }}>
            {hint}
          </span>
        ) : null}
      </div>
      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
        {options.map((o) => {
          const on = value === o.value;
          return (
            <label key={o.value} className="fopt">
              <button
                type="button"
                onClick={() => onChange(on ? allValue : o.value)}
                style={{ display: 'contents', cursor: 'pointer' }}
              >
                <CheckMark on={on} />
                <span>{o.label}</span>
                {o.count != null ? <span className="n">{o.count}</span> : null}
              </button>
            </label>
          );
        })}
        {trailing}
      </div>
    </div>
  );
}

/**
 * HTML `filterPanel` chrome for members.
 * Wired: Role chips, Program deadline, Status, Program, Physiologist, Last active, Joined.
 * Role → Physiologist chip remains a placeholder — no such role exists on organization_role.
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
  extraFilters,
  onExtraFiltersChange,
  physiologistOptions,
  onClear,
  onApply,
  groupSlot,
}: MembersFilterPanelProps): React.ReactElement | null {
  if (!open) return null;

  const dueOpts = [
    { label: 'Overdue', value: 'overdue' as const, count: 6 },
    { label: 'Due within 2 working days', value: 'due_soon' as const, count: 5 },
  ];

  return (
    <div
      className="pop"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 340,
        zIndex: 120,
        maxHeight: 'min(80vh, 640px)',
        display: 'flex',
        flexDirection: 'column',
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

      <div className="pop-b" style={{ overflowY: 'auto' }}>
        {groupSlot ? (
          <div className="fgrp">
            <div className="row" style={{ marginBottom: 10 }}>
              <span className="fgrp-t" style={{ margin: 0 }}>
                Group
              </span>
            </div>
            {groupSlot}
          </div>
        ) : null}

        <div className="fgrp">
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="fgrp-t" style={{ margin: 0 }}>
              Role
            </span>
          </div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {(
              [
                { label: 'Member', value: 'patient' as const, count: memberCount },
                { label: 'Admin', value: 'admin' as const, count: adminCount },
              ] as const
            ).map((c) => {
              const on = role === c.value;
              return (
                <button
                  key={c.label}
                  type="button"
                  className={`btn btn-sm ${on ? 'btn-pri' : 'btn-sec'}`}
                  style={{ height: 28, padding: '0 11px', fontSize: 'var(--text-xs)' }}
                  onClick={() => onRoleChange(on ? null : c.value)}
                >
                  {on ? <Icon name="Check" size={13} /> : null}
                  {c.label}
                  <span style={{ opacity: 0.6, marginLeft: 2 }} className="mono">
                    {c.count}
                  </span>
                </button>
              );
            })}
            <button
              type="button"
              className="btn btn-sm btn-sec"
              style={{ height: 28, padding: '0 11px', fontSize: 'var(--text-xs)' }}
              onClick={() => toastUnavailable('Physiologist role filter')}
            >
              Physiologist
            </button>
          </div>
        </div>

        <SingleSelectGroup
          title="Status"
          value={extraFilters.status}
          allValue="all"
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Invited', value: 'invited' },
            { label: 'Active', value: 'active' },
            { label: 'Assigned', value: 'assigned' },
          ]}
          onChange={(status) => onExtraFiltersChange({ ...extraFilters, status })}
        />

        <div className="fgrp">
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="fgrp-t" style={{ margin: 0 }}>
              Program deadline
            </span>
            <span className="sp mut" style={{ fontSize: 10 }}>
              5 working days from consultation
            </span>
          </div>
          <div>
            {dueOpts.map((o) => {
              const on = dueFilter === o.value;
              return (
                <label key={o.label} className="fopt">
                  <button
                    type="button"
                    onClick={() => onDueFilterChange(on ? 'all' : o.value)}
                    style={{ display: 'contents', cursor: 'pointer' }}
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

        <SingleSelectGroup
          title="Program"
          value={extraFilters.program}
          allValue="all"
          options={[
            { label: 'On a program', value: 'on_program' },
            { label: 'Completed a program', value: 'completed' },
            { label: 'Pre-program only', value: 'pre_program' },
            { label: 'Not assigned', value: 'not_assigned' },
          ]}
          onChange={(program) => onExtraFiltersChange({ ...extraFilters, program })}
        />

        <div className="fgrp">
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="fgrp-t" style={{ margin: 0 }}>
              Physiologist
            </span>
          </div>
          <div>
            {physiologistOptions.length === 0 ? (
              <span className="mut" style={{ fontSize: 'var(--text-sm)' }}>
                No physiologists assigned yet
              </span>
            ) : (
              physiologistOptions.map((o) => {
                const on = extraFilters.physiologist === o.label;
                return (
                  <label key={o.label} className="fopt">
                    <button
                      type="button"
                      onClick={() =>
                        onExtraFiltersChange({
                          ...extraFilters,
                          physiologist: on ? null : o.label,
                        })
                      }
                      style={{ display: 'contents', cursor: 'pointer' }}
                    >
                      <CheckMark on={on} />
                      <span>{o.label}</span>
                      <span className="n">{o.count}</span>
                    </button>
                  </label>
                );
              })
            )}
          </div>
        </div>

        <SingleSelectGroup
          title="Last active"
          value={extraFilters.lastActive}
          allValue="all"
          options={[
            { label: '7 days', value: '7d' },
            { label: '30 days', value: '30d' },
            { label: '90 days', value: '90d' },
            { label: 'Never', value: 'never' },
          ]}
          onChange={(lastActive) => onExtraFiltersChange({ ...extraFilters, lastActive })}
          trailing={
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ height: 28, padding: '0 9px', fontSize: 'var(--text-xs)' }}
              onClick={() => toastUnavailable('Last active: Custom date')}
            >
              <Icon name="Calendar" size={13} /> Custom…
            </button>
          }
        />

        <SingleSelectGroup
          title="Joined"
          value={extraFilters.joined}
          allValue="all"
          options={[
            { label: 'This month', value: 'month' },
            { label: 'This quarter', value: 'quarter' },
            { label: 'This year', value: 'year' },
          ]}
          onChange={(joined) => onExtraFiltersChange({ ...extraFilters, joined })}
          trailing={
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              style={{ height: 28, padding: '0 9px', fontSize: 'var(--text-xs)' }}
              onClick={() => toastUnavailable('Joined: Custom date')}
            >
              <Icon name="Calendar" size={13} /> Custom…
            </button>
          }
        />
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
