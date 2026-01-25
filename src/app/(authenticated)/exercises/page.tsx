import { PageWrapper } from '@/components/page-wrapper';
import { ExerciseLibrary } from './exercise-library/ui';
import { ExercisesQuery } from '@/lib/supabase/queries/exercises';

export default async function ExercisesPage() {
  const exercisesQuery = new ExercisesQuery();
  const result = await exercisesQuery.getList();

  const initialExercises = result.success ? result.data : [];

  return (
    <PageWrapper
      subheader={
        <h1 className="text-3xl font-semibold tracking-tight text-white">
          Exercise Library
        </h1>
      }
    >
      <ExerciseLibrary initialExercises={initialExercises} />
    </PageWrapper>
  );
}
