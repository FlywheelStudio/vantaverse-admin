'use client';

import { startTransition, useEffect, useState } from 'react';
import { useBuilder } from '@/context/builder-context';
import { useProgramTemplate } from '@/hooks/use-program-template';
import { ProgramDetailsSection } from '../program/ui';
import { BuildWorkoutSection } from './ui';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

interface WorkoutBuilderProps {
  templateId: string | undefined;
}

export function WorkoutBuilder({ templateId }: WorkoutBuilderProps) {
  const { initializeSchedule, setSelectedTemplateId } = useBuilder();
  const { data: template, isLoading, error } = useProgramTemplate(templateId);
  const router = useRouter();
  const [isMounted, setIsMounted] = useState(false);

  // Set template ID in context for programAssignmentId fetching
  useEffect(() => {
    if (templateId) {
      setSelectedTemplateId(templateId);
    }
    return () => {
      setSelectedTemplateId(null);
    };
  }, [templateId, setSelectedTemplateId]);

  // Ensure component only renders after hydration
  useEffect(() => {
    startTransition(() => {
      setIsMounted(true);
    });
  }, []);

  // Initialize schedule when template loads
  useEffect(() => {
    if (template) {
      initializeSchedule(template.weeks);
    }
  }, [template, initializeSchedule]);

  if (!isMounted) {
    return (
      <div
        suppressHydrationWarning
        className="p-6 flex-1 min-h-0 overflow-y-auto h-full slim-scrollbar flex items-center justify-center"
      >
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  if (!templateId) {
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
        <p className="text-red-500">Error loading template: {error.message}</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div suppressHydrationWarning>
        <p className="text-gray-500">Template not found</p>
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
