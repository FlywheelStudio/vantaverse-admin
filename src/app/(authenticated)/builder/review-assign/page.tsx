import { ReviewAssignUI } from './review-assign-ui';
import { query, formatDalError } from '@/lib/dal';
import {
  getProgramAssignmentById,
  getProgramAssignmentMembersByTemplateId,
  getTemplateSaveImpactByBaseId,
} from '@/lib/supabase/queries/program-assignments';
import { convertScheduleToSelectedItems } from '../actions';
import type { SelectedItem } from '../[id]/template-config/types';
import {
  EMPTY_TEMPLATE_SAVE_IMPACT,
  type ProgramAssignmentMember,
  type TemplateSaveImpact,
} from '@/lib/supabase/schemas/program-assignments';

export default async function ReviewAssignPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}): Promise<React.ReactElement> {
  const { id } = await searchParams;
  if (!id) {
    throw new Error('Missing program id');
  }

  const [[assignmentErr, programAssignment], [impactErr, impactData]] =
    await Promise.all([
      query(getProgramAssignmentById, id),
      query(getTemplateSaveImpactByBaseId, id),
    ]);

  if (assignmentErr) {
    throw new Error(formatDalError(assignmentErr));
  }

  const saveImpact: TemplateSaveImpact = impactErr
    ? EMPTY_TEMPLATE_SAVE_IMPACT
    : impactData;

  const dbSchedule = programAssignment?.workout_schedule?.schedule;
  let convertedSchedule: SelectedItem[][][] = [];
  if (dbSchedule) {
    const conversionResult = await convertScheduleToSelectedItems(dbSchedule);
    if (!conversionResult.success) {
      throw new Error(conversionResult.error);
    }
    convertedSchedule = conversionResult.data as SelectedItem[][][];
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
      saveImpact={saveImpact}
    />
  );
}
