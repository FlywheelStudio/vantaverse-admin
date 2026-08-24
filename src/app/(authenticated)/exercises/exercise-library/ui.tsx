'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import { Icon } from '@/components/medvanta';
import {
  useExercisesFiltered,
  useExerciseAssignmentCounts,
  useExerciseTypes,
} from '@/hooks/use-exercises';
import { useAllTags } from '@/hooks/use-tags';
import { ExerciseCard } from './partials/exercise-card';
import { ExerciseModal } from './partials/exercise-modal';
import { HtmlSearchField } from '@/app/(authenticated)/groups/partials/html-search-field';
import { useDebounce } from '@/hooks/use-debounce';
import { ActiveFilterPills, useFilterDraft } from '@/components/filters';
import type { ActiveFilter } from '@/components/filters';
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

interface ExercisesFilters {
  assignment: AssignmentFilter;
  type: string;
  tagIds: number[];
}

const DEFAULT_EXERCISES_FILTERS: ExercisesFilters = {
  assignment: 'all',
  type: 'all',
  tagIds: [],
};

function removeFilter(state: ExercisesFilters, id: string): ExercisesFilters {
  if (id === 'assignment') return { ...state, assignment: 'all' };
  if (id === 'type') return { ...state, type: 'all' };
  if (id.startsWith('tag-')) {
    const tagId = Number(id.slice(4));
    return { ...state, tagIds: state.tagIds.filter((t) => t !== tagId) };
  }
  return state;
}

interface ExerciseLibraryProps {
  initialExercises?: Exercise[];
}

