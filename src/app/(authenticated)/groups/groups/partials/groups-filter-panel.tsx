'use client';

import { Icon } from '@/components/medvanta';
import { toastUnavailable } from '@/lib/medvanta/unavailable-toast';

type GroupsCreatedFilter =
  | 'any'
  | '30d'
  | 'quarter'
  | 'year';

type GroupsProgramsChip = 'none' | '1-2' | '3+';

export interface GroupsFilterState {
  physiologistNames: string[];
  membersMin: number;
  membersMax: number;
  programsChips: GroupsProgramsChip[];
  created: GroupsCreatedFilter;
}

export const DEFAULT_GROUPS_FILTERS: GroupsFilterState = {
  physiologistNames: [],
  membersMin: 0,
  membersMax: 50,
  programsChips: [],
  created: 'any',
};

interface PhysiologistOption {
  label: string;
  count: number;
}

interface GroupsFilterPanelProps {
  open: boolean;
  onClose: () => void;
  activeCount: number;
  physiologistOptions: PhysiologistOption[];
  filters: GroupsFilterState;
  onChange: (next: GroupsFilterState) => void;
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
 * HTML `FILTERS.groups` chrome.
 * Wired: Physiologist (from org admins), Members range, Created.
 * Placeholder (toast): Active programs, Avg. completion, Scheduling.
 */
export function GroupsFilterPanel({
  open,
  onClose,
  activeCount,
  physiologistOptions,
  filters,
  onChange,
  onClear,
  onApply,
}: GroupsFilterPanelProps): React.ReactElement | null {
  if (!open) return null;

  const handlePhysioToggle = (label: string): void => {
    const on = filters.physiologistNames.includes(label);
    onChange({
      ...filters,
      physiologistNames: on
        ? filters.physiologistNames.filter((n) => n !== label)
        : [...filters.physiologistNames, label],
    });
  };

  const handleProgramsChip = (chip: GroupsProgramsChip): void => {
    toastUnavailable('Filtering by active programs');
    const on = filters.programsChips.includes(chip);
    onChange({
      ...filters,
      programsChips: on
        ? filters.programsChips.filter((c) => c !== chip)
        : [...filters.programsChips, chip],
    });
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
          Filter groups
        </span>
        {activeCount > 0 ? <span className="bdg bdg-b">{activeCount} active</span> : null}
        <span className="sp">
          <button type="button" className="ib ib-sm" aria-label="Close" onClick={onClose}>
            <Icon name="X" size={17} />
          </button>
        </span>
      </div>

      <div className="pop-b" style={{ overflowY: 'auto' }}>
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
                const on = filters.physiologistNames.includes(o.label);
                return (
                  <label key={o.label} className="fopt">
                    <button
                      type="button"
                      onClick={() => handlePhysioToggle(o.label)}
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

        <div className="fgrp">
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="fgrp-t" style={{ margin: 0 }}>
              Members
            </span>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <span className="fld fld-sm" style={{ flex: 1, padding: '0 10px', gap: 4 }}>
              <input
                className="mono"
                style={{ textAlign: 'center', fontSize: 'var(--text-sm)' }}
                type="number"
                min={0}
                max={filters.membersMax}
                value={filters.membersMin}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    membersMin: Math.max(0, Number(e.target.value) || 0),
                  })
                }
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
                type="number"
                min={filters.membersMin}
                max={200}
                value={filters.membersMax}
                onChange={(e) =>
                  onChange({
                    ...filters,
                    membersMax: Math.max(
                      filters.membersMin,
                      Number(e.target.value) || 0,
                    ),
                  })
                }
              />
              <span className="mut" style={{ fontSize: 10 }}>
                max
              </span>
            </span>
            <span className="mut" style={{ fontSize: 'var(--text-xs)', whiteSpace: 'nowrap' }}>
              people
            </span>
          </div>
        </div>

        <div className="fgrp">
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="fgrp-t" style={{ margin: 0 }}>
              Active programs
            </span>
            <span className="sp mut" style={{ fontSize: 10 }}>
              No program counts yet
            </span>
          </div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {(
              [
                { label: 'None', value: 'none' as const },
                { label: '1 to 2', value: '1-2' as const },
                { label: '3 or more', value: '3+' as const },
              ] as const
            ).map((c) => {
              const on = filters.programsChips.includes(c.value);
              return (
                <button
                  key={c.value}
                  type="button"
                  className={`btn btn-sm ${on ? 'btn-pri' : 'btn-sec'}`}
                  style={{ height: 28, padding: '0 11px', fontSize: 'var(--text-xs)' }}
                  onClick={() => handleProgramsChip(c.value)}
                >
                  {on ? <Icon name="Check" size={13} /> : null}
                  {c.label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="fgrp" style={{ opacity: 0.85 }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="fgrp-t" style={{ margin: 0 }}>
              Avg. completion
            </span>
          </div>
          <button
            type="button"
            className="btn btn-sec btn-sm"
            style={{ width: '100%' }}
            onClick={() => toastUnavailable('Avg. completion filter')}
          >
            0% – 100% · not wired
          </button>
        </div>

        <div className="fgrp" style={{ opacity: 0.85 }}>
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="fgrp-t" style={{ margin: 0 }}>
              Scheduling
            </span>
          </div>
          <div>
            {['Screening link set', 'No screening link', 'Appointments this week'].map(
              (label) => (
                <label key={label} className="fopt">
                  <button
                    type="button"
                    onClick={() => toastUnavailable(label)}
                    style={{ display: 'contents', cursor: 'pointer' }}
                  >
                    <CheckMark />
                    <span>{label}</span>
                  </button>
                </label>
              ),
            )}
          </div>
        </div>

        <div className="fgrp">
          <div className="row" style={{ marginBottom: 10 }}>
            <span className="fgrp-t" style={{ margin: 0 }}>
              Created
            </span>
          </div>
          <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
            {(
              [
                { label: 'Any time', value: 'any' as const },
                { label: '30 days', value: '30d' as const },
                { label: 'This quarter', value: 'quarter' as const },
              ] as const
            ).map((o) => (
              <button
                key={o.value}
                type="button"
                className={`btn btn-sm ${filters.created === o.value ? 'btn-pri' : 'btn-sec'}`}
                style={{ height: 28, padding: '0 11px', fontSize: 'var(--text-xs)' }}
                onClick={() => onChange({ ...filters, created: o.value })}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>
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
