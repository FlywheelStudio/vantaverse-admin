'use client';

import { Badge, Card } from '@/components/medvanta';
import { ExerciseThumbnail } from '@/components/ui/exercise-thumbnail';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
}

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps): React.ReactElement {
  const thumb =
    exercise.thumbnail_url && typeof exercise.thumbnail_url === 'object'
      ? exercise.thumbnail_url
      : null;

  const getDateDisplay = (): string | null => {
    if (!exercise.created_at || !exercise.updated_at) return null;

    const createdDate = new Date(exercise.created_at);
    const updatedDate = new Date(exercise.updated_at);
    const isCreated = createdDate.getTime() === updatedDate.getTime();
    const label = isCreated ? 'Created' : 'Last used';
    const dateToUse = isCreated ? createdDate : updatedDate;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const date = new Date(dateToUse.getFullYear(), dateToUse.getMonth(), dateToUse.getDate());
    const diffDays = Math.floor((today.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    let relativeDate: string;
    if (diffDays === 0) relativeDate = 'today';
    else if (diffDays === 1) relativeDate = 'yesterday';
    else if (diffDays < 30) relativeDate = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      relativeDate = `${months} month${months === 1 ? '' : 's'} ago`;
    } else relativeDate = 'more than a year ago';

    return `${label} ${relativeDate}`;
  };

  const dateDisplay = getDateDisplay();
  const assignmentText =
    exercise.assigned_count === 0
      ? 'Unassigned'
      : `${exercise.assigned_count} assignment${exercise.assigned_count === 1 ? '' : 's'}`;
  const hasAssignments = Boolean(exercise.assigned_count && exercise.assigned_count > 0);

  return (
    <Card
      padding={0}
      interactive
      onClick={onClick}
      className="group flex h-full cursor-pointer flex-col overflow-hidden"
    >
      <div className="relative aspect-4/3 overflow-hidden bg-[var(--slate-50)] transition-transform duration-300 group-hover:scale-[1.02]">
        <ExerciseThumbnail
          blurhash={thumb?.blurhash ?? null}
          imageUrl={thumb?.image_url ?? null}
          videoUrl={exercise.video_url ?? null}
          videoType={exercise.video_type}
          alt={exercise.exercise_name}
          className="h-full w-full"
          fill
          aspectVideo={false}
          showVideoFallback={true}
        />
      </div>

      <div className="flex flex-1 flex-col gap-3 px-4 py-4">
        <h3 className="line-clamp-2 text-[length:var(--text-base)] font-[var(--fw-semibold)] leading-snug text-[var(--text-strong)]">
          {exercise.exercise_name}
        </h3>

        <div className="mt-auto space-y-2">
          <Badge tone={hasAssignments ? 'brand' : 'neutral'}>{assignmentText}</Badge>
          {dateDisplay ? (
            <p className="text-[length:var(--text-sm)] text-[var(--text-muted)]">{dateDisplay}</p>
          ) : null}
        </div>
      </div>
    </Card>
  );
}
