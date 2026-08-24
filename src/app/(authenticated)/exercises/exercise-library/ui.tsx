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
  const [searchValue, setSearchValue] = useState('');
  const [assignmentFilter, setAssignmentFilter] = useState<AssignmentFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [selectedTagIds, setSelectedTagIds] = useState<number[]>([]);

  // Staged state for filter panel draft
  const [stagedAssignment, setStagedAssignment] = useState<AssignmentFilter>('all');
  const [stagedType, setStagedType] = useState<string>('all');
  const [stagedTagIds, setStagedTagIds] = useState<number[]>([]);

  const [filtersOpen, setFiltersOpen] = useState(false);
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
    type: typeFilter !== 'all' ? typeFilter : undefined,
    assignment: assignmentFilter,
    tagIds: selectedTagIds.length > 0 ? selectedTagIds : undefined,
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
    setStagedAssignment(assignmentFilter);
    setStagedType(typeFilter);
    setStagedTagIds(selectedTagIds);
    setFiltersOpen(true);
  };

  const handleApplyFilters = (): void => {
    setAssignmentFilter(stagedAssignment);
    setTypeFilter(stagedType);
    setSelectedTagIds(stagedTagIds);
    setFiltersOpen(false);
  };
  const handleClearFilters = (): void => {
    setStagedAssignment('all');
    setStagedType('all');
    setStagedTagIds([]);
    setAssignmentFilter('all');
    setTypeFilter('all');
    setSelectedTagIds([]);
    setFiltersOpen(false);
  };
  const activeFilterChips = useMemo(() => {
    const chips: Array<{ id: string; label: string; type: 'assignment' | 'type' | 'tag' | 'search'; tagId?: number }> = [];

    if (debouncedSearch.trim()) {
      chips.push({ id: 'search', label: `"${debouncedSearch.trim()}"`, type: 'search' });
    }
    if (assignmentFilter !== 'all') {
      chips.push({
        id: 'assignment',
        label: assignmentFilter === 'unassigned' ? 'Unassigned' : 'Assigned',
        type: 'assignment',
      });
    }
    if (typeFilter !== 'all') {
      chips.push({
        id: 'type',
        label: formatTypeLabel(typeFilter),
        type: 'type',
      });
    }
    for (const tagId of selectedTagIds) {
      const tag = tagsMap.get(tagId);
      const label = tag ? `${tag.category}: ${tag.name}` : `Tag #${tagId}`;
      chips.push({
        id: `tag-${tagId}`,
        label,
        type: 'tag',
        tagId,
      });
    }

    return chips;
  }, [assignmentFilter, typeFilter, selectedTagIds, debouncedSearch, tagsMap]);

  const panelActiveCount = useMemo(() => {
    let count = 0;
    if (assignmentFilter !== 'all') count += 1;
    if (typeFilter !== 'all') count += 1;
    count += selectedTagIds.length;
    return count;
  }, [assignmentFilter, typeFilter, selectedTagIds]);

  const stagedActiveCount = useMemo(() => {
    let count = 0;
    if (stagedAssignment !== 'all') count += 1;
    if (stagedType !== 'all') count += 1;
    count += stagedTagIds.length;
    return count;
  }, [stagedAssignment, stagedType, stagedTagIds]);

  const handleRemoveChip = (chip: { type: string; tagId?: number }): void => {
    if (chip.type === 'search') {
      setSearchValue('');
    } else if (chip.type === 'assignment') {
      setAssignmentFilter('all');
      setStagedAssignment('all');
    } else if (chip.type === 'type') {
      setTypeFilter('all');
      setStagedType('all');
    } else if (chip.type === 'tag' && chip.tagId !== undefined) {
      const next = selectedTagIds.filter((id) => id !== chip.tagId);
      setSelectedTagIds(next);
      setStagedTagIds(next);
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
            assignmentFilter={stagedAssignment}
            onAssignmentFilterChange={setStagedAssignment}
            assignmentCounts={assignmentCounts}
            typeFilter={stagedType}
            onTypeFilterChange={setStagedType}
            typeOptions={typeOptions}
            selectedTagIds={stagedTagIds}
            onSelectedTagIdsChange={setStagedTagIds}
            onClear={handleClearFilters}
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

      {activeFilterChips.length > 0 ? (
        <div className="row" style={{ gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
          {activeFilterChips.map((chip) => (
            <span key={chip.id} className="tag tag-b">
              {chip.label}
              <button
                type="button"
                aria-label={`Remove ${chip.label}`}
                onClick={() => handleRemoveChip(chip)}
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
              {exercises.length}
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
