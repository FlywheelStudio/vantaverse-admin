import { startOfDay } from 'date-fns';
import { parseLocalDateString } from '@/lib/utils';
import type { ProgramAssignmentMember } from '@/lib/supabase/schemas/program-assignments';
import { PROGRAM_ASSIGNMENT_STATUS } from '@/lib/constants/program-assignment-status';

export function getMemberName(member: ProgramAssignmentMember): string {
  const profile = member.profiles;
  if (!profile) return 'Unknown member';
  return [profile.first_name, profile.last_name].filter(Boolean).join(' ') || profile.email || 'Unknown member';
}

/** A program is ongoing once its start date has arrived; its start date is then locked. */
export function isOngoingProgram(
  status: string | null,
  startDate: string | null,
): boolean {
  if (status !== PROGRAM_ASSIGNMENT_STATUS.ACTIVE || !startDate) {
    return false;
  }
  return parseLocalDateString(startDate).getTime() <= startOfDay(new Date()).getTime();
}
