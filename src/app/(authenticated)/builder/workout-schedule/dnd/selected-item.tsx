'use client';

import { generateExerciseTemplateDescription } from '@/lib/utils/exercise-template-description';
import { PlayButton } from '@/components/ui/play-button';
import type { SelectedItem } from '@/app/(authenticated)/builder/template-config/types';
import { cn } from '@/lib/utils';

interface SelectedItemProps {
  item: SelectedItem;
  index: number;
  onRemove: () => void;
  onClick: (event: React.MouseEvent) => void;
}

export function SelectedItemComponent({
  item,
  index,
  onRemove,
  onClick,
}: SelectedItemProps) {
  const isPlainExercise = item.type === 'exercise';

  if (item.type === 'group') {
    return null;
  }

  // TypeScript now knows item is either 'exercise' or 'template'
  const exerciseName =
    item.type === 'exercise'
      ? item.data.exercise_name
      : item.data.exercise_name || 'Unnamed Exercise';

  const hasVideo =
    (item.type === 'exercise' || item.type === 'template') &&
    item.data.video_url &&
    item.data.video_type;

  return (
    <div
      className={cn(
        'border rounded-lg p-3 flex items-center gap-2 border-blue-500 bg-blue-50',
        'cursor-pointer',
      )}
      onClick={onClick}
    >
      <div className="flex-1 flex items-center gap-3">
        {hasVideo && (item.type === 'exercise' || item.type === 'template') && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <PlayButton
              videoUrl={item.data.video_url || null}
              videoType={item.data.video_type}
              exerciseName={exerciseName}
            />
          </div>
        )}
        <div className="flex-1">
          <div className="font-medium text-sm">{exerciseName}</div>
          {isPlainExercise && (
            <div className="text-xs text-red-500 mt-1">no workout data</div>
          )}
          {item.type === 'template' && (
            <div className="text-xs text-gray-600 mt-1">
              {generateExerciseTemplateDescription(item.data)}
            </div>
          )}
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-red-500 hover:text-red-700 text-lg leading-none cursor-pointer"
      >
        ×
      </button>
    </div>
  );
}
