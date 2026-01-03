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
      relativeDate = 'Today';
    } else if (diffDays === 1) {
      relativeDate = 'Yesterday';
    } else if (diffDays < 30) {
      relativeDate = `${diffDays} day${diffDays === 1 ? '' : 's'} ago`;
    } else if (diffDays < 365) {
      const months = Math.floor(diffDays / 30);
      relativeDate = `${months} month${months === 1 ? '' : 's'} ago`;
    } else {
      relativeDate = 'More than a year ago';
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
      className="h-full flex flex-col gap-0 group overflow-hidden rounded-2xl border-2 border-[#E5E9F0] hover:border-[#2454FF] hover:shadow-xl transition-all duration-300 cursor-pointer bg-white"
    >
      {/* Exercise Image */}
      <div className="relative aspect-4/3 overflow-hidden bg-linear-to-br from-[#F5F7FA] to-[#E5E9F0]">
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
          <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-[#F5F7FA] to-[#E5E9F0]">
            <span className="text-[#64748B]">No video</span>
          </div>
        )}
      </div>

      {/* Exercise Info */}
      <CardContent
        className={`flex-1 flex flex-col p-5 bg-linear-to-b ${
          hasAssignments
            ? 'from-[#D1FAE5]/40 to-[#A8E6E1]/30'
            : 'from-[#A8E6E1]/30 to-[#D4EEF7]/20'
        }`}
      >
        <h3 className="font-bold text-[#1E3A5F] text-base mb-3 line-clamp-2 leading-tight">
          {exercise.exercise_name}
        </h3>

        <div className="space-y-2 mt-auto">
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium border ${
              hasAssignments
                ? 'bg-[#D1FAE5] text-[#065F46] border-[#10B981]/30'
                : 'bg-[#F5F7FA] text-[#64748B] border-[#E5E9F0]'
            }`}
          >
            {assignmentText}
          </span>

          {dateDisplay && (
            <p className="text-sm text-[#64748B]">Created at {dateDisplay}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
