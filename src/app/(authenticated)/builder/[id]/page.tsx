import { BuilderDetailUI } from '../builder-detail-ui';
import { query, formatDalError } from '@/lib/dal';
import { getProgramAssignmentById } from '@/lib/supabase/queries/program-assignments';
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

  const [assignmentErr, programAssignment] = await query(getProgramAssignmentById, id);

  if (assignmentErr) {
    throw new Error(formatDalError(assignmentErr));
  }

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
