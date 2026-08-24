'use client';

import { useState, useMemo } from 'react';
import { Icon } from '@/components/medvanta';
import { useAllTags } from '@/hooks/use-tags';
import type { Tag } from '@/lib/supabase/schemas/tags';

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
  selectedTagIds: number[];
  onSelectedTagIdsChange: (tagIds: number[]) => void;
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
  selectedTagIds,
  onSelectedTagIdsChange,
  onClear,
  onApply,
}: ExercisesFilterPanelProps): React.ReactElement | null {
  const { data: allTags = [], isLoading: isLoadingTags } = useAllTags();
  const [categorySearches, setCategorySearches] = useState<Record<string, string>>({});

  const tagsByCategory = useMemo(() => {
    const map = new Map<string, Tag[]>();
    for (const tag of allTags) {
      if (!tag.category || tag.name.toLowerCase() === 'empty') continue;
      const list = map.get(tag.category) ?? [];
      list.push(tag);
      map.set(tag.category, list);
    }
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [allTags]);

  if (!open) return null;

  const handleCategorySearchChange = (cat: string, value: string): void => {
    setCategorySearches((prev) => ({
      ...prev,
      [cat]: value,
    }));
  };

  const toggleTag = (tagId: number): void => {
    if (selectedTagIds.includes(tagId)) {
      onSelectedTagIdsChange(selectedTagIds.filter((id) => id !== tagId));
    } else {
      onSelectedTagIdsChange([...selectedTagIds, tagId]);
    }
  };

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
        width: 360,
        zIndex: 120,
        maxHeight: 'min(80vh, 680px)',
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

      <div className="pop-b" style={{ overflowY: 'auto', padding: '12px 16px' }}>
        {/* Assignment Filter */}
        <div className="fgrp" style={{ marginBottom: 14 }}>
          <div className="row" style={{ marginBottom: 6 }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 'var(--fw-bold)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
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

        {/* Source / Type Filter */}
        <div className="fgrp" style={{ marginBottom: 14 }}>
          <div className="row" style={{ marginBottom: 6 }}>
            <span
              style={{
                fontSize: '11px',
                fontWeight: 'var(--fw-bold)',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--text-muted)',
              }}
            >
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

        {/* Tag Categories: Each category in its own block with search input + scrollable list */}
        {isLoadingTags ? (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: '6px 0' }}>
            Loading tag categories…
          </div>
        ) : tagsByCategory.length === 0 ? (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: '6px 0' }}>
            No tags available.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {tagsByCategory.map(([category, tags]) => {
              const filterTerm = (categorySearches[category] ?? '').trim().toLowerCase();
              const filteredTags = filterTerm
                ? tags.filter((t) => t.name.toLowerCase().includes(filterTerm))
                : tags;

              return (
                <div key={category} className="fgrp" style={{ borderBottom: 'none', paddingBottom: 0 }}>
                  <div className="row" style={{ marginBottom: 6 }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontWeight: 'var(--fw-bold)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                        color: 'var(--text-muted)',
                      }}
                    >
                      {category}
                    </span>
                  </div>

                  {/* Find input */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '6px 10px',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-pill)',
                      background: 'var(--surface-card, #ffffff)',
                      marginBottom: 8,
                    }}
                  >
                    <Icon name="Search" size={14} style={{ color: 'var(--text-muted)', flex: '0 0 auto' }} />
                    <input
                      type="text"
                      placeholder={`Find a ${category.toLowerCase()}…`}
                      value={categorySearches[category] ?? ''}
                      onChange={(e) => handleCategorySearchChange(category, e.target.value)}
                      style={{
                        border: 'none',
                        outline: 'none',
                        background: 'transparent',
                        fontSize: 'var(--text-xs)',
                        color: 'var(--text-body)',
                        width: '100%',
                      }}
                    />
                    {categorySearches[category] ? (
                      <button
                        type="button"
                        onClick={() => handleCategorySearchChange(category, '')}
                        style={{
                          border: 'none',
                          background: 'transparent',
                          cursor: 'pointer',
                          padding: 0,
                          color: 'var(--text-muted)',
                          display: 'flex',
                          alignItems: 'center',
                        }}
                      >
                        <Icon name="X" size={13} />
                      </button>
                    ) : null}
                  </div>

                  {/* Scrollable list */}
                  <div
                    style={{
                      maxHeight: 140,
                      overflowY: 'auto',
                      display: 'flex',
                      flexDirection: 'column',
                      paddingRight: 4,
                    }}
                  >
                    {filteredTags.length === 0 ? (
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-muted)', padding: '4px 0' }}>
                        No results found.
                      </div>
                    ) : (
                      filteredTags.map((tag) => {
                        const on = selectedTagIds.includes(tag.id);
                        return (
                          <label
                            key={tag.id}
                            className="fopt"
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '5px 0',
                            }}
                          >
                            <button
                              type="button"
                              onClick={() => toggleTag(tag.id)}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                cursor: 'pointer',
                                background: 'transparent',
                                border: 'none',
                                width: '100%',
                                textAlign: 'left',
                                padding: 0,
                              }}
                            >
                              <CheckMark on={on} />
                              <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-strong)' }}>
                                {tag.name}
                              </span>
                            </button>
                          </label>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
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
