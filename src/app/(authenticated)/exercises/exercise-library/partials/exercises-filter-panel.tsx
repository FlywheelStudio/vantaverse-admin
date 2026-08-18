'use client';

import { Icon } from '@/components/medvanta';
import { toastUnavailable } from '@/lib/medvanta/unavailable-toast';

export type AssignmentFilter = 'all' | 'unassigned' | 'assigned';

interface TypeOption {
  value: string;
  label: string;
  count: number;
}

interface TagFilterGroup {
  id: string;
  title: string;
  type?: 'check' | 'chips';
  opts: Array<{ label: string; count?: number }>;
}

/** HTML `FILTERS.exercises` tag groups that lack library tag data in RPCs. */
const EXERCISE_TAG_FILTER_GROUPS: TagFilterGroup[] = [
  {
    id: 'equipment',
    title: 'Equipment',
    opts: [
      { label: 'No equipment', count: 88 },
      { label: 'Dumbbell', count: 41 },
      { label: 'Resistance band', count: 33 },
      { label: 'Mat', count: 62 },
      { label: 'Foam roller', count: 19 },
      { label: 'Bench', count: 12 },
      { label: 'Kettlebell', count: 9 },
      { label: 'Cable machine', count: 14 },
      { label: 'Step or box', count: 11 },
    ],
  },
  {
    id: 'body_region',
    title: 'Body region',
    type: 'chips',
    opts: [
      { label: 'Upper body', count: 96 },
      { label: 'Lower body', count: 104 },
      { label: 'Core', count: 71 },
      { label: 'Full body', count: 28 },
    ],
  },
  {
    id: 'category',
    title: 'Category',
    type: 'chips',
    opts: [
      { label: 'Mobility', count: 92 },
      { label: 'Strength', count: 78 },
      { label: 'Core', count: 41 },
      { label: 'Balance', count: 37 },
    ],
  },
  {
    id: 'muscle_group',
    title: 'Muscle group',
    opts: [
      { label: 'Lumbar spine', count: 44 },
      { label: 'Thoracic spine', count: 31 },
      { label: 'Glutes', count: 37 },
      { label: 'Hamstrings', count: 29 },
      { label: 'Quadriceps', count: 26 },
      { label: 'Rotator cuff', count: 22 },
      { label: 'Deltoids', count: 18 },
      { label: 'Obliques', count: 18 },
      { label: 'Calves', count: 12 },
    ],
  },
];

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
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
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
  selectedTags,
  onTagToggle,
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

  const handleTagClick = (tag: string): void => {
    if (!selectedTags.includes(tag)) {
      toastUnavailable(`Filtering by “${tag}”`);
    }
    onTagToggle(tag);
  };

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

        {EXERCISE_TAG_FILTER_GROUPS.map((group) => (
          <div key={group.id} className="fgrp">
            <div className="row" style={{ marginBottom: 10 }}>
              <span className="fgrp-t" style={{ margin: 0 }}>
                {group.title}
              </span>
            </div>
            {group.type === 'chips' ? (
              <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                {group.opts.map((o) => {
                  const on = selectedTags.includes(o.label);
                  return (
                    <button
                      key={o.label}
                      type="button"
                      className={`btn btn-sm ${on ? 'btn-pri' : 'btn-sec'}`}
                      style={{
                        height: 28,
                        padding: '0 11px',
                        fontSize: 'var(--text-xs)',
                      }}
                      onClick={() => handleTagClick(o.label)}
                    >
                      {on ? <Icon name="Check" size={13} /> : null}
                      {o.label}
                      {o.count != null ? (
                        <span style={{ opacity: 0.6, marginLeft: 2 }} className="mono">
                          {o.count}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            ) : (
              <div>
                {group.opts.map((o) => {
                  const on = selectedTags.includes(o.label);
                  return (
                    <label key={o.label} className="fopt">
                      <button
                        type="button"
                        onClick={() => handleTagClick(o.label)}
                        style={{ display: 'contents', cursor: 'pointer' }}
                      >
                        <CheckMark on={on} />
                        <span>{o.label}</span>
                        {o.count != null ? (
                          <span className="n">{o.count}</span>
                        ) : null}
                      </button>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        ))}
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
