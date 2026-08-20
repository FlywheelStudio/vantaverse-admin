import { ExercisesUI } from './exercises-ui';
import { ExercisesQuery } from '@/lib/supabase/queries/exercises';

export default async function ExercisesPage(): Promise<React.ReactElement> {
  const exercisesQuery = new ExercisesQuery();
  const result = await exercisesQuery.getList();

  const initialExercises = result.success ? result.data : [];

  return <ExercisesUI initialExercises={initialExercises} />;
}
