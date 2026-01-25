'use client';

import type { Exercise } from '@/lib/supabase/schemas/exercises';
import { cn } from '@/lib/utils';

interface ExerciseLibraryCardProps {
  exercise: Exercise;
  onAdd: () => void;
  index: number;
}

export function ExerciseLibraryCard({
  exercise,
  onAdd,
  index,
}: ExerciseLibraryCardProps) {
  return (
    <div
      onClick={onAdd}
      id={`exercise-library-card-${index}-${exercise.id}`}
      className={cn(
        'border border-border rounded-[var(--radius-lg)] p-4 cursor-pointer hover:bg-muted/60 transition-colors',
      )}
    >
      {exercise.video_url ? (
        <div className="mb-2 aspect-video bg-muted rounded-[var(--radius-md)] overflow-hidden">
          {exercise.video_type === 'youtube' ? (
            <iframe
              src={`https://www.youtube.com/embed/${exercise.video_url}`}
              className="w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              title={exercise.exercise_name}
            />
          ) : (
            <video
              src={exercise.video_url}
              className="w-full h-full object-cover"
            />
          )}
        </div>
      ) : (
        <div className="mb-2 aspect-video bg-muted rounded-[var(--radius-md)]" />
      )}
      <div
        className="text-sm font-medium text-foreground truncate mb-1"
        title={exercise.exercise_name}
      >
        {exercise.exercise_name}
      </div>
    </div>
  );
}
