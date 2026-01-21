'use client';

import { useEffect, useRef } from 'react';
import { useBuilder } from '@/context/builder-context';
import { useProgramAssignment } from '@/hooks/use-program-assignments';
import { ProgramDetailsSection } from '../program/ui';
import { BuildWorkoutSection } from './ui';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface WorkoutBuilderProps {
  assignmentId: string | undefined;
}

export function WorkoutBuilder({ assignmentId }: WorkoutBuilderProps) {
  const { schedule, initializeSchedule, setSelectedAssignmentId, programAssignmentId } = useBuilder();
  const { data: assignment, isLoading, error } = useProgramAssignment(assignmentId);
  const router = useRouter();
  const hasInitializedRef = useRef(false);

  // Set assignment ID in context only once when component mounts
  useEffect(() => {
    if (assignmentId && programAssignmentId !== assignmentId) {
      setSelectedAssignmentId(assignmentId);
      hasInitializedRef.current = false;
    }
  }, [assignmentId, programAssignmentId, setSelectedAssignmentId]);



  // Initialize schedule when assignment loads (only if schedule is empty and not loading)
  // Context handles loading from database, but we need to initialize empty schedule structure
  useEffect(() => {
    const scheduleIsEmpty = schedule.length === 0;
    if (assignment?.program_template && !isLoading && !hasInitializedRef.current && scheduleIsEmpty) {
      hasInitializedRef.current = true;
      initializeSchedule(assignment.program_template.weeks);
    }
  }, [assignment?.program_template, isLoading, initializeSchedule]);

  const template = assignment?.program_template ?? null;

  if (!assignmentId) {
    return (
      <div
        suppressHydrationWarning
        className="p-6 flex-1 min-h-0 overflow-y-auto h-full slim-scrollbar flex items-center justify-center"
      >
        <p className="text-gray-500">Invalid program ID</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div
        suppressHydrationWarning
        className="p-6 flex-1 min-h-0 overflow-y-auto h-full slim-scrollbar flex items-center justify-center"
      >
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div
        suppressHydrationWarning
        className="p-6 flex-1 min-h-0 overflow-y-auto h-full slim-scrollbar flex items-center justify-center"
      >
        <p className="text-red-500">Error loading program: {error.message}</p>
      </div>
    );
  }

  if (!assignment || !template) {
    return (
      <div suppressHydrationWarning>
        <p className="text-gray-500">Program not found</p>
      </div>
    );
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/builder')}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 cursor-pointer glass-background"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>

        <Card className="text-card-foreground flex flex-col gap-6 bg-white/95 rounded-3xl border-2 border-white/50 shadow-2xl overflow-hidden backdrop-blur-sm">
          <div className="p-6 sm:p-8 space-y-6">
            <ProgramDetailsSection template={template} />
            <BuildWorkoutSection initialWeeks={template.weeks} />
          </div>
        </Card>
      </motion.div>
    </>
  );
}
