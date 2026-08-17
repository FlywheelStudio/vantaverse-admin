'use client';

import { useState, useMemo, useCallback } from 'react';
import { Icon } from '@/components/medvanta';
import { useExercises } from '@/hooks/use-exercises';
import { ExerciseCard } from './partials/exercise-card';
import { ExerciseModal } from './partials/exercise-modal';
import { HtmlSearchField } from '@/app/(authenticated)/groups/partials/html-search-field';
import { HtmlFiltersButton } from '@/app/(authenticated)/builder/partials/html-toolbar';
import { useDebounce } from '@/hooks/use-debounce';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

type AssignmentFilter = 'all' | 'unassigned' | 'assigned';

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
  const [visibleCount, setVisibleCount] = useState(16);
  const pageSize = 16;

  const handleSearchChange = useCallback((): void => {
    setVisibleCount(pageSize);
  }, []);

  const debouncedSearch = useDebounce(searchValue, 300, handleSearchChange);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const filteredExercises = useMemo(() => {
    return (exercises ?? []).filter((exercise) => {
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
  }, [exercises, debouncedSearch, typeFilter, assignmentFilter]);

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
        <HtmlFiltersButton activeCount={activeFilterTags.length} />
        <span className="sp seg">
          <button type="button" className="on" aria-label="Grid view">
            <Icon name="LayoutGrid" size={16} />
          </button>
          <button type="button" disabled aria-label="List view placeholder">
            <Icon name="List" size={16} />
          </button>
        </span>
      </div>

      {activeFilterTags.length > 0 ? (
        <div className="row" style={{ gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {activeFilterTags.map((tag) => (
            <span key={tag} className="tag tag-b">
              {tag}
            </span>
          ))}
          <button
            type="button"
            className="btn btn-ghost btn-sm"
            onClick={() => {
              setSearchValue('');
              setAssignmentFilter('all');
              setTypeFilter('all');
              setVisibleCount(pageSize);
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
