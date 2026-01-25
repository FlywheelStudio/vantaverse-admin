'use client';

import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';
import type { Exercise } from '@/lib/supabase/schemas/exercises';
interface ExerciseCardProps {
  exercise: Exercise;
  onClick: () => void;
}

export function ExerciseCard({ exercise, onClick }: ExerciseCardProps) {
  const getThumbnailUrl = () => {
    if (exercise.video_type === 'youtube' && exercise.video_url) {
      return `https://img.youtube.com/vi/${exercise.video_url}/maxresdefault.jpg`;
    }
    if (exercise.video_type === 'file' && exercise.video_url) {
      return exercise.video_url;
    }
    return null;
  };

  const thumbnailUrl = getThumbnailUrl();

  // Format date display with relative dates
  const getDateDisplay = () => {
    if (!exercise.created_at || !exercise.updated_at) {
      return null;
    }
    const createdDate = new Date(exercise.created_at);
    const updatedDate = new Date(exercise.updated_at);
    const isCreated = createdDate.getTime() === updatedDate.getTime();
    const label = isCreated ? 'Created' : 'Last used';
    const dateToUse = isCreated ? createdDate : updatedDate;

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const date = new Date(
      dateToUse.getFullYear(),
      dateToUse.getMonth(),
      dateToUse.getDate(),
    );

    const diffTime = today.getTime() - date.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

    let relativeDate: string;

    if (diffDays === 0) {
      relativeDate = 'today';
    } else if (diffDays === 1) {
      relativeDate = 'yesterday';
    } else if (diffDays < 30) {
      relativeDate = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      relativeDate = `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      relativeDate = 'more than a year ago';
    }

    return `${label} ${relativeDate}`;
  };

  const dateDisplay = getDateDisplay();
  const assignmentText =
    exercise.assigned_count === 0
      ? 'Unassigned'
      : `${exercise.assigned_count} assignment${exercise.assigned_count === 1 ? '' : 's'}`;
  const hasAssignments = exercise.assigned_count && exercise.assigned_count > 0;

  return (
    <Card
      onClick={onClick}
      className="group flex h-full cursor-pointer flex-col gap-0 overflow-hidden rounded-[var(--radius-lg)] border border-border/80 bg-card shadow-[var(--shadow-sm)] transition-all duration-300 hover:border-primary/60 hover:shadow-[var(--shadow-md)]"
    >
      {/* Exercise Image */}
      <div className="relative aspect-4/3 overflow-hidden bg-linear-to-br from-muted to-secondary">
        {thumbnailUrl ? (
          <>
            {exercise.video_type === 'youtube' ? (
              <Image
                src={thumbnailUrl}
                alt={exercise.exercise_name}
                fill
                className="object-cover group-hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            ) : (
              <video
                src={thumbnailUrl}
                className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                muted
                playsInline
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-muted to-secondary">
            <span className="text-muted-foreground text-sm font-medium">
              No video
            </span>
          </div>
        )}
      </div>

      {/* Exercise Info */}
      <CardContent
        className="flex flex-1 flex-col gap-3 px-4 py-4"
      >
        <h3 className="text-foreground line-clamp-2 text-base leading-snug font-semibold">
          {exercise.exercise_name}
        </h3>

        <div className="mt-auto space-y-2">
          <span
            className={[
              'inline-flex h-7 items-center rounded-[var(--radius-pill)] border px-2.5 text-xs font-medium',
              hasAssignments
                ? 'border-primary/20 bg-primary/10 text-primary'
                : 'border-border bg-secondary text-secondary-foreground',
            ].join(' ')}
          >
            {assignmentText}
          </span>

          {dateDisplay && (
            <p className="text-muted-foreground text-sm">{dateDisplay}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
