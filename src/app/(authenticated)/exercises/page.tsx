'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { PageWrapper } from '@/components/page-wrapper';
import { Button } from '@/components/ui/button';
import { useExercises } from '@/hooks/use-exercises';
import { ExerciseCard } from './exercise-card';
import { ExerciseModal } from './exercise-modal';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { useDebounce } from '@/hooks/use-debounce';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

const contentVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    y: 20,
    transition: {
      duration: 0.3,
    },
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
    },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: {
      duration: 0.3,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.95,
    transition: {
      duration: 0.2,
    },
  },
};

type AssignmentFilter = 'all' | 'unassigned' | 'assigned';

export default function ExercisesPage() {
  const { data: exercises, isLoading } = useExercises();
  const [searchValue, setSearchValue] = useState('');
  const [assignmentFilter, setAssignmentFilter] =
    useState<AssignmentFilter>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 16;

  // Reset to page 1 when search or filter changes
  const handleSearchChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const debouncedSearch = useDebounce(searchValue, 300, handleSearchChange);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const loadedOnceRef = useRef(false);

  // Filter exercises by search term and assignment filter
  const filteredExercises = exercises?.filter((exercise) => {
    // Search filter
    if (debouncedSearch) {
      const matchesSearch = exercise.exercise_name
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Assignment filter
    const assignedCount = exercise.assigned_count ?? 0;
    if (assignmentFilter === 'unassigned') {
      return assignedCount === 0;
    }
    if (assignmentFilter === 'assigned') {
      return assignedCount > 0;
    }

    return true;
  });

  // Paginate filtered exercises
  const { paginatedExercises, totalPages, totalCount } = useMemo(() => {
    const allFiltered = filteredExercises || [];
    const total = allFiltered.length;
    const pages = Math.ceil(total / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = allFiltered.slice(startIndex, endIndex);
    return {
      paginatedExercises: paginated,
      totalPages: pages,
      totalCount: total,
    };
  }, [filteredExercises, currentPage, pageSize]);

  const displayExercises = paginatedExercises;

  // Track if we've loaded data at least once
  useEffect(() => {
    if (!isLoading && displayExercises.length > 0 && !loadedOnceRef.current) {
      loadedOnceRef.current = true;
      // Use setTimeout to defer state update and avoid setState in effect warning
      setTimeout(() => {
        setHasLoadedOnce(true);
      }, 0);
    }
  }, [isLoading, displayExercises.length]);

  const handleCardClick = (exercise: Exercise) => {
    setSelectedExercise(exercise);
    setIsModalOpen(true);
  };

  const handleModalClose = (open: boolean) => {
    setIsModalOpen(open);
    if (!open) {
      setSelectedExercise(null);
    }
  };

  return (
    <PageWrapper
      subheader={<h1 className="text-2xl font-medium">Exercise Library</h1>}
    >
      <div className="p-6 flex-1 min-h-0 overflow-y-auto h-full slim-scrollbar glass-background">
        {hasLoadedOnce && (
          <Card className="text-card-foreground flex flex-col gap-6 bg-white/95 rounded-3xl border-2 border-white/50 shadow-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 sm:p-8">
              {/* Search and Filter */}
              <div className="mb-6 flex gap-3 max-w-md">
                <Input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="bg-white border-gray-200 flex-1"
                />
                <Select
                  value={assignmentFilter}
                  onChange={(e) => {
                    setAssignmentFilter(e.target.value as AssignmentFilter);
                    handleFilterChange();
                  }}
                  className="bg-white border-gray-200 w-40"
                >
                  <option value="all">All</option>
                  <option value="unassigned">Unassigned</option>
                  <option value="assigned">Assigned</option>
                </Select>
              </div>

              {/* Exercises Grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key="grid"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {displayExercises.length === 0 ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-gray-500">
                        {debouncedSearch
                          ? 'No exercises found matching your search.'
                          : 'No exercises available.'}
                      </p>
                    </div>
                  ) : (
                    <>
                      <motion.div
                        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                      >
                        <AnimatePresence mode="popLayout">
                          {displayExercises.map((exercise) => (
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

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                          <p className="text-sm text-gray-600">
                            Showing {(currentPage - 1) * pageSize + 1}-
                            {Math.min(currentPage * pageSize, totalCount)} of{' '}
                            {totalCount} exercises
                          </p>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((p) => Math.max(1, p - 1))
                              }
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              Previous
                            </Button>
                            <span className="px-3 text-sm text-gray-700">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((p) =>
                                  Math.min(totalPages, p + 1),
                                )
                              }
                              disabled={currentPage === totalPages}
                            >
                              Next
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </Card>
        )}
      </div>

      {/* Exercise Modal */}
      <ExerciseModal
        key={selectedExercise?.id}
        exercise={selectedExercise}
        open={isModalOpen}
        onOpenChange={handleModalClose}
      />
    </PageWrapper>
  );
}
