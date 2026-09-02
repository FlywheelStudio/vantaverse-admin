import { BuilderDetailUI } from '../builder-detail-ui';
import { ProgramAssignmentsQuery } from '@/lib/supabase/queries/program-assignments';
import { convertScheduleToSelectedItems } from '@/app/(authenticated)/builder/actions';
import type { SelectedItem } from '@/app/(authenticated)/builder/[id]/template-config/types';

export default async function BuilderIdPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}): Promise<React.ReactElement> {
  const { id } = await params;
  const resolvedSearchParams = await searchParams;
  const collapsed =
    resolvedSearchParams?.collapsed === '1' || resolvedSearchParams?.collapsed === 'true';

  const programAssignmentsQuery = new ProgramAssignmentsQuery();
  const result = await programAssignmentsQuery.getById(id);

  if (!result.success) {
    throw new Error(result.error || 'Failed to load program assignment');
  }

  const programAssignment = result.data;
  const dbSchedule = programAssignment?.workout_schedule?.schedule;
  let convertedSchedule: SelectedItem[][][] | null = null;

  if (dbSchedule) {
    const conversionResult = await convertScheduleToSelectedItems(dbSchedule);
    if (conversionResult.success) {
      convertedSchedule = conversionResult.data as SelectedItem[][][];
    }
  }

  return (
    <BuilderDetailUI
      assignmentId={id}
      programAssignment={programAssignment}
      convertedSchedule={convertedSchedule}
      programDetailsCollapsed={collapsed}
    />
  );
}
