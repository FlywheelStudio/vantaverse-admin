import { PageWrapper } from '@/components/page-wrapper';
import { BuilderContextProvider } from '@/context/builder-context';
import { WorkoutBuilder } from '../workout-schedule/workout-builder';
import { createParallelQueries } from '@/lib/supabase/query';
import { ProgramAssignmentsQuery } from '@/lib/supabase/queries/program-assignments';
import { WorkoutSchedulesQuery } from '@/lib/supabase/queries/workout-schedules';
import type { WorkoutScheduleData } from '@/hooks/use-workout-schedule';

export default async function BuilderIdPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const programAssignmentsQuery = new ProgramAssignmentsQuery();
  const workoutSchedulesQuery = new WorkoutSchedulesQuery();

  const data = await createParallelQueries({
    programAssignment: {
      query: () => programAssignmentsQuery.getById(id),
      required: true,
    },
    workoutScheduleData: {
      query: () => workoutSchedulesQuery.getScheduleDataByAssignmentId(id),
      defaultValue: null,
    },
  });

  return (
    <PageWrapper
      subheader={
        <div className="flex items-center gap-2">
          <span className="text-2xl font-medium">Program Builder</span>
        </div>
      }
    >
      <BuilderContextProvider initialWorkoutSchedule={data.workoutScheduleData as WorkoutScheduleData | null}>
        <WorkoutBuilder assignmentId={id} initialAssignment={data.programAssignment} />
      </BuilderContextProvider>
    </PageWrapper>
  );
}
