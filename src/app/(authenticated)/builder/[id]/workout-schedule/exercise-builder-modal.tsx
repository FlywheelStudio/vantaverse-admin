'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Button, Icon, IconButton, Input } from '@/components/medvanta';
import { HtmlModal } from '@/app/(authenticated)/users/[id]/partials/intake-survey-placeholder-modal';
import {
  useExercisesInfinite,
  useExerciseTemplatesInfinite,
  useExerciseTemplatesByIds,
  useGroupsInfinite,
  useExerciseTypes,
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
import { ExerciseSearchControls } from './partials/exercise-search-controls';
import { ExerciseLibraryCard } from './partials/exercise-library-card';
import { ExerciseTemplateCard } from './partials/exercise-template-card';
import { GroupCard } from './partials/group-card';
import { SelectedItemsList } from './selected-items-list';
import { DefaultValues } from '../default-values/default-values';
import {
  formatVolumeFooter,
  getDayName,
  type DayScheduleMeta,
} from './exercise-builder-mock-data';

export interface ExerciseBuilderDonePayload {
  items: SelectedItem[];
  isRestDay: boolean;
  sessionNote: string;
}

interface ExerciseBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: (payload: ExerciseBuilderDonePayload) => void;
  onCancel?: () => void;
  initialItems?: SelectedItem[];
  initialIsRestDay?: boolean;
  initialSessionNote?: string;
  onItemsChange?: (selectedItems: SelectedItem[]) => void;
  onDayMetaChange?: (meta: DayScheduleMeta) => void;
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
  initialIsRestDay = false,
  initialSessionNote = '',
  onItemsChange,
  onDayMetaChange,
  weekIndex,
  dayIndex,
  date,
  onPrevDay,
  onNextDay,
}: ExerciseBuilderModalProps): React.ReactElement {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] =
    useState<SelectedItem[]>(initialItems);
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');
  const [isRestDay, setIsRestDay] = useState(initialIsRestDay);
  const [sessionNote, setSessionNote] = useState(initialSessionNote);
  const [mockDayIndex, setMockDayIndex] = useState(dayIndex ?? 0);

  const debouncedSearch = useDebounce(search, 300);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  const { data: typeOptions = [] } = useExerciseTypes();
  const exercisesQuery = useExercisesInfinite(
    debouncedSearch || undefined,
    sortBy,
    sortOrder,
    20,
    sourceFilter ?? undefined,
  );

  const templatesQuery = useExerciseTemplatesInfinite(
    debouncedSearch || undefined,
    sortBy,
    sortOrder,
    20,
  );

  const groupsQuery = useGroupsInfinite(
    debouncedSearch || undefined,
    sortBy,
    sortOrder,
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

  const updateDayMeta = (next: Partial<DayScheduleMeta>): void => {
    const meta: DayScheduleMeta = {
      isRestDay: next.isRestDay ?? isRestDay,
      sessionNote: next.sessionNote ?? sessionNote,
    };
    if (next.isRestDay !== undefined) setIsRestDay(next.isRestDay);
    if (next.sessionNote !== undefined) setSessionNote(next.sessionNote);
    onDayMetaChange?.(meta);
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

  const allExercises = exercisesQuery.data?.pages.flat() || [];
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
      isRestDay,
      sessionNote,
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

  const handleSortChange = (by: string, order: 'asc' | 'desc'): void => {
    setSortBy(by);
    setSortOrder(order);
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
      width={1060}
      style={{
        maxWidth: 1060,
        maxHeight: 'min(660px, calc(100vh - 56px))',
        height: 'min(660px, calc(100vh - 56px))',
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
      <div className="dual flex min-h-0 flex-1 overflow-hidden">
          <div className="dual-l flex flex-col overflow-hidden">
            <ExerciseTabSwitcher
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            {activeTab !== 'default-values' && (
              <ExerciseSearchControls
                search={search}
                onSearchChange={setSearch}
                sortBy={sortBy}
                onSortChange={handleSortChange}
                sourceFilter={sourceFilter}
                onSourceFilterChange={setSourceFilter}
                typeOptions={typeOptions}
              />
            )}

            <div className="flex-1 overflow-y-auto">
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

            <label
              className="cbl"
              style={{
                fontSize: 'var(--text-sm)',
                marginBottom: 13,
                padding: '9px 11px',
                border: '1px solid var(--border-subtle)',
                borderRadius: 'var(--radius-md)',
                background: 'var(--surface-card)',
              }}
            >
              <button
                type="button"
                className={isRestDay ? 'sw on' : 'sw'}
                aria-pressed={isRestDay}
                aria-label={`Mark ${dayName} as a rest day`}
                onClick={() => updateDayMeta({ isRestDay: !isRestDay })}
              >
                <i />
              </button>
              Mark {dayName} as a rest day
            </label>

            <div style={{ marginBottom: 13 }}>
              <label className="lbl" htmlFor="day-session-note">
                Session note
              </label>
              <textarea
                id="day-session-note"
                className="ta"
                rows={2}
                placeholder="Optional — shown at the top of the workout"
                value={sessionNote}
                onChange={(e) => updateDayMeta({ sessionNote: e.target.value })}
                disabled={isRestDay}
              />
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
                disabled={isRestDay}
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
            <div style={{ opacity: isRestDay ? 0.45 : 1, pointerEvents: isRestDay ? 'none' : undefined }}>
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
      </div>
    </HtmlModal>
  );
}
