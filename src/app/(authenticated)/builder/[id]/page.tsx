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
        <p className="text-gray-500">Invalid program ID</p>
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
