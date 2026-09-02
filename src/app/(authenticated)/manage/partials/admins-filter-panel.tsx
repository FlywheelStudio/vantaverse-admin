'use client';

import { Icon } from '@/components/medvanta';

type AdminStatusFilter = 'all' | 'pending' | 'invited' | 'active';
type AdminLastActiveFilter = 'all' | '7d' | '30d' | '90d' | 'never';
type AdminJoinedFilter = 'all' | 'month' | 'quarter' | 'year';

export interface AdminsFilters {
  status: AdminStatusFilter;
  lastActive: AdminLastActiveFilter;
  joined: AdminJoinedFilter;
}

export const DEFAULT_ADMINS_FILTERS: AdminsFilters = {
  status: 'all',
  lastActive: 'all',
  joined: 'all',
};

export function countAdminsActiveFilters(filters: AdminsFilters): number {
  let count = 0;
  if (filters.status !== 'all') count += 1;
  if (filters.lastActive !== 'all') count += 1;
  if (filters.joined !== 'all') count += 1;
  return count;
}

export function removeAdminsFilter(state: AdminsFilters, id: string): AdminsFilters {
  if (id === 'status') return { ...state, status: 'all' };
  if (id === 'lastActive') return { ...state, lastActive: 'all' };
  if (id === 'joined') return { ...state, joined: 'all' };
  return state;
}

interface AdminsFilterPanelProps {
  open: boolean;
  onClose: () => void;
  activeCount: number;
  filters: AdminsFilters;
  onChange: (next: AdminsFilters) => void;
  onClear: () => void;
  onApply: () => void;
}

function CheckMark({ on }: { on?: boolean }): React.ReactElement {
  return (
    <span className={`cb${on ? ' on' : ''}`}>
      {on ? <Icon name="Check" size={13} style={{ strokeWidth: 3 }} /> : null}
    </span>
  );
}

function SingleSelectGroup<T extends string>({
  title,
  value,
  allValue,
  options,
  onChange,
}: {
  title: string;
  value: T;
  allValue: T;
  options: Array<{ label: string; value: T }>;
  onChange: (value: T) => void;
}): React.ReactElement {
  return (
    <div className="fgrp">
      <div className="row" style={{ marginBottom: 10 }}>
        <span className="fgrp-t" style={{ margin: 0 }}>{title}</span>
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
              </button>
            </label>
          );
        })}
      </div>
    </div>
  );
}

/** Filter panel chrome for the Manage page admins table. */
export function AdminsFilterPanel({
  open,
  onClose,
  activeCount,
  filters,
  onChange,
  onClear,
  onApply,
}: AdminsFilterPanelProps): React.ReactElement | null {
  if (!open) return null;

  return (
    <div
      className="pop"
      style={{
        position: 'absolute',
        top: 'calc(100% + 8px)',
        right: 0,
        width: 320,
        zIndex: 120,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div className="pop-h">
        <Icon name="Funnel" size={16} style={{ color: 'var(--navy-600)' }} />
        <span style={{ fontSize: 'var(--text-md)', fontWeight: 'var(--fw-bold)' }}>
          Filter admins
        </span>
        {activeCount > 0 ? <span className="bdg bdg-b">{activeCount} active</span> : null}
        <span className="sp">
          <button type="button" className="ib ib-sm" aria-label="Close" onClick={onClose}>
            <Icon name="X" size={17} />
          </button>
        </span>
      </div>

      <div className="pop-b" style={{ overflowY: 'auto' }}>
        <SingleSelectGroup
          title="Status"
          value={filters.status}
          allValue="all"
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Invited', value: 'invited' },
            { label: 'Active', value: 'active' },
          ]}
          onChange={(status) => onChange({ ...filters, status })}
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
