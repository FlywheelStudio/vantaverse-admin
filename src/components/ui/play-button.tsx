'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
interface PlayButtonProps {
  videoUrl: string | null;
  videoType?: string;
  exerciseName?: string;
}

export function PlayButton({
  videoUrl,
  videoType,
  exerciseName,
}: PlayButtonProps) {
  const [isVideoOpen, setIsVideoOpen] = useState(false);

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

  return (
    <Popover open={isVideoOpen} onOpenChange={setIsVideoOpen}>
      <PopoverTrigger asChild>
        <div
          className="w-5 h-5 mx-3 text-gray-500 hover:text-blue-600 cursor-pointer"
          onMouseEnter={() => setIsVideoOpen(true)}
          onMouseLeave={() => setIsVideoOpen(false)}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <svg
            className="w-5 h-5 text-gray-500 hover:text-blue-600 cursor-pointer"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
          </svg>
        </div>
      </PopoverTrigger>
      <PopoverContent
        className="w-[300px] min-w-[300px] max-w-[300px] p-0"
        onMouseEnter={() => setIsVideoOpen(true)}
        onMouseLeave={() => setIsVideoOpen(false)}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative aspect-video w-[300px] min-w-[300px] max-w-[300px] overflow-hidden rounded-lg bg-black">
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
        </div>
      </PopoverContent>
    </Popover>
  );
}
