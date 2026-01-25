import { PageWrapper } from '@/components/page-wrapper';
import { BuilderContextProvider } from '@/context/builder-context';
import { ProgramBuilder } from './program/builder';
import { getProgramAssignmentsPaginated } from './actions';

export default async function BuilderPage() {
  const pageSize = 21;
  const initialPageResult = await getProgramAssignmentsPaginated(1, pageSize);

  const initialData = initialPageResult.success
    ? {
      pages: [initialPageResult.data],
      pageParams: [1] as number[],
    }
    : undefined;

  return (
    <PageWrapper
      subheader={
        <h1 className="text-3xl font-semibold tracking-tight text-white">Program Builder</h1>
      }
    >
      <BuilderContextProvider>
        <ProgramBuilder initialData={initialData} />
      </BuilderContextProvider>
    </PageWrapper>
  );
}
