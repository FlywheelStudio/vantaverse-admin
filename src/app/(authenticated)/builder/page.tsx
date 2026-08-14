import { PageWrapper } from '@/components/page-wrapper';
import { ProgramBuilder } from './program/builder';
import { PreProgramCard } from './program/pre-program-card';
import { getProgramAssignmentsPaginated, getPreProgramTemplate } from './actions';
import { BuilderContextProvider } from '@/context/builder-context';

export default async function BuilderPage() {
  const pageSize = 21;
  const [initialPageResult, preProgramResult] = await Promise.all([
    getProgramAssignmentsPaginated(1, pageSize),
    getPreProgramTemplate(),
  ]);

  const initialData = initialPageResult.success
    ? {
      pages: [initialPageResult.data],
      pageParams: [1] as number[],
    }
    : undefined;

  const preProgramAssignment =
    preProgramResult.success && preProgramResult.data
      ? preProgramResult.data
      : null;

  return (
    <PageWrapper
      subheader={
        <h1 className="text-3xl font-semibold tracking-tight text-white">Program Builder</h1>
      }
    >
      <BuilderContextProvider initialAssignment={null} initialSchedule={null}>
        {preProgramAssignment ? (
          <PreProgramCard assignment={preProgramAssignment} />
        ) : null}
        <ProgramBuilder initialData={initialData} />
      </BuilderContextProvider>
    </PageWrapper>
  );
}
