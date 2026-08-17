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

interface ExerciseBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: (selectedItems: SelectedItem[]) => void;
  onCancel?: () => void;
  initialItems?: SelectedItem[];
  onItemsChange?: (selectedItems: SelectedItem[]) => void;
  weekIndex?: number;
  dayIndex?: number;
  date?: Date | null;
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
}: ExerciseBuilderModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [sourceFilter, setSourceFilter] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] =
    useState<SelectedItem[]>(initialItems);
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');

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

  // Infinite scroll observer
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

  const updateSelectedItems = (newItems: SelectedItem[]) => {
    setSelectedItems(newItems);
    onItemsChange?.(newItems);
  };

  const handleAddExercise = (exercise: Exercise) => {
    updateSelectedItems([
      ...selectedItems,
      { type: 'exercise', data: exercise },
    ]);
  };

  const handleAddTemplate = (template: ExerciseTemplate) => {
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

  const handleAddDatabaseGroup = (group: DbGroup) => {
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

  const handleRemoveItem = (index: number) => {
    updateSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, item: SelectedItem) => {
    const updated = [...selectedItems];
    updated[index] = item;
    updateSelectedItems(updated);
  };

  const handleDone = () => {
    // Filter out empty groups before saving
    const filteredItems = selectedItems.filter((item) => {
      if (item.type === 'group') {
        return item.data.items.length > 0;
      }
      return true;
    });
    
    onDone?.(filteredItems);
    onOpenChange(false);
    setSearch('');
    setShowGroupInput(false);
    setGroupNameInput('');
  };

  const handleCancel = () => {
    onCancel?.();
    setSearch('');
    setShowGroupInput(false);
    setGroupNameInput('');
  };

  const handleSortChange = (by: string, order: 'asc' | 'desc') => {
    setSortBy(by);
    setSortOrder(order);
  };

  const handleAddGroup = () => {
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

  const handleRemoveGroup = (index: number) => {
    updateSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleToggleSuperset = (index: number) => {
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

  const handleCancelGroupInput = () => {
    setGroupNameInput('');
    setShowGroupInput(false);
  };

  // Format header title with week, day, and date
  const getHeaderTitle = () => {
    if (
      weekIndex !== undefined &&
      dayIndex !== undefined &&
      date !== null &&
      date !== undefined
    ) {
      const formattedDate = format(date, 'MM-dd-yyyy');
      return `Add Exercises or Groups - Week ${weekIndex + 1}, Day ${dayIndex + 1} (${formattedDate})`;
    }
    return 'Add Exercises or Groups';
  };

  return (
    <HtmlModal
      open={open}
      title="Day editor"
      subtitle={getHeaderTitle()}
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
      footer={
        <>
          <button type="button" className="btn btn-sec" onClick={handleCancel}>
            Cancel
          </button>
          <button type="button" className="btn btn-pri" onClick={handleDone}>
            <Icon name="Check" size={17} />
            Done
          </button>
        </>
      }
    >
      <div className="dual flex min-h-0 flex-1 overflow-hidden">
          <div className="dual-l flex flex-col overflow-hidden">
            {/* Tabs and Controls */}
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

            {/* Scrollable Content */}
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

              {/* Infinite scroll trigger */}
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
            <h4 className="mb-4 font-[var(--fw-semibold)] text-[var(--text-strong)]">
              Selected items
            </h4>
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
