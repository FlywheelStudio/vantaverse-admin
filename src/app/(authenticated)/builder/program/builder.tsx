'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  useProgramAssignments,
  useDeleteProgramAssignment,
  programAssignmentsInfiniteQueryOptions,
} from '@/hooks/use-passignments';
import { ProgramTemplateCard } from './card';
import { CreateTemplateForm } from './form';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

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

interface ProgramBuilderProps {
  onTemplateSelect?: (assignment: ProgramAssignmentWithTemplate) => void;
}

export function ProgramBuilder({ onTemplateSelect }: ProgramBuilderProps) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState('');
  const [weeksFilter, setWeeksFilter] = useState<string>('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const pageSize = 21;

  // Debounce search and weeks filter
  const debouncedSearch = useDebounce(searchValue, 300);
  const debouncedWeeksFilter = useDebounce(weeksFilter, 300);

  // Parse weeks filter to number
  const weeksFilterNumber =
    debouncedWeeksFilter && !Number.isNaN(Number.parseInt(debouncedWeeksFilter, 10))
      ? Number.parseInt(debouncedWeeksFilter, 10)
      : undefined;

  // Use infinite query with server-side filtering
  const {
    assignments,
    isLoading,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
  } = useProgramAssignments(debouncedSearch, weeksFilterNumber, pageSize);

  const prefetchTriggeredRef = useRef(false);

  // Delete mutation hook
  const deleteMutation = useDeleteProgramAssignment(
    debouncedSearch,
    weeksFilterNumber,
    pageSize,
  );

  const handleCardClick = (assignment: ProgramAssignmentWithTemplate) => {
    if (assignment.id) {
      router.push(`/builder/${assignment.id}`);
      onTemplateSelect?.(assignment);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  const handleDelete = useCallback(
    (assignmentId: string) => {
      deleteMutation.mutate(assignmentId);
    },
    [deleteMutation],
  );

  // Reset prefetch trigger when filters change
  useEffect(() => {
    prefetchTriggeredRef.current = false;
  }, [debouncedSearch, weeksFilterNumber]);

  // Infinite scroll with prefetching using scroll position
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;

    const queryOptions = programAssignmentsInfiniteQueryOptions(
      debouncedSearch,
      weeksFilterNumber,
      pageSize,
    );

    const handleScroll = () => {
      const scrollProgress =
        (window.scrollY + window.innerHeight) /
        document.documentElement.scrollHeight;

      // Prefetch at 80% scroll
      if (scrollProgress > 0.8 && !prefetchTriggeredRef.current) {
        prefetchTriggeredRef.current = true;
        queryClient.prefetchInfiniteQuery(queryOptions);
      }

      // Actually fetch at 90% scroll
      if (scrollProgress > 0.9) {
        fetchNextPage().then(() => {
          // Reset prefetch trigger after fetching so we can prefetch next page
          prefetchTriggeredRef.current = false;
        });
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    queryClient,
    debouncedSearch,
    weeksFilterNumber,
    pageSize,
  ]);

  return (
    <>
      {/* Create Form */}
          {showCreateForm && (
            <CreateTemplateForm
              onSuccess={handleCreateSuccess}
              onCancel={handleCreateCancel}
            />
          )}

          <Card className="text-card-foreground flex flex-col gap-6 bg-white/95 rounded-3xl border-2 border-white/50 shadow-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 sm:p-8">
              {/* Header with Create Button */}
              {/* Filters */}
              <div className="mb-6 flex gap-3 flex-wrap items-center">
                <Button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  disabled={showCreateForm}
                  className="bg-[#2454FF] hover:bg-[#1E3FCC] text-white font-semibold px-6 rounded-xl shadow-lg cursor-pointer flex items-center gap-2 shrink-0"
                >
                  {isMobile ? (
                    <Plus className="h-4 w-4" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4" />
                      Create New Template
                    </>
                  )}
                </Button>
                <Input
                  type="text"
                  placeholder="Search by name, description, or goals..."
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  className="bg-white border-gray-200 flex-1 min-w-[200px]"
                />
                <Input
                  type="number"
                  placeholder="Filter by weeks..."
                  value={weeksFilter}
                  onChange={(e) => setWeeksFilter(e.target.value)}
                  className="bg-white border-gray-200 w-40 shrink-0"
                />
              </div>

              {/* Templates Grid */}
              <AnimatePresence mode="wait">
                <motion.div
                  key="grid"
                  variants={contentVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {assignments.length === 0 && !isLoading ? (
                    <div className="flex items-center justify-center py-12">
                      <p className="text-gray-500">
                        {debouncedSearch || debouncedWeeksFilter
                          ? 'No programs found matching your filters.'
                          : 'No programs available.'}
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
                          {assignments.map((assignment) => (
                            <motion.div
                              key={assignment.id}
                              variants={cardVariants}
                              exit="exit"
                              layout
                              className="h-full"
                            >
                              <ProgramTemplateCard
                                assignment={assignment}
                                onClick={() => handleCardClick(assignment)}
                                onDelete={() => handleDelete(assignment.id)}
                              />
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </motion.div>

                      {/* Loading indicator */}
                      {isFetchingNextPage && (
                        <div className="flex items-center justify-center py-8">
                          <p className="text-gray-500">Loading more programs...</p>
                        </div>
                      )}
                    </>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </Card>
    </>
  );
}
