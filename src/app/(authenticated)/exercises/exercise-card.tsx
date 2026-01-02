'use client';

import Image from 'next/image';
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

  return (
    <button
      onClick={onClick}
      className="group relative flex w-full flex-col overflow-hidden rounded-xl bg-gray-900 shadow-lg transition-transform hover:scale-[1.02] cursor-pointer"
    >
      {/* Video Thumbnail */}
      <div className="relative aspect-video w-full overflow-hidden bg-gray-800">
        {thumbnailUrl ? (
          <>
            {exercise.video_type === 'youtube' ? (
              <Image
                src={thumbnailUrl}
                alt={exercise.exercise_name}
                fill
                className="object-cover"
                unoptimized
              />
            ) : (
              <video
                src={thumbnailUrl}
                className="h-full w-full object-cover"
                muted
                playsInline
              />
            )}
          </>
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gray-800">
            <span className="text-gray-500">No video</span>
          </div>
        )}
      </div>

      {/* Exercise Name */}
      <div className="p-4">
        <h3 className="line-clamp-2 text-left text-sm font-medium text-white">
          {exercise.exercise_name}
        </h3>
      </div>
    </button>
  );
}
