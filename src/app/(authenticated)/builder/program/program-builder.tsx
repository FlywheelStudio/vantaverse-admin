'use client';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProgramAssignments } from '@/hooks/use-program-assignments';
import { ProgramTemplateCard } from './program-template-card';
import { CreateTemplateForm } from './create-template-form';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useDebounce } from '@/hooks/use-debounce';
import { useIsMobile } from '@/hooks/use-mobile';
import { useBuilder } from '@/context/builder-context';
import { useQueryClient } from '@tanstack/react-query';
import { deleteProgramAssignment } from '../actions';
import toast from 'react-hot-toast';
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
  const { data: assignments, isLoading } = useProgramAssignments();
  const { setSelectedTemplateId } = useBuilder();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const [searchValue, setSearchValue] = useState('');
  const [weeksFilter, setWeeksFilter] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(1);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const pageSize = 16;

  // Reset to page 1 when search or filter changes
  const handleSearchChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const handleFilterChange = useCallback(() => {
    setCurrentPage(1);
  }, []);

  const debouncedSearch = useDebounce(searchValue, 300, handleSearchChange);
  const debouncedWeeksFilter = useDebounce(
    weeksFilter,
    300,
    handleFilterChange,
  );
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const loadedOnceRef = useRef(false);

  // Filter assignments by search term and filters
  const filteredAssignments = assignments?.filter((assignment) => {
    const template = assignment.program_template;
    if (!template) return false;

    // Search filter (name, description, and goals)
    if (debouncedSearch) {
      const searchLower = debouncedSearch.toLowerCase();
      const matchesName = template.name.toLowerCase().includes(searchLower);
      const matchesDescription = template.description
        ?.toLowerCase()
        .includes(searchLower);
      const matchesGoals = template.goals?.toLowerCase().includes(searchLower);
      if (!matchesName && !matchesDescription && !matchesGoals) return false;
    }

    // Weeks filter
    if (debouncedWeeksFilter) {
      const weeksValue = Number.parseInt(debouncedWeeksFilter, 10);
      if (!Number.isNaN(weeksValue) && template.weeks !== weeksValue) {
        return false;
      }
    }

    return true;
  });

  // Paginate filtered assignments
  const { paginatedAssignments, totalPages, totalCount } = useMemo(() => {
    const allFiltered = filteredAssignments || [];
    const total = allFiltered.length;
    const pages = Math.ceil(total / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = allFiltered.slice(startIndex, endIndex);
    return {
      paginatedAssignments: paginated,
      totalPages: pages,
      totalCount: total,
    };
  }, [filteredAssignments, currentPage, pageSize]);

  const displayAssignments = paginatedAssignments;

  // Track if we've loaded data at least once
  useEffect(() => {
    if (!isLoading && displayAssignments.length > 0 && !loadedOnceRef.current) {
      loadedOnceRef.current = true;
      setTimeout(() => {
        setHasLoadedOnce(true);
      }, 0);
    }
  }, [isLoading, displayAssignments.length]);

  const handleCardClick = (assignment: ProgramAssignmentWithTemplate) => {
    const templateId = assignment.program_template?.id;
    if (templateId) {
      setSelectedTemplateId(templateId);
      onTemplateSelect?.(assignment);
    }
  };

  const handleCreateSuccess = () => {
    setShowCreateForm(false);
  };

  const handleCreateCancel = () => {
    setShowCreateForm(false);
  };

  const handleDelete = async (assignmentId: string) => {
    const result = await deleteProgramAssignment(assignmentId);
    if (result.success) {
      queryClient.invalidateQueries({ queryKey: ['program-assignments'] });
      toast.success('Program deleted successfully');
    } else {
      toast.error(result.error || 'Failed to delete program');
    }
  };

  return (
    <div className="p-6 flex-1 min-h-0 overflow-y-auto h-full slim-scrollbar glass-background">
      {hasLoadedOnce && (
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
                  {displayAssignments.length === 0 ? (
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
                          {displayAssignments.map((assignment) => (
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

                      {/* Pagination Controls */}
                      {totalPages > 1 && (
                        <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                          <p className="text-sm text-gray-600">
                            Showing {(currentPage - 1) * pageSize + 1}-
                            {Math.min(currentPage * pageSize, totalCount)} of{' '}
                            {totalCount} programs
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
        </>
      )}
    </div>
  );
}
