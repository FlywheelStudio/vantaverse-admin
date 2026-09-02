import { ReviewAssignUI } from './review-assign-ui';
import { ProgramAssignmentsQuery } from '@/lib/supabase/queries/program-assignments';
import { convertScheduleToSelectedItems } from '../actions';
import type { SelectedItem } from '../[id]/template-config/types';

export default async function ReviewAssignPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<React.ReactElement> {
  const { id } = await searchParams;
  if (!id) {
    throw new Error('Missing program id');
  }

  const query = new ProgramAssignmentsQuery();
  const result = await query.getById(id);

  if (!result.success) {
    throw new Error(result.error || 'Failed to load program assignment');
  }
  const programAssignment = result.data;

  const dbSchedule = programAssignment?.workout_schedule?.schedule;
  let convertedSchedule: SelectedItem[][][] = [];
  if (dbSchedule) {
    const conversionResult = await convertScheduleToSelectedItems(dbSchedule);
    if (conversionResult.success) {
      convertedSchedule = conversionResult.data as SelectedItem[][][];
    }
  }

  let members = await query.getMembersByTemplateId(
    programAssignment.program_template_id,
  );
  if (!members.success) {
    members = { success: true, data: [] };
  }

  return (
    <ReviewAssignUI
      assignmentId={id}
      programAssignment={programAssignment}
      schedule={convertedSchedule}
      members={members.data}
    />
  );
}
