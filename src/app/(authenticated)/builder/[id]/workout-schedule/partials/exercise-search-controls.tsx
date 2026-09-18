'use client';

import { useMemo } from 'react';
import { Icon } from '@/components/medvanta';
import { HtmlSearchField } from '@/app/(authenticated)/groups/partials/html-search-field';
import { ActiveFilterPills, useFilterDraft } from '@/components/filters';
import type { ActiveFilter } from '@/components/filters';
import { useAllTags } from '@/hooks/use-tags';
import {
  useExerciseAssignmentCounts,
  useExerciseTypes,
} from '@/hooks/use-exercises';
import {
  ExercisesFilterPanel,
  type AssignmentFilter,
} from '@/app/(authenticated)/exercises/exercise-library/partials/exercises-filter-panel';

function formatTypeLabel(type: string): string {
  return type
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export interface LibraryFilters {
  assignment: AssignmentFilter;
  type: string;
  tagIds: number[];
}

export const DEFAULT_LIBRARY_FILTERS: LibraryFilters = {
  assignment: 'all',
  type: 'all',
  tagIds: [],
};

function removeFilter(state: LibraryFilters, id: string): LibraryFilters {
  if (id === 'assignment') return { ...state, assignment: 'all' };
  if (id === 'type') return { ...state, type: 'all' };
  if (id.startsWith('tag-')) {
    const tagId = Number(id.slice(4));
    return { ...state, tagIds: state.tagIds.filter((t) => t !== tagId) };
  }
  return state;
}

interface ExerciseSearchControlsProps {
  search: string;
  onSearchChange: (value: string) => void;
  /** When true, show the same Filters panel as /exercises (library tab only). */
  showExerciseFilters?: boolean;
  searchPlaceholder?: string;
  onFiltersChange: (filters: LibraryFilters) => void;
}

/**
 * Search + optional /exercises-parity filter panel for the builder library.
 */
export function ExerciseSearchControls({
  search,
  onSearchChange,
  showExerciseFilters = false,
  searchPlaceholder = 'Search…',
  onFiltersChange,
}: ExerciseSearchControlsProps): React.ReactElement {
  const {
    applied,
    staged,
    setStaged,
    open: filtersOpen,
    setOpen: setFiltersOpen,
    apply: handleApplyFilters,
    clearAll: clearAllDraft,
    removePill: removeFiltersPill,
  } = useFilterDraft<LibraryFilters>({
    initial: DEFAULT_LIBRARY_FILTERS,
    removeFilter,
  });

  const { data: allTags = [] } = useAllTags();
  const tagsMap = useMemo(() => new Map(allTags.map((t) => [t.id, t])), [allTags]);
  const { data: countsData } = useExerciseAssignmentCounts();
  const { data: exerciseTypes = [] } = useExerciseTypes();

  const typeOptions = useMemo(
    () => exerciseTypes.map((type) => ({ value: type, label: formatTypeLabel(type) })),
    [exerciseTypes],
  );

  const assignmentCounts = useMemo(
    () => ({
      all: countsData?.all ?? 0,
      assigned: countsData?.assigned ?? 0,
      unassigned: countsData?.unassigned ?? 0,
    }),
    [countsData],
  );

  const handleOpenFilters = (): void => {
    setStaged(applied);
    setFiltersOpen(true);
  };

  const handleApply = (): void => {
    onFiltersChange(staged);
    handleApplyFilters();
  };

  const handleClear = (): void => {
    clearAllDraft();
    onFiltersChange(DEFAULT_LIBRARY_FILTERS);
  };

  const panelActiveCount = useMemo(
    () =>
      (applied.assignment !== 'all' ? 1 : 0) +
      (applied.type !== 'all' ? 1 : 0) +
      applied.tagIds.length,
    [applied],
  );

  const stagedActiveCount = useMemo(
    () =>
      (staged.assignment !== 'all' ? 1 : 0) +
      (staged.type !== 'all' ? 1 : 0) +
      staged.tagIds.length,
    [staged],
  );

  const activeFilters: ActiveFilter[] = useMemo(() => {
    const pills: ActiveFilter[] = [];
    if (search.trim()) {
      pills.push({ id: 'search', label: `"${search.trim()}"` });
    }
    if (applied.assignment !== 'all') {
      pills.push({
        id: 'assignment',
        label: applied.assignment === 'unassigned' ? 'Unassigned' : 'Assigned',
      });
    }
    if (applied.type !== 'all') {
      pills.push({ id: 'type', label: formatTypeLabel(applied.type) });
    }
    for (const tagId of applied.tagIds) {
      const tag = tagsMap.get(tagId);
      const label = tag ? `${tag.category}: ${tag.name}` : `Tag #${tagId}`;
      pills.push({ id: `tag-${tagId}`, label });
    }
    return pills;
  }, [applied, search, tagsMap]);

  const handleRemovePill = (id: string): void => {
    if (id === 'search') {
      onSearchChange('');
      return;
    }
    const next = removeFilter(applied, id);
    removeFiltersPill(id);
    onFiltersChange(next);
  };

  return (
    <div style={{ marginBottom: 12, position: 'relative', zIndex: 30 }}>
      <div className="tbar">
        <HtmlSearchField
          placeholder={searchPlaceholder}
          value={search}
          onChange={onSearchChange}
        />
        {showExerciseFilters ? (
          <div style={{ position: 'relative', flex: '0 0 auto' }}>
            <button
              type="button"
              className={`btn btn-sec btn-sm${filtersOpen ? ' btn-pri' : ''}`}
              onClick={() =>
                filtersOpen ? setFiltersOpen(false) : handleOpenFilters()
              }
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
              onAssignmentFilterChange={(value) =>
                setStaged((s) => ({ ...s, assignment: value }))
              }
              assignmentCounts={assignmentCounts}
              typeFilter={staged.type}
              onTypeFilterChange={(value) =>
                setStaged((s) => ({ ...s, type: value }))
              }
              typeOptions={typeOptions}
              selectedTagIds={staged.tagIds}
              onSelectedTagIdsChange={(tagIds) =>
                setStaged((s) => ({ ...s, tagIds }))
              }
              onClear={handleClear}
              onApply={handleApply}
              maxHeight="min(60vh, 560px)"
            />
          </div>
        ) : null}
      </div>

      {showExerciseFilters && activeFilters.length > 0 ? (
        <ActiveFilterPills
          pills={activeFilters}
          onRemove={handleRemovePill}
          onClearAll={() => {
            onSearchChange('');
            handleClear();
          }}
        />
      ) : null}
    </div>
  );
}
