import { PageWrapper } from '@/components/page-wrapper';
import { ExerciseLibrary } from './exercise-library/ui';
import { ExercisesQuery } from '@/lib/supabase/queries/exercises';

export default async function ExercisesPage() {
  const exercisesQuery = new ExercisesQuery();
  const result = await exercisesQuery.getList();

  const initialExercises = result.success ? result.data : [];

  return (
    <PageWrapper
      subheader={<h1 className="text-2xl font-medium">Exercise Library</h1>}
    >
      <ExerciseLibrary initialExercises={initialExercises} />
    </PageWrapper>
  );
}
