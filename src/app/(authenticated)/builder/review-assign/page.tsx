import { ReviewAssignUI } from './review-assign-ui';
import { query, formatDalError } from '@/lib/dal';
import {
  getProgramAssignmentById,
  getProgramAssignmentMembersByTemplateId,
} from '@/lib/supabase/queries/program-assignments';
import { convertScheduleToSelectedItems } from '../actions';
import type { SelectedItem } from '../[id]/template-config/types';
import type { ProgramAssignmentMember } from '@/lib/supabase/schemas/program-assignments';

export default async function ReviewAssignPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<React.ReactElement> {
  const { id } = await searchParams;
  if (!id) {
    throw new Error('Missing program id');
  }

  const [assignmentErr, programAssignment] = await query(getProgramAssignmentById, id);

  if (assignmentErr) {
    throw new Error(formatDalError(assignmentErr));
  }

  const dbSchedule = programAssignment?.workout_schedule?.schedule;
  let convertedSchedule: SelectedItem[][][] = [];
  if (dbSchedule) {
    const conversionResult = await convertScheduleToSelectedItems(dbSchedule);
    if (conversionResult.success) {
      convertedSchedule = conversionResult.data as SelectedItem[][][];
    }
  }

  const [membersErr, membersData] = await query(
    getProgramAssignmentMembersByTemplateId,
    programAssignment.program_template_id,
  );
  const members: ProgramAssignmentMember[] = membersErr ? [] : membersData;

  return (
    <ReviewAssignUI
      assignmentId={id}
      programAssignment={programAssignment}
      schedule={convertedSchedule}
      members={members}
    />
  );
}
