import { queryWithSession } from '@/lib/dal/core/query.server';
import { listExercises } from '@/lib/supabase/queries/exercises';

import { ExercisesUI } from './exercises-ui';

export default async function ExercisesPage(): Promise<React.ReactElement> {
  const [err, data] = await queryWithSession(listExercises);
  const initialExercises = err ? [] : data;

  return <ExercisesUI initialExercises={initialExercises} />;
}
