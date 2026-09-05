'use client';

import { AppBar } from '@/components/medvanta/shell';
import { ExerciseLibrary } from './exercise-library/ui';
import { useExerciseTypes } from '@/hooks/use-exercises';
import type { ExerciseAssignmentCounts } from '@/lib/supabase/queries/exercises';
import type { PaginatedResult } from '@/lib/supabase/queries/exercise-templates';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

interface ExercisesUIProps {
  initialPage?: PaginatedResult<Exercise>;
  initialCounts?: ExerciseAssignmentCounts;
}

export function ExercisesUI({
  initialPage,
  initialCounts,
}: ExercisesUIProps): React.ReactElement {
  const { data: exerciseTypes = [] } = useExerciseTypes();
  const total = initialCounts?.all ?? initialPage?.total ?? 0;
  const unassigned = initialCounts?.unassigned ?? 0;
  const sources = exerciseTypes.length;
  const subtitleParts = [`${total} exercises`];
  if (sources > 0) {
    subtitleParts.push(`${sources} source${sources === 1 ? '' : 's'}`);
  }
  subtitleParts.push(`${unassigned} unassigned`);

  return (
    <>
      <AppBar
        crumbs={[{ label: 'Exercises' }]}
        title="Exercise library"
        subtitle={subtitleParts.join(' · ')}
      />
      <div className="body">
        <ExerciseLibrary initialPage={initialPage} initialCounts={initialCounts} />
      </div>
    </>
  );
}
