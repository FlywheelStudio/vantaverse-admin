'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Icon, IconButton, Input } from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';
import {
  useExercisesFilteredInfinite,
  useExerciseTemplatesInfinite,
  useExerciseTemplatesByIds,
  useGroupsInfinite,
} from '@/hooks/use-exercises';
import { useDebounce } from '@/hooks/use-debounce';
import { format } from 'date-fns';
import type { Exercise } from '@/lib/supabase/schemas/exercises';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';
import type { SelectedItem } from '@/app/(authenticated)/builder/[id]/template-config/types';
import type { Group as DbGroup } from '@/lib/supabase/queries/groups';
import {
  ExerciseTabSwitcher,
  type TabType,
} from './partials/exercise-tab-switcher';
import {
  ExerciseSearchControls,
  DEFAULT_LIBRARY_FILTERS,
  type LibraryFilters,
} from './partials/exercise-search-controls';
import { ExerciseLibraryCard } from './partials/exercise-library-card';
import { ExerciseTemplateCard } from './partials/exercise-template-card';
import { GroupCard } from './partials/group-card';
import { SelectedItemsList } from './selected-items-list';
import { DefaultValues } from '../default-values/default-values';
import { formatVolumeFooter, getDayName } from './exercise-builder-mock-data';

const FL_SUPERSETS_ENABLED = process.env.NEXT_PUBLIC_FL_SUPERSETS === 'true';

export interface ExerciseBuilderDonePayload {
  items: SelectedItem[];
}

interface ExerciseBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: (payload: ExerciseBuilderDonePayload) => void;
  onCancel?: () => void;
  initialItems?: SelectedItem[];
  onItemsChange?: (selectedItems: SelectedItem[]) => void;
  weekIndex?: number;
  dayIndex?: number;
  date?: Date | null;
  /** Optional parent day navigation; falls back to local mock index. */
  onPrevDay?: () => void;
  onNextDay?: () => void;
}

/**
 * Counts leaf exercises in the selection (group children included).
 */
function countSelectedExercises(items: SelectedItem[]): number {
  return items.reduce((total, item) => {
    if (item.type === 'group') return total + item.data.items.length;
    return total + 1;
  }, 0);
}

