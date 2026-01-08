'use client';

import { PageWrapper } from '@/components/page-wrapper';
import { BuilderContextProvider } from '@/context/builder-context';
import { ProgramBuilder } from './program/program-builder';
import { WorkoutBuilder } from './workout-schedule/workout-builder';
import { useBuilder } from '@/context/builder-context';

function BuilderContent() {
  const { selectedTemplateId } = useBuilder();

  return <>{selectedTemplateId ? <WorkoutBuilder /> : <ProgramBuilder />}</>;
}

export default function BuilderPage() {
  return (
    <PageWrapper
      subheader={
        <div className="flex items-center gap-2">
          <span className="text-2xl font-medium">Program Builder</span>
        </div>
      }
    >
      <BuilderContextProvider>
        <BuilderContent />
      </BuilderContextProvider>
    </PageWrapper>
  );
}
