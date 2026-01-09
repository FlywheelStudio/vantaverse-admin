'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useExercisesInfinite } from '@/hooks/use-exercises-infinite';
import { useExerciseTemplatesInfinite } from '@/hooks/use-exercise-templates-infinite';
import { useDebounce } from '@/hooks/use-debounce';
import type { Exercise } from '@/lib/supabase/schemas/exercises';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';
import { ExerciseTabSwitcher } from './exercise-tab-switcher';
import { ExerciseSearchControls } from './exercise-search-controls';
import { ExerciseLibraryCard } from './exercise-library-card';
import { ExerciseTemplateCard } from './exercise-template-card';
import { SelectedItemsList } from './selected-items-list';

type TabType = 'library' | 'templates';

type SelectedItem =
  | { type: 'exercise'; data: Exercise }
  | { type: 'template'; data: ExerciseTemplate };

interface ExerciseBuilderModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onDone?: (selectedItems: SelectedItem[]) => void;
}

export function ExerciseBuilderModal({
  open,
  onOpenChange,
  onDone,
}: ExerciseBuilderModalProps) {
  const [activeTab, setActiveTab] = useState<TabType>('library');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('updated_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([]);

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

  const handleAddExercise = (exercise: Exercise) => {
    setSelectedItems((prev) => [...prev, { type: 'exercise', data: exercise }]);
  };

  const handleAddTemplate = (template: ExerciseTemplate) => {
    setSelectedItems((prev) => [...prev, { type: 'template', data: template }]);
  };

  const handleRemoveItem = (index: number) => {
    setSelectedItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpdateItem = (index: number, item: SelectedItem) => {
    setSelectedItems((prev) => {
      const updated = [...prev];
      updated[index] = item;
      return updated;
    });
  };

  const handleDone = () => {
    onDone?.(selectedItems);
    onOpenChange(false);
    setSelectedItems([]);
    setSearch('');
  };

  const handleCancel = () => {
    onOpenChange(false);
    setSelectedItems([]);
    setSearch('');
  };

  const handleSortChange = (by: string, order: 'asc' | 'desc') => {
    setSortBy(by);
    setSortOrder(order);
  };

  const allExercises = exercisesQuery.data?.pages.flat() || [];
  const allTemplates = templatesQuery.data?.pages.flat() || [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[90vw] h-[85vh] max-w-[90vw] flex flex-col p-0">
        <DialogHeader className="p-6 border-b">
          <DialogTitle>Add Exercises or Groups</DialogTitle>
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
          <div className="w-1/3 flex flex-col overflow-y-auto px-6">
            <h4 className="font-semibold mb-4">Selected Items</h4>
            <button className="mb-4 p-2 border-2 border-dashed border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600">
              + Add Group
            </button>
            <SelectedItemsList
              items={selectedItems}
              onRemove={handleRemoveItem}
              onUpdate={handleUpdateItem}
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
      </DialogContent>
    </Dialog>
  );
}
