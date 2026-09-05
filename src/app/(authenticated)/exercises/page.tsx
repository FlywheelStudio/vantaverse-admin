import { queryWithSession } from '@/lib/dal/core/query.server';
import {
  DEFAULT_EXERCISES_FILTERED_INPUT,
  getExerciseAssignmentCounts,
  listExercisesFiltered,
} from '@/lib/supabase/queries/exercises';

import { ExercisesUI } from './exercises-ui';

export default async function ExercisesPage(): Promise<React.ReactElement> {
  const [pageResult, countsResult] = await Promise.all([
    queryWithSession(listExercisesFiltered, DEFAULT_EXERCISES_FILTERED_INPUT),
    queryWithSession(getExerciseAssignmentCounts),
  ]);

  const [pageErr, firstPage] = pageResult;
  const [countsErr, initialCounts] = countsResult;

  return (
    <ExercisesUI
      initialPage={pageErr ? undefined : firstPage}
      initialCounts={countsErr ? undefined : initialCounts}
    />
  );
}
