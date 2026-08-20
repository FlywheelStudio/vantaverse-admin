'use client';

import { useState, useMemo, useCallback } from 'react';
import { Icon } from '@/components/medvanta';
import { useExercises } from '@/hooks/use-exercises';
import { ExerciseCard } from './partials/exercise-card';
import { ExerciseModal } from './partials/exercise-modal';
import { HtmlSearchField } from '@/app/(authenticated)/groups/partials/html-search-field';
import { useDebounce } from '@/hooks/use-debounce';
import type { Exercise } from '@/lib/supabase/schemas/exercises';
import { toastUnavailable } from '@/lib/medvanta/unavailable-toast';
import {
  ExercisesFilterPanel,
  type AssignmentFilter,
} from './partials/exercises-filter-panel';

function formatTypeLabel(type: string): string {
  return type
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface ExerciseLibraryProps {
  initialExercises?: Exercise[];
}

export function ExerciseLibrary({ initialExercises }: ExerciseLibraryProps): React.ReactElement {
  const { data: exercises, isLoading } = useExercises(initialExercises);
  const [searchValue, setSearchValue] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(16);
  const pageSize = 16;

  const handleSearchChange = useCallback((): void => {
    setVisibleCount(pageSize);
  }, []);

  const debouncedSearch = useDebounce(searchValue, 300, handleSearchChange);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const allExercises = useMemo(
    () => exercises ?? [],
    [exercises],
  );

  const assignmentCounts = useMemo(() => {
    let unassigned = 0;
    let assigned = 0;
    for (const exercise of allExercises) {
      if ((exercise.assigned_count ?? 0) > 0) assigned += 1;
      else unassigned += 1;
    }
    return { all: allExercises.length, unassigned, assigned };
  }, [allExercises]);

  const typeOptions = useMemo(() => {
    const counts = new Map<string, number>();
    for (const exercise of allExercises) {
      const key = (exercise.type ?? '').trim();
      if (!key) continue;
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([value, count]) => ({
        value,
        label: formatTypeLabel(value),
        count,
      }));
  }, [allExercises]);

  const filteredExercises = useMemo(() => {
    return allExercises.filter((exercise) => {
      if (debouncedSearch) {
        const matchesSearch = exercise.exercise_name
          .toLowerCase()
          .includes(debouncedSearch.toLowerCase());
        if (!matchesSearch) return false;
      }

      if (typeFilter !== 'all' && exercise.type !== typeFilter) {
        return false;
      }

      const assignedCount = exercise.assigned_count ?? 0;
      if (assignmentFilter === 'unassigned') return assignedCount === 0;
      if (assignmentFilter === 'assigned') return assignedCount > 0;

      return true;
    });
  }, [allExercises, debouncedSearch, typeFilter, assignmentFilter]);

  const visibleExercises = filteredExercises.slice(0, visibleCount);
  const totalCount = filteredExercises.length;
  const hasMore = visibleCount < totalCount;

  const activeFilterTags = useMemo(() => {
    const tags: string[] = [];
    if (assignmentFilter !== 'all') {
      tags.push(assignmentFilter === 'unassigned' ? 'Unassigned' : 'Assigned');
    }
    if (typeFilter !== 'all') tags.push(formatTypeLabel(typeFilter));
    if (debouncedSearch.trim()) tags.push(`"${debouncedSearch.trim()}"`);
    return tags;
  }, [assignmentFilter, typeFilter, debouncedSearch]);

  const panelActiveCount = useMemo(() => {
    let count = 0;
    if (assignmentFilter !== 'all') count += 1;
    if (typeFilter !== 'all') count += 1;
    return count;
  }, [assignmentFilter, typeFilter]);

  const handleClearFilters = (): void => {
    setAssignmentFilter('all');
    setTypeFilter('all');
    setVisibleCount(pageSize);
  };

  const handleCardClick = (exercise: Exercise): void => {
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const handleModalClose = (open: boolean): void => {
    setIsModalOpen(open);
    if (!open) setSelectedExercise(null);
  };

  return (
    <>
      <div className="tbar">
        <HtmlSearchField
          placeholder="Search exercises…"
          value={searchValue}
          onChange={setSearchValue}
        />
        <div style={{ position: 'relative', flex: '0 0 auto' }}>
          <button
            type="button"
            className={`btn btn-sec btn-sm${filtersOpen ? ' btn-pri' : ''}`}
            onClick={() => setFiltersOpen((open) => !open)}
          >
            <Icon name="Funnel" size={15} />
            Filters
            {panelActiveCount > 0 ? (
              <span className="bdg bdg-b">{panelActiveCount}</span>
            ) : null}
          </button>
          <ExercisesFilterPanel
            open={filtersOpen}
            onClose={() => setFiltersOpen(false)}
            activeCount={panelActiveCount}
            assignmentFilter={assignmentFilter}
            onAssignmentFilterChange={(value) => {
              setAssignmentFilter(value);
              setVisibleCount(pageSize);
            }}
            assignmentCounts={assignmentCounts}
            typeFilter={typeFilter}
            onTypeFilterChange={(value) => {
              setTypeFilter(value);
              setVisibleCount(pageSize);
            }}
            typeOptions={typeOptions}
            onClear={handleClearFilters}
            onApply={() => setFiltersOpen(false)}
          />
        </div>
        <span className="sp seg">
          <button type="button" className="on" aria-label="Grid view">
            <Icon name="LayoutGrid" size={16} />
          </button>
          <button
            type="button"
            aria-label="List view"
            onClick={() => toastUnavailable('List view')}
          >
            <Icon name="List" size={16} />
          </button>
        </span>
      </div>

      {activeFilterTags.length > 0 ? (
        <div className="row" style={{ gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {activeFilterTags.map((tag) => (
            <span key={tag} className="tag tag-b">
              {tag}
              <button
                type="button"
                aria-label={`Remove ${tag}`}
                onClick={() => {
                  if (tag === 'Unassigned' || tag === 'Assigned') {
                    setAssignmentFilter('all');
                  } else if (tag.startsWith('"')) {
                    setSearchValue('');
                  } else {
                    setTypeFilter('all');
                  }
                  setVisibleCount(pageSize);
                }}
              >
                <Icon name="X" size={13} style={{ strokeWidth: 2.5 }} />
              </button>
            </span>
          ))}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearchValue('');
              handleClearFilters();
            }}
          >
            Clear all
          </button>
          <span className="sp mut" style={{ fontSize: 'var(--text-sm)' }}>
            Showing{' '}
            <b className="mono" style={{ color: 'var(--text-body)' }}>
              {visibleExercises.length}
            </b>{' '}
            of{' '}
            <b className="mono" style={{ color: 'var(--text-body)' }}>
              {totalCount}
            </b>
          </span>
        </div>
      ) : null}

      {isLoading ? (
        <div className="row" style={{ justifyContent: 'center', gap: 8, padding: '24px 0' }}>
          <Icon name="LoaderCircle" size={20} className="animate-spin text-[var(--primary)]" />
          <span style={{ color: 'var(--text-muted)' }}>Loading exercises…</span>
        </div>
      ) : visibleExercises.length === 0 ? (
        <div className="row" style={{ justifyContent: 'center', padding: '24px 0' }}>
          <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-muted)' }}>
            {debouncedSearch ? 'No exercises found matching your search.' : 'No exercises available.'}
          </span>
        </div>
      ) : (
        <>
          <div className="g g4">{visibleExercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              onClick={() => handleCardClick(exercise)}
            />
          ))}</div>

          {hasMore ? (
            <div className="row" style={{ justifyContent: 'center', marginTop: 24 }}>
              <button
                type="button"
                className="btn btn-sec"
                onClick={() => setVisibleCount((count) => count + pageSize)}
              >
                Load more exercises
                <Icon name="ChevronDown" size={17} />
              </button>
            </div>
          ) : null}
        </>
      )}

      <ExerciseModal
        key={selectedExercise?.id}
        exercise={selectedExercise}
        open={isModalOpen}
        onOpenChange={handleModalClose}
      />
    </>
  );
}
