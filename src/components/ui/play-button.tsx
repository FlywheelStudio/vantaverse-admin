'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useDragContextOptional } from '@/app/(authenticated)/builder/[id]/workout-schedule/dnd/drag-context';
import { ExerciseThumbnail } from '@/components/ui/exercise-thumbnail';

export type ThumbnailUrlShape = {
  blurhash?: string;
  image_url?: string;
} | null;

interface PlayButtonProps {
  videoUrl: string | null;
  videoType?: string;
  exerciseName?: string;
  thumbnailUrl?: ThumbnailUrlShape;
  disableHover?: boolean;
}

export function PlayButton({
  videoUrl,
  videoType,
  exerciseName,
  thumbnailUrl,
  disableHover = false,
}: PlayButtonProps) {
  const dragContext = useDragContextOptional();
  const isDragging = dragContext?.isDragging ?? false;
  const [isHovered, setIsHovered] = useState(false);

  const isVideoOpen = !isDragging && !disableHover && isHovered;

  if (!videoUrl || !videoType) {
    return null;
  }

  const getVideoUrl = () => {
    if (!videoUrl) return null;
    if (videoType === 'youtube') {
      return `https://www.youtube.com/embed/${videoUrl}?autoplay=1`;
    }
    if (videoType === 'file') {
      return videoUrl;
    }
    return null;
  };

  const embeddedUrl = getVideoUrl();

  if (!embeddedUrl) {
    return null;
  }

  const handleMouseEnter = () => {
    if (!isDragging && !disableHover) {
      setIsHovered(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isDragging && !disableHover) {
      setIsHovered(false);
    }
  };

  return (
    <Popover
      open={isVideoOpen}
      onOpenChange={(open) => {
        if (!isDragging && !disableHover) {
          setIsHovered(open);
        }
      }}
    >
      <PopoverTrigger asChild>
        <div
          className="w-5 h-5 mx-3 text-muted-foreground hover:text-primary cursor-pointer"
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <svg
            className="w-5 h-5"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] min-w-[300px] max-w-[300px] p-0"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-video w-[300px] min-w-[300px] max-w-[300px] overflow-hidden rounded-[var(--radius-lg)] bg-black">
          {thumbnailUrl && (thumbnailUrl.blurhash || thumbnailUrl.image_url) ? (
            <ExerciseThumbnail
              blurhash={thumbnailUrl.blurhash ?? null}
              imageUrl={thumbnailUrl.image_url ?? null}
              videoUrl={videoUrl}
              videoType={videoType}
              alt={exerciseName || 'Exercise Video'}
              className="h-full w-full rounded-[var(--radius-lg)]"
              fill
              aspectVideo={false}
              showVideoFallback={true}
            />
          ) : (
            <>
              {videoType === 'youtube' ? (
                <iframe
                  src={embeddedUrl}
                  className="w-[300px] min-w-[300px] max-w-[300px]"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title={exerciseName || 'Exercise Video'}
                />
              ) : (
                <video
                  src={embeddedUrl}
                  className="w-[300px] min-w-[300px] max-w-[300px] object-cover"
                  autoPlay
                  loop
                  muted
                  playsInline
                >
                  Your browser does not support the video tag.
                </video>
              )}
            </>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