export function ExerciseBuilderModal({
  open,
  onOpenChange,
  onDone,
  onCancel,
  initialItems = [],
  onItemsChange,
  weekIndex,
  dayIndex,
  date,
  onPrevDay,
  onNextDay,
}: ExerciseBuilderModalProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [search, setSearch] = useState('');
  const [libraryFilters, setLibraryFilters] = useState<LibraryFilters>(
    DEFAULT_LIBRARY_FILTERS,
  );
  const [selectedItems, setSelectedItems] =
    useState<SelectedItem[]>(initialItems);
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [mockDayIndex, setMockDayIndex] = useState(dayIndex ?? 0);

  const debouncedSearch = useDebounce(search, 300);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  const exercisesQuery = useExercisesFilteredInfinite({
    search: debouncedSearch || undefined,
    type: libraryFilters.type !== 'all' ? libraryFilters.type : undefined,
    assignment: libraryFilters.assignment,
    tagIds: libraryFilters.tagIds.length > 0 ? libraryFilters.tagIds : undefined,
    pageSize: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
  });

  const templatesQuery = useExerciseTemplatesInfinite(
    debouncedSearch || undefined,
    'updated_at',
    'desc',
    20,
  );

  const groupsQuery = useGroupsInfinite(
    debouncedSearch || undefined,
    'updated_at',
    'desc',
    20,
  );

  const currentQuery =
    activeTab === 'library'
      ? exercisesQuery
      : activeTab === 'templates'
        ? templatesQuery
        : activeTab === 'groups'
          ? groupsQuery
          : null;

  useEffect(() => {
    if (!currentQuery || activeTab === 'default-values') return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          currentQuery.hasNextPage &&
          !currentQuery.isFetchingNextPage
        ) {
          currentQuery.fetchNextPage();
        }
      },
      { threshold: 0.1 },
    );

    const currentTarget = observerTargetRef.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [
    currentQuery?.hasNextPage,
    currentQuery?.isFetchingNextPage,
    currentQuery?.fetchNextPage,
    currentQuery,
    activeTab,
  ]);

  const updateSelectedItems = (newItems: SelectedItem[]): void => {
    setSelectedItems(newItems);
    onItemsChange?.(newItems);
  };

  const handleAddExercise = (exercise: Exercise): void => {
    updateSelectedItems([
      ...selectedItems,
      { type: 'exercise', data: exercise },
    ]);
  };

  const handleAddTemplate = (template: ExerciseTemplate): void => {
    updateSelectedItems([
      ...selectedItems,
      { type: 'template', data: template },
    ]);
  };

  const allExercises = useMemo(
    () => exercisesQuery.data?.pages.flatMap((page) => page.data) ?? [],
    [exercisesQuery.data],
  );
  const allTemplates = templatesQuery.data?.pages.flat() || [];
  const allGroups = useMemo(
    () => groupsQuery.data?.pages.flat() || [],
    [groupsQuery.data],
  );

  const groupTemplateIds = useMemo(() => {
    if (activeTab !== 'groups') return [];
    const ids = new Set<string>();
    for (const group of allGroups) {
      for (const id of group.exercise_template_ids ?? []) {
        ids.add(id);
      }
    }
    return Array.from(ids);
  }, [activeTab, allGroups]);

  const groupTemplatesQuery = useExerciseTemplatesByIds(groupTemplateIds);
  const groupTemplatesById = useMemo(() => {
    const map: Record<string, ExerciseTemplate | undefined> = {};
    for (const t of groupTemplatesQuery.data ?? []) {
      map[t.id] = t;
    }
    return map;
  }, [groupTemplatesQuery.data]);

  const handleAddDatabaseGroup = (group: DbGroup): void => {
    const items: SelectedItem[] = (group.exercise_template_ids ?? [])
      .map((id) => groupTemplatesById[id])
      .filter(Boolean)
      .map((template) => ({
        type: 'template' as const,
        data: template as ExerciseTemplate,
      }));

    const newGroup: SelectedItem = {
      type: 'group',
      data: {
        id: group.id,
        name: group.title,
        isSuperset: group.is_superset ?? false,
        items,
      },
    };

    updateSelectedItems([...selectedItems, newGroup]);
  };

  const handleRemoveItem = (index: number): void => {
    updateSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, item: SelectedItem): void => {
    const updated = [...selectedItems];
    updated[index] = item;
    updateSelectedItems(updated);
  };

  const handleDone = (): void => {
    const filteredItems = selectedItems.filter((item) => {
      if (item.type === 'group') {
        return item.data.items.length > 0;
      }
      return true;
    });

    onDone?.({
      items: filteredItems,
    });
    onOpenChange(false);
    setSearch('');
    setShowGroupInput(false);
    setGroupNameInput('');
  };

  const handleCancel = (): void => {
    onCancel?.();
    setSearch('');
    setShowGroupInput(false);
    setGroupNameInput('');
  };

  const handleAddGroup = (): void => {
    if (groupNameInput.trim()) {
      const newGroup: SelectedItem = {
        type: 'group',
        data: {
          name: groupNameInput.trim(),
          isSuperset: false,
          items: [],
        },
      };
      updateSelectedItems([...selectedItems, newGroup]);
      setGroupNameInput('');
      setShowGroupInput(false);
    }
  };

  const handleRemoveGroup = (index: number): void => {
    updateSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleToggleSuperset = (index: number): void => {
    if (!FL_SUPERSETS_ENABLED) return;

    const updated = [...selectedItems];
    const item = updated[index];
    if (item && item.type === 'group') {
      updated[index] = {
        ...item,
        data: {
          ...item.data,
          isSuperset: !item.data.isSuperset,
        },
      };
      updateSelectedItems(updated);
    }
  };

  const handleCancelGroupInput = (): void => {
    setGroupNameInput('');
    setShowGroupInput(false);
  };

  const effectiveDayIndex = onPrevDay || onNextDay ? (dayIndex ?? 0) : mockDayIndex;
  const dayName = getDayName(effectiveDayIndex);
  const exerciseCount = countSelectedExercises(selectedItems);
  const volumeLabel = formatVolumeFooter(exerciseCount);

  const handlePrevDay = (): void => {
    if (onPrevDay) {
      onPrevDay();
      return;
    }
    setMockDayIndex((prev) => (prev + 6) % 7);
  };

  const handleNextDay = (): void => {
    if (onNextDay) {
      onNextDay();
      return;
    }
    setMockDayIndex((prev) => (prev + 1) % 7);
  };

  const getHeaderTitle = (): string => {
    return `Edit ${dayName}`;
  };

  const getSubtitle = (): string => {
    if (
      weekIndex !== undefined &&
      date !== null &&
      date !== undefined
    ) {
      const formattedDate = format(date, 'MM-dd-yyyy');
      return `Week ${weekIndex + 1} · Day ${effectiveDayIndex + 1} (${formattedDate})`;
    }
    if (weekIndex !== undefined) {
      return `Week ${weekIndex + 1}`;
    }
    return 'Add exercises or groups for this day';
  };

  return (
    <HtmlModal
      open={open}
      title={getHeaderTitle()}
      subtitle={getSubtitle()}
      onClose={() => onOpenChange(false)}
      width={1520}
      style={{
        width: 'min(1520px, calc(100vw - 56px))',
        maxWidth: 'min(1520px, calc(100vw - 56px))',
        height: 'calc(100vh - 56px)',
        maxHeight: 'calc(100vh - 56px)',
        display: 'flex',
        flexDirection: 'column',
      }}
      bodyClassName="flex min-h-0 flex-1 flex-col overflow-hidden"
      headerTrailing={
        <>
          <button
            type="button"
            className="ib ib-sec ib-sq"
            aria-label="Previous day"
            onClick={handlePrevDay}
          >
            <Icon name="ChevronLeft" size={17} />
          </button>
          <button
            type="button"
            className="ib ib-sec ib-sq"
            aria-label="Next day"
            onClick={handleNextDay}
          >
            <Icon name="ChevronRight" size={17} />
          </button>
        </>
      }
      footerInfo={volumeLabel}
      footer={
        <>
          <button type="button" className="btn btn-sec" onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-acc" onClick={handleDone}>
            <Icon name="Check" size={17} />
            Save day
          </button>
        </>
      }
    >
      <div
        className="dual flex min-h-0 flex-1 overflow-hidden"
        style={{ gridTemplateColumns: 'minmax(0, 1fr) 480px' }}
      >
          <div className="dual-l flex min-h-0 flex-col overflow-visible">
            <ExerciseTabSwitcher
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            {activeTab !== 'default-values' && (
              <ExerciseSearchControls
                search={search}
                onSearchChange={setSearch}
                showExerciseFilters={activeTab === 'library'}
                searchPlaceholder={
                  activeTab === 'library'
                    ? 'Search exercises…'
                    : activeTab === 'templates'
                      ? 'Search templates…'
                      : 'Search groups…'
                }
                onFiltersChange={setLibraryFilters}
              />
            )}

            <div className="min-h-0 flex-1 overflow-y-auto">
              {activeTab === 'default-values' ? (
                  <DefaultValues />
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {activeTab === 'library' ? (
                  <>
                    {allExercises.map((exercise, index) => (
                      <ExerciseLibraryCard
                        key={`exercise-${exercise.id}-${index}`}
                        exercise={exercise}
                        onAdd={() => handleAddExercise(exercise)}
                        index={index}
                      />
                    ))}
                    {(exercisesQuery.isLoading && (
                      <div className="col-span-full py-4 text-center text-[var(--text-muted)]">
                        Loading...
                      </div>
                    )) ||
                      (!exercisesQuery.hasNextPage &&
                        allExercises.length === 0 && (
                          <div className="col-span-full py-4 text-center text-[var(--text-muted)]">
                            No exercises found
                          </div>
                        ))}
                    {exercisesQuery.isError && (
                      <div className="col-span-full py-4 text-center text-[var(--danger)]">
                        Error loading exercises
                      </div>
                    )}
                  </>
                ) : activeTab === 'templates' ? (
                  <>
                    {allTemplates.map((template, index) => (
                      <ExerciseTemplateCard
                        key={`template-${template.id}-${index}`}
                        template={template}
                        onAdd={() => handleAddTemplate(template)}
                        index={index}
                      />
                    ))}
                    {(templatesQuery.isLoading && (
                      <div className="col-span-full py-4 text-center text-[var(--text-muted)]">
                        Loading...
                      </div>
                    )) ||
                      (!templatesQuery.hasNextPage &&
                        allTemplates.length === 0 && (
                          <div className="col-span-full py-4 text-center text-[var(--text-muted)]">
                            No templates found
                          </div>
                        ))}
                    {templatesQuery.isError && (
                      <div className="col-span-full py-4 text-center text-[var(--danger)]">
                        Error loading templates
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {allGroups.map((group, index) => (
                      <GroupCard
                        key={`group-${group.id}-${index}`}
                        group={group}
                        templatesById={groupTemplatesById}
                        onAdd={() => handleAddDatabaseGroup(group)}
                        index={index}
                      />
                    ))}

                    {(groupsQuery.isLoading && (
                      <div className="col-span-full py-4 text-center text-[var(--text-muted)]">
                        Loading...
                      </div>
                    )) ||
                      (!groupsQuery.hasNextPage && allGroups.length === 0 && (
                        <div className="col-span-full py-4 text-center text-[var(--text-muted)]">
                          No groups found
                        </div>
                      ))}

                    {groupsQuery.isError && (
                      <div className="col-span-full py-4 text-center text-[var(--danger)]">
                        Error loading groups
                      </div>
                    )}
                  </>
                  )}
                </div>
              )}

              {activeTab !== 'default-values' && (
                <>
                  <div ref={observerTargetRef} className="h-4" />
                  {currentQuery && currentQuery.hasNextPage && !currentQuery.isFetchingNextPage && (
                    <div className="mt-4 flex justify-center">
                      <Button
                        onClick={() => currentQuery.fetchNextPage()}
                        disabled={currentQuery.isFetchingNextPage}
                        size="sm"
                      >
                        Load More
                      </Button>
                    </div>
                  )}
                  {currentQuery && currentQuery.isFetchingNextPage && (
                    <div className="mt-4 flex justify-center">
                      <div className="text-[var(--text-muted)]">Loading more...</div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          <div className="dual-r slim-scrollbar flex flex-col overflow-y-auto">
            <div
              className="row"
              style={{ gap: 9, marginBottom: 3 }}
            >
              <Icon name="CalendarDays" size={16} style={{ color: 'var(--navy-600)' }} />
              <span
                style={{
                  fontSize: 'var(--text-md)',
                  fontWeight: 'var(--fw-bold)',
                  color: 'var(--text-strong)',
                }}
              >
                {dayName}
                {weekIndex !== undefined ? ` · Week ${weekIndex + 1}` : ''}
              </span>
            </div>
            <div
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-muted)',
                marginBottom: 13,
              }}
            >
              {volumeLabel}
            </div>

            <div
              className="row"
              style={{ justifyContent: 'space-between', marginBottom: 8 }}
            >
              <span className="ovl">Exercises ({exerciseCount})</span>
              <span
                className="mut row"
                style={{ gap: 5, fontSize: 'var(--text-xs)' }}
              >
                <Icon name="GripVertical" size={13} />
                Drag to reorder
              </span>
            </div>

            {!showGroupInput ? (
              <button
                type="button"
                onClick={() => setShowGroupInput(true)}
                className="mb-4 w-full cursor-pointer rounded-[var(--radius-md)] border-2 border-dashed border-[var(--border-default)] px-4 py-3 text-[length:var(--text-sm)] font-[var(--fw-medium)] text-[var(--text-muted)] transition-colors hover:border-[var(--primary)] hover:bg-[var(--slate-50)] hover:text-[var(--text-strong)]"
              >
                + Add Group
              </button>
            ) : (
              <div
                className="mb-4 flex items-center gap-2"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleAddGroup();
                  } else if (e.key === 'Escape') {
                    handleCancelGroupInput();
                  }
                }}
              >
                <Input
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  placeholder="Group name..."
                  className="flex-1"
                />
                <IconButton
                  icon="Check"
                  label="Save group"
                  variant="primary"
                  size="sm"
                  shape="rounded"
                  onClick={handleAddGroup}
                />
                <IconButton
                  icon="X"
                  label="Cancel"
                  variant="secondary"
                  size="sm"
                  shape="rounded"
                  onClick={handleCancelGroupInput}
                />
              </div>
            )}
            <SelectedItemsList
              items={selectedItems}
              onRemove={handleRemoveItem}
              onUpdate={handleUpdateItem}
              onItemsReorder={updateSelectedItems}
              onRemoveGroup={handleRemoveGroup}
              onToggleSuperset={handleToggleSuperset}
            />
          </div>
      </div>
    </HtmlModal>
  );
}
