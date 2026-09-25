import Link from 'next/link';
import {
  PROGRAM_ASSIGNMENT_STATUS,
  isPreProgramTemplateStatus,
} from '@/lib/constants/program-assignment-status';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';

interface AssignmentSubtitleProps {
  assignment: ProgramAssignmentWithTemplate;
  weeks: number;
}

const displayName = (
  profile: NonNullable<ProgramAssignmentWithTemplate['profiles']>,
): string | null => {
  const name = [profile.first_name, profile.last_name].filter(Boolean).join(' ');
  return name || profile.email || null;
};

/** Header subtitle: template label, or a link to the assigned member. */
export function AssignmentSubtitle({
  assignment,
  weeks,
}: AssignmentSubtitleProps): React.ReactElement {
  const weeksLabel = `${weeks} week${weeks === 1 ? '' : 's'}`;
  const isTemplate =
    assignment.status === PROGRAM_ASSIGNMENT_STATUS.TEMPLATE ||
    isPreProgramTemplateStatus(assignment.status);

  if (isTemplate) {
    return <>Template · {weeksLabel}</>;
  }

  const profile = assignment.profiles;
  const userId = assignment.user_id ?? profile?.id ?? null;
  const name = profile ? displayName(profile) : null;

  if (!userId || !name) {
    return <>Assigned · {weeksLabel}</>;
  }

  return (
    <>
      Assigned to{' '}
      <Link
        href={`/users/${userId}`}
        style={{ color: 'var(--primary)', textDecoration: 'underline' }}
      >
        {name}
      </Link>
      {` · ${weeksLabel}`}
    </>
  );
}
