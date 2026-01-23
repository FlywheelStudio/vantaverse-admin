'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  useExercisesInfinite,
  useExerciseTemplatesInfinite,
} from '@/hooks/use-exercises';
import { useDebounce } from '@/hooks/use-debounce';
import { format } from 'date-fns';
import type { Exercise } from '@/lib/supabase/schemas/exercises';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';
import type { SelectedItem } from '@/app/(authenticated)/builder/template-config/types';
import { ExerciseTabSwitcher } from './partials/exercise-tab-switcher';
import { ExerciseSearchControls } from './partials/exercise-search-controls';
import { ExerciseLibraryCard } from './partials/exercise-library-card';
import { ExerciseTemplateCard } from './partials/exercise-template-card';
import { SelectedItemsList } from './selected-items-list';

type TabType = 'library' | 'templates';

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
  const [selectedItems, setSelectedItems] =
    useState<SelectedItem[]>(initialItems);
  const [showGroupInput, setShowGroupInput] = useState(false);
  const [groupNameInput, setGroupNameInput] = useState('');

  // Reset selected items when weekday changes (initialItems prop changes)
  // Use key prop on modal to force remount, but also sync when modal opens
  useEffect(() => {
    if (open) {
      setSelectedItems(initialItems);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, weekIndex, dayIndex]);

  const debouncedSearch = useDebounce(search, 300);
  const observerTargetRef = useRef<HTMLDivElement>(null);

  const exercisesQuery = useExercisesInfinite(
    debouncedSearch || undefined,
    sortBy,
    sortOrder,
    20,
  );

  const templatesQuery = useExerciseTemplatesInfinite(
    debouncedSearch || undefined,
    sortBy,
    sortOrder,
    20,
  );

  const currentQuery =
    activeTab === 'library' ? exercisesQuery : templatesQuery;

  // Infinite scroll observer
  useEffect(() => {
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
    currentQuery.hasNextPage,
    currentQuery.isFetchingNextPage,
    currentQuery.fetchNextPage,
    currentQuery,
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

  const handleRemoveItem = (index: number) => {
    updateSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, item: SelectedItem) => {
    const updated = [...selectedItems];
    updated[index] = item;
    updateSelectedItems(updated);
  };

  const handleDone = () => {
    onDone?.(selectedItems);
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

  const allExercises = exercisesQuery.data?.pages.flat() || [];
  const allTemplates = templatesQuery.data?.pages.flat() || [];

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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] h-[85vh] max-w-[90vw] flex flex-col p-0">
        <div className="flex flex-col flex-1 min-h-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>{getHeaderTitle()}</DialogTitle>
          <DialogDescription>
            Select exercises from the library or templates
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-1 overflow-hidden">
          {/* Left Panel */}
          <div className="w-2/3 border-r px-6 flex flex-col overflow-hidden">
            {/* Tabs and Controls */}
            <ExerciseTabSwitcher
              activeTab={activeTab}
              onTabChange={setActiveTab}
            />
            <ExerciseSearchControls
              search={search}
              onSearchChange={setSearch}
              sortBy={sortBy}
              onSortChange={handleSortChange}
            />

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto">
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
                      <div className="col-span-full text-center py-4 text-gray-500">
                        Loading...
                      </div>
                    )) ||
                      (!exercisesQuery.hasNextPage &&
                        allExercises.length === 0 && (
                          <div className="col-span-full text-center py-4 text-gray-500">
                            No exercises found
                          </div>
                        ))}
                    {exercisesQuery.isError && (
                      <div className="col-span-full text-center py-4 text-red-500">
                        Error loading exercises
                      </div>
                    )}
                  </>
                ) : (
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
                      <div className="col-span-full text-center py-4 text-gray-500">
                        Loading...
                      </div>
                    )) ||
                      (!templatesQuery.hasNextPage &&
                        allTemplates.length === 0 && (
                          <div className="col-span-full text-center py-4 text-gray-500">
                            No templates found
                          </div>
                        ))}
                    {templatesQuery.isError && (
                      <div className="col-span-full text-center py-4 text-red-500">
                        Error loading templates
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Infinite scroll trigger */}
              <div ref={observerTargetRef} className="h-4" />
              {currentQuery.hasNextPage && !currentQuery.isFetchingNextPage && (
                <div className="mt-4 flex justify-center">
                  <Button
                    onClick={() => currentQuery.fetchNextPage()}
                    disabled={currentQuery.isFetchingNextPage}
                    className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                  >
                    Load More
                  </Button>
                </div>
              )}
              {currentQuery.isFetchingNextPage && (
                <div className="mt-4 flex justify-center">
                  <div className="text-gray-500">Loading more...</div>
                </div>
              )}
            </div>
          </div>

          {/* Right Panel - Selected Items */}
          <div className="w-1/3 flex flex-col overflow-y-auto px-6 slim-scrollbar">
            <h4 className="font-semibold mb-4">Selected Items</h4>
            {!showGroupInput ? (
              <button
                onClick={() => setShowGroupInput(true)}
                className="cursor-pointer mb-4 p-2 border-2 border-dashed border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600"
              >
                + Add Group
              </button>
            ) : (
              <div className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  value={groupNameInput}
                  onChange={(e) => setGroupNameInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleAddGroup();
                    } else if (e.key === 'Escape') {
                      handleCancelGroupInput();
                    }
                  }}
                  placeholder="Group name..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoFocus
                />
                <button
                  onClick={handleAddGroup}
                  className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 cursor-pointer"
                >
                  <Check className="h-4 w-4" />
                </button>
                <button
                  onClick={handleCancelGroupInput}
                  className="p-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
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

        <DialogFooter className="p-6 border-t">
          <Button onClick={handleCancel} variant="outline">
            Cancel
          </Button>
          <Button
            onClick={handleDone}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Done
          </Button>
        </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
