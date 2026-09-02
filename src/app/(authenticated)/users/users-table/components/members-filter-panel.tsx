'use client';

import { Icon } from '@/components/medvanta';

type MembersStatusFilter = 'all' | 'pending' | 'invited' | 'active' | 'assigned';
type MembersProgramFilter =
  | 'all'
  | 'on_program'
  | 'completed'
  | 'not_assigned'
  | 'pre_program';
type MembersLastActiveFilter = 'all' | '7d' | '30d' | '90d' | 'never';
type MembersJoinedFilter = 'all' | 'month' | 'quarter' | 'year';
type MembersDueFilter = 'all' | 'due' | 'overdue';

/** Full facet state applied server-side through `list_profiles_filtered`. */
export interface MembersFilters {
  organization_id?: string;
  team_id?: string;
  status: MembersStatusFilter;
  program: MembersProgramFilter;
  physiologist: string | null;
  lastActive: MembersLastActiveFilter;
  joined: MembersJoinedFilter;
  due: MembersDueFilter;
}

export const DEFAULT_MEMBERS_FILTERS: MembersFilters = {
  status: 'all',
  program: 'all',
  physiologist: null,
  lastActive: 'all',
  joined: 'all',
  due: 'all',
};

export function countActiveFilters(filters: MembersFilters): number {
  let count = 0;
  if (filters.organization_id) count += 1;
  if (filters.team_id) count += 1;
  if (filters.status !== 'all') count += 1;
  if (filters.program !== 'all') count += 1;
  if (filters.physiologist) count += 1;
  if (filters.lastActive !== 'all') count += 1;
  if (filters.joined !== 'all') count += 1;
  if (filters.due !== 'all') count += 1;
  return count;
}

/** Remove one pill (by id) from an applied filter state. */
export function removeMembersFilter(state: MembersFilters, id: string): MembersFilters {
  switch (id) {
    case 'org':
      return { ...state, organization_id: undefined, team_id: undefined };
    case 'team':
      return { ...state, team_id: undefined };
    case 'status':
      return { ...state, status: 'all' };
    case 'program':
      return { ...state, program: 'all' };
    case 'physiologist':
      return { ...state, physiologist: null };
    case 'lastActive':
      return { ...state, lastActive: 'all' };
    case 'joined':
      return { ...state, joined: 'all' };
    case 'due':
      return { ...state, due: 'all' };
    default:
      return state;
  }
}

interface MembersFilterPanelProps {
  open: boolean;
  onClose: () => void;
  activeCount: number;
  /** Staged filter state shown inside the panel. */
  filters: MembersFilters;
  onChange: (next: MembersFilters) => void;
  physiologistOptions: Array<{ name: string; count: number }>;
  unassignedPhysiologist?: number;
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
}: {
  title: string;
  hint?: string;
  value: T;
  allValue: T;
  options: Array<{ label: string; value: T; count?: number }>;
  onChange: (value: T) => void;
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
      </div>
    </div>
  );
}

/**
 * HTML `filterPanel` chrome for members.
 * Wired: Group (org/team slot), Program deadline, Status, Program, Physiologist, Last active, Joined.
 */
export function MembersFilterPanel({
  open,
  onClose,
  activeCount,
  filters,
  onChange,
  physiologistOptions,
  unassignedPhysiologist,
  onClear,
  onApply,
  groupSlot,
}: MembersFilterPanelProps): React.ReactElement | null {
  if (!open) return null;

  const physioOpts = [
    ...physiologistOptions.map((o) => ({ label: o.name, value: o.name, count: o.count })),
    ...(unassignedPhysiologist && unassignedPhysiologist > 0
      ? [{ label: 'Unassigned', value: 'Unassigned', count: unassignedPhysiologist }]
      : []),
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

        <SingleSelectGroup
          title="Status"
          value={filters.status}
          allValue="all"
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Invited', value: 'invited' },
            { label: 'Active', value: 'active' },
            { label: 'Assigned', value: 'assigned' },
          ]}
          onChange={(status) => onChange({ ...filters, status })}
        />

        <SingleSelectGroup
          title="Program deadline"
          hint="5 working days from consultation"
          value={filters.due}
          allValue="all"
          options={[
            { label: 'Overdue', value: 'overdue' },
            { label: 'Due later', value: 'due' },
          ]}
          onChange={(due) => onChange({ ...filters, due })}
        />

        <SingleSelectGroup
          title="Program"
          value={filters.program}
          allValue="all"
          options={[
            { label: 'On a program', value: 'on_program' },
            { label: 'Completed a program', value: 'completed' },
            { label: 'Pre-program only', value: 'pre_program' },
            { label: 'Not assigned', value: 'not_assigned' },
          ]}
          onChange={(program) => onChange({ ...filters, program })}
        />

        <SingleSelectGroup
          title="Physiologist"
          value={filters.physiologist ?? ('all' as string)}
          allValue={'all' as string}
          options={
            physioOpts.length > 0
              ? physioOpts
              : [{ label: 'No physiologists assigned yet', value: 'none' }]
          }
          onChange={(value) =>
            onChange({ ...filters, physiologist: value === 'all' ? null : value })
          }
        />

        <SingleSelectGroup
          title="Last active"
          value={filters.lastActive}
          allValue="all"
          options={[
            { label: '7 days', value: '7d' },
            { label: '30 days', value: '30d' },
            { label: '90 days', value: '90d' },
            { label: 'Never', value: 'never' },
          ]}
          onChange={(lastActive) => onChange({ ...filters, lastActive })}
        />

        <SingleSelectGroup
          title="Joined"
          value={filters.joined}
          allValue="all"
          options={[
            { label: 'This month', value: 'month' },
            { label: 'This quarter', value: 'quarter' },
            { label: 'This year', value: 'year' },
          ]}
          onChange={(joined) => onChange({ ...filters, joined })}
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
