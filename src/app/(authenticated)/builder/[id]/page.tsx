'use client';

import { useParams } from 'next/navigation';
import { PageWrapper } from '@/components/page-wrapper';
import { BuilderContextProvider } from '@/context/builder-context';
import { WorkoutBuilder } from '../workout-schedule/workout-builder';

export default function BuilderIdPage() {
  const params = useParams();
  const id = params?.id as string | undefined;

  if (!id) {
    return (
      <PageWrapper
        subheader={
          <div className="flex items-center gap-2">
            <span className="text-2xl font-medium">Program Builder</span>
          </div>
        }
      >
        <div className="p-6 flex-1 min-h-0 overflow-y-auto h-full slim-scrollbar glass-background flex items-center justify-center">
          <p className="text-gray-500">Invalid program ID</p>
        </div>
      </PageWrapper>
    );
  }

  return (
    <PageWrapper
      subheader={
        <div className="flex items-center gap-2">
          <span className="text-2xl font-medium">Program Builder</span>
        </div>
      }
    >
      <BuilderContextProvider>
        <WorkoutBuilder templateId={id} />
      </BuilderContextProvider>
    </PageWrapper>
  );
}
