'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search } from 'lucide-react';
import { PageWrapper } from '@/components/page-wrapper';
import { useExercises } from '@/hooks/use-exercises';
import { ExerciseCard } from './exercise-card';
import { ExerciseModal } from './exercise-modal';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
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

export default function ExercisesPage() {
  const { data: exercises, isLoading } = useExercises();
  const [searchValue, setSearchValue] = useState('');
  const debouncedSearch = useDebounce(searchValue, 300);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(
    null,
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const loadedOnceRef = useRef(false);

  // Filter exercises by search term
  const filteredExercises = exercises?.filter((exercise) => {
    if (!debouncedSearch) return true;
    return exercise.exercise_name
      .toLowerCase()
      .includes(debouncedSearch.toLowerCase());
  });

  const displayExercises = filteredExercises || [];

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
    <PageWrapper subheader={<h1 className="text-2xl font-medium">Exercise Library</h1>}>
      <div className="p-6 flex-1 min-h-0 overflow-y-auto h-full slim-scrollbar glass-background">
        {hasLoadedOnce && (
          <Card className="text-card-foreground flex flex-col gap-6 bg-white/95 rounded-3xl border-2 border-white/50 shadow-2xl overflow-hidden backdrop-blur-sm">
            <div className="p-6 sm:p-8">
              {/* Search and Filters */}
              <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search exercises..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="pl-10 bg-white border-gray-200"
                  />
                </div>

                {/* Filter Dropdowns - UI Only for now */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    All Muscles
                  </button>
                  <button
                    type="button"
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                  >
                    All Levels
                  </button>
                </div>
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                      {displayExercises.map((exercise) => (
                        <ExerciseCard
                          key={exercise.id}
                          exercise={exercise}
                          onClick={() => handleCardClick(exercise)}
                        />
                      ))}
                    </div>
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
