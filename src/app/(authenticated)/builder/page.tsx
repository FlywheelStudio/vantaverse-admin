import { PageWrapper } from '@/components/page-wrapper';
import { BuilderContextProvider } from '@/context/builder-context';
import { ProgramBuilder } from './program/program-builder';

export default function BuilderPage() {
  return (
    <PageWrapper
      subheader={
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-medium">Program Builder</h1>
        </div>
      }
    >
      <BuilderContextProvider>
        <ProgramBuilder />
      </BuilderContextProvider>
    </PageWrapper>
  );
}