export function ExerciseLibrary({ initialExercises }: ExerciseLibraryProps): React.ReactElement {
  const [searchValue, setSearchValue] = useState('');
  const {
    applied: filters,
    staged,
    setStaged,
    open: filtersOpen,
    setOpen: setFiltersOpen,
    apply: handleApplyFilters,
    clearAll: clearAllDraft,
    removePill: removeFiltersPill,
  } = useFilterDraft<ExercisesFilters>({ initial: DEFAULT_EXERCISES_FILTERS, removeFilter });
  const pageSize = 20;
  const observerTargetRef = useRef<HTMLDivElement>(null);

  const debouncedSearch = useDebounce(searchValue, 300);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch all tags to resolve tag names and category labels for filter chips
  const { data: allTags = [] } = useAllTags();
  const tagsMap = useMemo(() => new Map(allTags.map((t) => [t.id, t])), [allTags]);

  // Real assignment counts + source types for the filter panel
  const { data: countsData } = useExerciseAssignmentCounts();
  const { data: exerciseTypes = [] } = useExerciseTypes();

  // Paginated + filtered exercises query
  const {
    data: queryResult,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useExercisesFiltered({
    search: debouncedSearch,
    type: filters.type !== 'all' ? filters.type : undefined,
    assignment: filters.assignment,
    tagIds: filters.tagIds.length > 0 ? filters.tagIds : undefined,
    pageSize,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  useEffect(() => {
    const target = observerTargetRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    observer.observe(target);
    return () => observer.unobserve(target);
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const exercises = useMemo(() => {
    if (!queryResult) return initialExercises ?? [];
    return queryResult.pages.flatMap((p) => p.data);
  }, [queryResult, initialExercises]);

  const totalCount = queryResult?.pages[0]?.total ?? initialExercises?.length ?? exercises.length;

  const assignmentCounts = useMemo(
    () => ({
      all: countsData?.all ?? totalCount,
      assigned: countsData?.assigned ?? 0,
      unassigned: countsData?.unassigned ?? 0,
    }),
    [countsData, totalCount],
  );

  const typeOptions = useMemo(
    () => exerciseTypes.map((type) => ({ value: type, label: formatTypeLabel(type) })),
    [exerciseTypes],
  );
  // Staged filter helpers
  const handleOpenFilters = (): void => {
    setStaged(filters);
    setFiltersOpen(true);
  };

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const pills: ActiveFilter[] = [];

    if (debouncedSearch.trim()) {
      pills.push({ id: 'search', label: `"${debouncedSearch.trim()}"` });
    }
    if (filters.assignment !== 'all') {
      pills.push({
        id: 'assignment',
        label: filters.assignment === 'unassigned' ? 'Unassigned' : 'Assigned',
      });
    }
    if (filters.type !== 'all') {
      pills.push({ id: 'type', label: formatTypeLabel(filters.type) });
    }
    for (const tagId of filters.tagIds) {
      const tag = tagsMap.get(tagId);
      const label = tag ? `${tag.category}: ${tag.name}` : `Tag #${tagId}`;
      pills.push({ id: `tag-${tagId}`, label });
    }

    return pills;
  }, [filters, debouncedSearch, tagsMap]);

  const panelActiveCount = useMemo(
    () =>
      (filters.assignment !== 'all' ? 1 : 0) +
      (filters.type !== 'all' ? 1 : 0) +
      filters.tagIds.length,
    [filters],
  );

  const stagedActiveCount = useMemo(
    () =>
      (staged.assignment !== 'all' ? 1 : 0) +
      (staged.type !== 'all' ? 1 : 0) +
      staged.tagIds.length,
    [staged],
  );

  const handleRemovePill = (id: string): void => {
    if (id === 'search') {
      setSearchValue('');
    } else {
      removeFiltersPill(id);
    }
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
            onClick={() => (filtersOpen ? setFiltersOpen(false) : handleOpenFilters())}
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
            activeCount={stagedActiveCount}
            assignmentFilter={staged.assignment}
            onAssignmentFilterChange={(value) => setStaged((s) => ({ ...s, assignment: value }))}
            assignmentCounts={assignmentCounts}
            typeFilter={staged.type}
            onTypeFilterChange={(value) => setStaged((s) => ({ ...s, type: value }))}
            typeOptions={typeOptions}
            selectedTagIds={staged.tagIds}
            onSelectedTagIdsChange={(tagIds) => setStaged((s) => ({ ...s, tagIds }))}
            onClear={clearAllDraft}
            onApply={handleApplyFilters}
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

      <ActiveFilterPills
        pills={activeFilters}
        onRemove={handleRemovePill}
        onClearAll={() => {
          setSearchValue('');
          clearAllDraft();
        }}
        meta={
          <span>
            Showing{' '}
            <b className="mono" style={{ color: 'var(--text-body)' }}>
              {exercises.length}
            </b>{' '}
            of{' '}
            <b className="mono" style={{ color: 'var(--text-body)' }}>
              {totalCount}
            </b>
          </span>
        }
      />

      {isLoading ? (
        <div className="row" style={{ justifyContent: 'center', gap: 8, padding: '24px 0' }}>
          <Icon name="LoaderCircle" size={20} className="animate-spin text-[var(--primary)]" />
          <span style={{ color: 'var(--text-muted)' }}>Loading exercises…</span>
        </div>
      ) : exercises.length === 0 ? (
        <div className="row" style={{ justifyContent: 'center', padding: '24px 0' }}>
          <span style={{ color: 'var(--text-muted)' }}>No exercises found.</span>
        </div>
      ) : (
        <>
          <div className="g g4" style={{ marginTop: 12 }}>
            {exercises.map((exercise) => (
              <ExerciseCard
                key={exercise.id}
                exercise={exercise}
                onClick={() => handleCardClick(exercise)}
              />
            ))}
          </div>
          <div ref={observerTargetRef} style={{ height: 1 }} />
          {isFetchingNextPage && (
            <div className="row" style={{ justifyContent: 'center', gap: 8, padding: '16px 0' }}>
              <Icon name="LoaderCircle" size={18} className="animate-spin text-[var(--primary)]" />
              <span style={{ color: 'var(--text-muted)' }}>Loading more exercises…</span>
            </div>
          )}
        </>
      )}

      {selectedExercise && (
        <ExerciseModal
          open={isModalOpen}
          onOpenChange={handleModalClose}
          exercise={selectedExercise}
        />
      )}
    </>
  );
}
