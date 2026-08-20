import { ProgramsUI } from './programs-ui';
import { getProgramAssignmentsPaginated, getPreProgramTemplate } from './actions';

export default async function BuilderPage(): Promise<React.ReactElement> {
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

  const templateTotal = initialPageResult.success ? initialPageResult.data.total : 0;

  const preProgramAssignment =
    preProgramResult.success && preProgramResult.data ? preProgramResult.data : null;

  return (
    <ProgramsUI
      preProgramAssignment={preProgramAssignment}
      initialData={initialData}
      templateTotal={templateTotal}
    />
  );
}
