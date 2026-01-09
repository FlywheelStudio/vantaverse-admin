'use client';

import { useState } from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Play } from 'lucide-react';

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
        <Button
          variant="ghost"
          size="icon-sm"
          className="shrink-0"
          onMouseEnter={() => setIsVideoOpen(true)}
          onMouseLeave={() => setIsVideoOpen(false)}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Play className="h-4 w-4" />
        </Button>
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
