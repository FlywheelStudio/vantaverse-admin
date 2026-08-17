'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  Icon,
  Input,
  Pagination,
  Select,
} from '@/components/medvanta';
import { useExercises } from '@/hooks/use-exercises';
import { ExerciseCard } from './partials/exercise-card';
import { ExerciseModal } from './partials/exercise-modal';
import { useDebounce } from '@/hooks/use-debounce';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: { duration: 0.3 },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.3 },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: { duration: 0.2 },
  },
};

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
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 16;

  const handleSearchChange = useCallback((): void => {
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback((): void => {
    setCurrentPage(1);
  }, []);

  const debouncedSearch = useDebounce(searchValue, 300, handleSearchChange);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const typeOptions = useMemo(
    () =>
      [...new Set(exercises?.map((exercise) => exercise.type).filter(Boolean))]
        .map((type) => type as string)
        .sort((a, b) => a.localeCompare(b)),
    [exercises],
  );

  const filteredExercises = exercises?.filter((exercise) => {
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

  const { paginatedExercises, totalPages, totalCount } = useMemo(() => {
    const allFiltered = filteredExercises || [];
    const total = allFiltered.length;
    const pages = Math.max(1, Math.ceil(total / pageSize));
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = allFiltered.slice(startIndex, endIndex);
    return {
      paginatedExercises: paginated,
      totalPages: pages,
      totalCount: total,
    };
  }, [filteredExercises, currentPage, pageSize]);

  const handleCardClick = (exercise: Exercise): void => {
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const handleModalClose = (open: boolean): void => {
    setIsModalOpen(open);
    if (!open) setSelectedExercise(null);
  };

  const assignmentSelectOptions = [
    { value: 'all', label: 'All' },
    { value: 'unassigned', label: 'Unassigned' },
    { value: 'assigned', label: 'Assigned' },
  ];

  const typeSelectOptions = [
    { value: 'all', label: 'All sources' },
    ...typeOptions.map((type) => ({ value: type, label: formatTypeLabel(type) })),
  ];

  return (
    <>
      <Card padding={0} className="overflow-hidden">
        <div className="slim-scrollbar max-h-[calc(100vh-8rem)] overflow-y-auto px-6 py-6">
          {isLoading ? (
            <div className="flex h-24 items-center justify-center">
              <div className="flex items-center gap-2">
                <Icon name="LoaderCircle" size={20} className="animate-spin text-[var(--primary)]" />
                <span className="text-[var(--text-muted)]">Loading exercises...</span>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-6 flex max-w-2xl flex-wrap gap-3">
                <Input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  iconLeft="Search"
                  className="min-w-[200px] flex-1"
                />
                <Select
                  value={assignmentFilter}
                  options={assignmentSelectOptions}
                  onChange={(e) => {
                    setAssignmentFilter(e.target.value as AssignmentFilter);
                    handleFilterChange();
                  }}
                  className="w-40"
                />
                <Select
                  value={typeFilter}
                  options={typeSelectOptions}
                  onChange={(e) => {
                    setTypeFilter(e.target.value);
                    handleFilterChange();
                  }}
                  className="w-44"
                />
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key="grid"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {paginatedExercises.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
                        {debouncedSearch
                          ? 'No exercises found matching your search.'
                          : 'No exercises available.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <motion.div
                        className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <AnimatePresence mode="popLayout">
                          {paginatedExercises.map((exercise) => (
                            <motion.div
                              key={exercise.id}
                              variants={cardVariants}
                              exit="exit"
                              layout
                              className="h-full"
                            >
                              <ExerciseCard
                                exercise={exercise}
                                onClick={() => handleCardClick(exercise)}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>

                      {totalPages > 1 ? (
                        <div className="mt-8 flex items-center justify-between border-t border-[var(--border-subtle)] pt-6">
                          <p className="text-[length:var(--text-sm)] text-[var(--text-muted)]">
                            Showing {(currentPage - 1) * pageSize + 1}-
                            {Math.min(currentPage * pageSize, totalCount)} of {totalCount} exercises
                          </p>
                          <Pagination
                            page={currentPage}
                            pageCount={totalPages}
                            onChange={setCurrentPage}
                          />
                        </div>
                      ) : null}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </>
          )}
        </div>
      </Card>

      <ExerciseModal
        key={selectedExercise?.id}
        exercise={selectedExercise}
        open={isModalOpen}
        onOpenChange={handleModalClose}
      />
    </>
  );
}
