'use client';

import { AppBar } from '@/components/medvanta/shell';
import { ExerciseLibrary } from './exercise-library/ui';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

interface ExercisesUIProps {
  initialExercises: Exercise[];
}

export function ExercisesUI({ initialExercises }: ExercisesUIProps): React.ReactElement {
  const total = initialExercises.length;
  const unassigned = initialExercises.filter((e) => (e.assigned_count ?? 0) === 0).length;
  const sources = new Set(initialExercises.map((e) => e.type).filter(Boolean)).size;

  return (
    <>
      <AppBar
        crumbs={[{ label: 'Exercises' }]}
        title="Exercise library"
        subtitle={`${total} exercises · ${sources} source${sources === 1 ? '' : 's'} · ${unassigned} unassigned`}
      />
      <div className="body">
        <ExerciseLibrary initialExercises={initialExercises} />
      </div>
    </>
  );
}
