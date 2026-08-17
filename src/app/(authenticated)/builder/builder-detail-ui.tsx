'use client';

import Link from 'next/link';
import { Icon } from '@/components/medvanta';
import { AppBar } from '@/components/medvanta/shell';
import { BuilderContextProvider } from '@/context/builder-context';
import { WorkoutBuilder } from './[id]/workout-schedule/workout-builder';
import type { ProgramAssignmentWithTemplate } from '@/lib/supabase/schemas/program-assignments';
import type { SelectedItem } from './[id]/template-config/types';

interface BuilderDetailUIProps {
  assignmentId: string;
  programAssignment: ProgramAssignmentWithTemplate;
  convertedSchedule: SelectedItem[][][] | null;
  programDetailsCollapsed: boolean;
}

export function BuilderDetailUI({
  assignmentId,
  programAssignment,
  convertedSchedule,
  programDetailsCollapsed,
}: BuilderDetailUIProps): React.ReactElement {
  const template = programAssignment.program_template;
  const templateName = template?.name ?? 'Program';
  const weeks = template?.weeks ?? 0;

  return (
    <BuilderContextProvider
      initialAssignment={programAssignment}
      initialSchedule={convertedSchedule}
    >
      <AppBar
        crumbs={[
          { label: 'Programs', href: '/builder' },
          { label: templateName },
        ]}
        title={templateName}
        subtitle={`Template · ${weeks} week${weeks === 1 ? '' : 's'}`}
        actions={
          <Link
            href={`/builder/review-assign?id=${assignmentId}`}
            className="btn btn-sec"
          >
            <Icon name="BadgeCheck" size={17} />
            Review &amp; assign
          </Link>
        }
      />
      <WorkoutBuilder
        assignmentId={assignmentId}
        initialAssignment={programAssignment}
        programDetailsCollapsed={programDetailsCollapsed}
      />
    </BuilderContextProvider>
  );
}
