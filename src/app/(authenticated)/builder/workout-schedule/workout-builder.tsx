'use client';

import { useEffect, useRef } from 'react';
import { useBuilder } from '@/context/builder-context';
import { programAssignmentQueryOptions } from '@/hooks/use-passignments';
import { useHasScheduleData } from '@/hooks/use-workout-schedule';
import { useQuery } from '@tanstack/react-query';
import { ProgramDetailsSection } from '../program/ui';
import { BuildWorkoutSection } from './ui';
import { Card } from '@/components/ui/card';
import { motion } from 'framer-motion';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

interface WorkoutBuilderProps {
  assignmentId: string | undefined;
  initialAssignment: ProgramAssignmentWithTemplate;
}

export function WorkoutBuilder({ 
  assignmentId, 
  initialAssignment,
}: WorkoutBuilderProps) {
  const { initializeSchedule, setSelectedAssignmentId } = useBuilder();
  
  useEffect(() => {
    if (assignmentId) {
      setSelectedAssignmentId(assignmentId);
    }
  }, [assignmentId, setSelectedAssignmentId]);
  
  const { data: assignment } = useQuery(
    programAssignmentQueryOptions(assignmentId, initialAssignment)
  );
  const { data: hasScheduleData, isSuccess } = useHasScheduleData(assignmentId);
  
  const initializedAssignmentRef = useRef<string | null>(null);

  useEffect(() => {
    if (
      assignment?.program_template &&
      assignmentId &&
      initializedAssignmentRef.current !== assignmentId &&
      isSuccess &&
      hasScheduleData === false
    ) {
      initializedAssignmentRef.current = assignmentId;
      initializeSchedule(assignment.program_template.weeks);
    }
  }, [assignment?.program_template?.weeks, assignmentId, initializeSchedule, hasScheduleData, isSuccess]);

  const template = assignment?.program_template ?? null;

  if (!assignment || !template) {
    return (
      <div
        suppressHydrationWarning
        className="p-6 flex-1 min-h-0 overflow-y-auto h-full slim-scrollbar flex items-center justify-center"
      >
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
