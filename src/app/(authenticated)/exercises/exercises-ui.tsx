'use client';

import { Icon } from '@/components/medvanta';
import { AppBar } from '@/components/medvanta/shell';
import { ExerciseLibrary } from './exercise-library/ui';
import { HtmlMoreButton } from '@/app/(authenticated)/builder/partials/html-toolbar';
import { toastUnavailable } from '@/lib/medvanta/unavailable-toast';
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
        actions={
          <>
            <button
              type="button"
              className="btn btn-acc"
              onClick={() => toastUnavailable('New exercise')}
            >
              <Icon name="Plus" size={17} />
              New exercise
            </button>
            <HtmlMoreButton
              items={[
                {
                  id: 'import',
                  label: 'Import from a partner library',
                  onSelect: () => toastUnavailable('Import from a partner library'),
                },
                {
                  id: 'bulk',
                  label: 'Bulk edit categories',
                  onSelect: () => toastUnavailable('Bulk edit categories'),
                },
                {
                  id: 'export',
                  label: 'Export',
                  onSelect: () => toastUnavailable('Export exercises'),
                },
              ]}
            />
          </>
        }
      />
      <div className="body">
        <ExerciseLibrary initialExercises={initialExercises} />
      </div>
    </>
  );
}
