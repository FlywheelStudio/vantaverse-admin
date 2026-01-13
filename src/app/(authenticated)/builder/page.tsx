'use client';

import { PageWrapper } from '@/components/page-wrapper';
import { BuilderContextProvider } from '@/context/builder-context';
import { ProgramBuilder } from './program/program-builder';

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
        <ProgramBuilder />
      </BuilderContextProvider>
    </PageWrapper>
  );
}
