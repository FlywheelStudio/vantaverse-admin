'use client';

import { Icon, UnderConstruction } from '@/components/medvanta';

export type AssignmentFilter = 'all' | 'unassigned' | 'assigned';

interface TypeOption {
  value: string;
  label: string;
  count: number;
}

interface ExercisesFilterPanelProps {
  open: boolean;
  onClose: () => void;
  activeCount: number;
  assignmentFilter: AssignmentFilter;
  onAssignmentFilterChange: (value: AssignmentFilter) => void;
  assignmentCounts: { all: number; unassigned: number; assigned: number };
  typeFilter: string;
  onTypeFilterChange: (value: string) => void;
  typeOptions: TypeOption[];
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

/**
 * HTML `filterPanel` chrome for exercises — Assignment + Source wired;
 * tag groups shown with toast when selected (no tag fields on Exercise RPC).
 */
export function ExercisesFilterPanel({
  open,
  onClose,
  activeCount,
  assignmentFilter,
  onAssignmentFilterChange,
  assignmentCounts,
  typeFilter,
  onTypeFilterChange,
  typeOptions,
  onClear,
  onApply,
}: ExercisesFilterPanelProps): React.ReactElement | null {
  if (!open) return null;

  const assignmentOpts: Array<{
    label: string;
    value: AssignmentFilter;
    count: number;
  }> = [
    { label: 'All', value: 'all', count: assignmentCounts.all },
    { label: 'Unassigned', value: 'unassigned', count: assignmentCounts.unassigned },
    { label: 'Assigned', value: 'assigned', count: assignmentCounts.assigned },
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
        maxHeight: 'min(70vh, 560px)',
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
          Filter exercises
        </span>
        {activeCount > 0 ? (
          <span className="bdg bdg-b">{activeCount} active</span>
        ) : null}
        <span className="sp">
          <button
            type="button"
            className="ib ib-sm"
            aria-label="Close"
            onClick={onClose}
          >
            <Icon name="X" size={17} />
          </button>
        </span>
      </div>

      <div className="pop-b" style={{ overflowY: 'auto' }}>
        <div className="fgrp">
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="fgrp-t" style={{ margin: 0 }}>
              Assignment
            </span>
          </div>
          <div>
            {assignmentOpts.map((o) => {
              const on = assignmentFilter === o.value;
              return (
                <label key={o.value} className="fopt">
                  <button
                    type="button"
                    onClick={() => onAssignmentFilterChange(o.value)}
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

        <div className="fgrp">
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="fgrp-t" style={{ margin: 0 }}>
              Source
            </span>
          </div>
          <div>
            <label className="fopt">
              <button
                type="button"
                onClick={() => onTypeFilterChange('all')}
                style={{ display: 'contents', cursor: 'pointer' }}
              >
                <CheckMark on={typeFilter === 'all'} />
                <span>All sources</span>
                <span className="n">{assignmentCounts.all}</span>
              </button>
            </label>
            {typeOptions.map((o) => {
              const on = typeFilter === o.value;
              return (
                <label key={o.value} className="fopt">
                  <button
                    type="button"
                    onClick={() =>
                      onTypeFilterChange(on ? 'all' : o.value)
                    }
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

        <div className="fgrp">
          <div className="row" style={{ marginBottom: 4 }}>
            <span className="fgrp-t" style={{ margin: 0 }}>
              Tags
            </span>
          </div>
          <UnderConstruction compact />
        </div>
      </div>

      <div className="pop-f">
        <button type="button" className="btn btn-ghost btn-sm" onClick={onClear}>
          Clear
        </button>
        <span className="sp" />
        <button type="button" className="btn btn-pri btn-sm" onClick={onApply}>
          Apply
        </button>
      </div>
    </div>
  );
}
