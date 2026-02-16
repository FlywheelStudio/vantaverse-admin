'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useExercises } from '@/hooks/use-exercises';
import { ExerciseCard } from './partials/exercise-card';
import { ExerciseModal } from './partials/exercise-modal';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

const ASSIGNMENT_FILTER_LABEL: Record<AssignmentFilter, string> = {
  all: 'All',
  unassigned: 'Unassigned',
  assigned: 'Assigned',
};

function formatTypeLabel(type: string) {
  return type
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

interface ExerciseLibraryProps {
  initialExercises?: Exercise[];
}

export function ExerciseLibrary({ initialExercises }: ExerciseLibraryProps) {
  const { data: exercises, isLoading } = useExercises(initialExercises);
  const [searchValue, setSearchValue] = useState('');
  const [assignmentFilter, setAssignmentFilter] =
    useState<AssignmentFilter>('all');
  const [typeFilter, setTypeFilter] = useState<string | null>(null);
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
  const typeOptions = useMemo(
    () =>
      [...new Set(exercises?.map((exercise) => exercise.type).filter(Boolean))]
        .map((type) => type as string)
        .sort((a, b) => a.localeCompare(b)),
    [exercises],
  );

  // Filter exercises by search term, type and assignment filter
  const filteredExercises = exercises?.filter((exercise) => {
    // Search filter
    if (debouncedSearch) {
      const matchesSearch = exercise.exercise_name
        .toLowerCase()
        .includes(debouncedSearch.toLowerCase());
      if (!matchesSearch) return false;
    }

    // Type filter
    if (typeFilter && exercise.type !== typeFilter) {
      return false;
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
    <>
      <Card className="overflow-hidden">
        <div className="px-6 py-6 overflow-y-auto max-h-[calc(100vh-8rem)] slim-scrollbar">
          {isLoading ? (
            <div className="flex items-center justify-center h-24">
              <div className="flex items-center gap-2">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-muted-foreground">Loading exercises...</span>
              </div>
            </div>
          ) : (
            <>
              {/* Search and Filter */}
              <div className="mb-6 flex max-w-2xl gap-3">
                <Input
                  type="text"
                  placeholder="Search exercises..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="flex-1"
                />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-11 w-40 justify-between rounded-pill bg-background"
                    >
                      {ASSIGNMENT_FILTER_LABEL[assignmentFilter]}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-40">
                    {(
                      ['all', 'unassigned', 'assigned'] as const
                    ).map((value) => (
                      <DropdownMenuItem
                        key={value}
                        onClick={() => {
                          setAssignmentFilter(value);
                          handleFilterChange();
                        }}
                        data-selected={assignmentFilter === value}
                        className="cursor-pointer truncate data-[selected=true]:bg-primary/10! data-[selected=true]:focus:bg-primary/10!"
                      >
                        {ASSIGNMENT_FILTER_LABEL[value]}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="h-11 w-44 justify-between rounded-pill bg-background"
                    >
                      {typeFilter ? formatTypeLabel(typeFilter) : 'All sources'}
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-44">
                    <DropdownMenuItem
                      onClick={() => {
                        setTypeFilter(null);
                        handleFilterChange();
                      }}
                      data-selected={typeFilter === null}
                      className="cursor-pointer truncate data-[selected=true]:bg-primary/10! data-[selected=true]:focus:bg-primary/10!"
                    >
                      All sources
                    </DropdownMenuItem>
                    {typeOptions.map((type) => (
                      <DropdownMenuItem
                        key={type}
                        onClick={() => {
                          setTypeFilter(type);
                          handleFilterChange();
                        }}
                        data-selected={typeFilter === type}
                        className="cursor-pointer truncate data-[selected=true]:bg-primary/10! data-[selected=true]:focus:bg-primary/10!"
                      >
                        {formatTypeLabel(type)}
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
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
                      <p className="text-muted-foreground text-sm">
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
                        <div className="mt-8 flex items-center justify-between pt-6">
                          <p className="text-muted-foreground text-sm">
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
                            <span className="text-muted-foreground px-3 text-sm">
                              Page {currentPage} of {totalPages}
                            </span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() =>
                                setCurrentPage((p) => Math.min(totalPages, p + 1))
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
            </>
          )}
        </div>
      </Card>

      {/* Exercise Modal */}
      <ExerciseModal
        key={selectedExercise?.id}
        exercise={selectedExercise}
        open={isModalOpen}
        onOpenChange={handleModalClose}
      />
    </>
  );
}
