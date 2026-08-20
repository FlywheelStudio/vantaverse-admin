'use client';

import { Icon } from '@/components/medvanta';
import { ExerciseThumbnail } from '@/components/ui/exercise-thumbnail';
import type { Exercise } from '@/lib/supabase/schemas/exercises';

interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
}

function formatTypeLabel(type: string): string {
  return type
    .replaceAll('_', ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

function getDateDisplay(exercise: Exercise): string | null {
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

  if (diffDays === 0) return `${label} today`;
  if (diffDays === 1) return `${label} yesterday`;
  if (diffDays < 30) return `${label} ${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
  if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return `${label} ${months} month${months === 1 ? '' : 's'} ago`;
  }
  return `${label} more than a year ago`;
}

/** HTML `.exc` exercise card from scExercises. */
export function ExerciseCard({ exercise, onClick }: ExerciseCardProps): React.ReactElement {
  const thumb =
    exercise.thumbnail_url && typeof exercise.thumbnail_url === 'object'
      ? exercise.thumbnail_url
      : null;

  const dateDisplay = getDateDisplay(exercise);
  const hasAssignments = Boolean(exercise.assigned_count && exercise.assigned_count > 0);
  const category = exercise.type ? formatTypeLabel(exercise.type) : 'Exercise';

  return (
    <button type="button" className="exc" onClick={onClick}>
      <div className="thmb gr" style={{ aspectRatio: '16/10', width: '100%', position: 'relative' }}>
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
        {exercise.type ? (
          <span className="src-b">{formatTypeLabel(exercise.type).slice(0, 3).toUpperCase()}</span>
        ) : null}
        {exercise.video_url ? (
          <span className="pl">
            <i>
              <Icon name="Play" size={18} style={{ fill: 'currentColor' }} />
            </i>
          </span>
        ) : null}
      </div>
      <div className="meta">
        <div className="en2">{exercise.exercise_name}</div>
        <div className="mr">
          <span className="row" style={{ gap: 6 }}>
            {hasAssignments ? (
              <span className="bdg bdg-b">{exercise.assigned_count} assigned</span>
            ) : (
              <span className="bdg bdg-o">Unassigned</span>
            )}
            <span className="bdg">{category}</span>
          </span>
        </div>
        {dateDisplay ? (
          <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-faint)' }}>{dateDisplay}</div>
        ) : null}
      </div>
    </button>
  );
}
