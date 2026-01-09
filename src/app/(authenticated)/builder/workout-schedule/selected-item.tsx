'use client';

import { generateExerciseTemplateDescription } from '@/lib/utils/exercise-template-description';
import type { Exercise } from '@/lib/supabase/schemas/exercises';
import type { ExerciseTemplate } from '@/lib/supabase/schemas/exercise-templates';
import { PlayButton } from '@/components/ui/play-button';

type SelectedItem =
  | { type: 'exercise'; data: Exercise }
  | { type: 'template'; data: ExerciseTemplate };

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
  const exerciseName =
    item.type === 'exercise'
      ? item.data.exercise_name
      : item.data.exercise_name || 'Unnamed Exercise';

  const hasVideo =
    item.type === 'template' && item.data.video_url && item.data.video_type;

  const isPlainExercise = item.type === 'exercise';

  return (
    <div
      key={`${item.type}-${item.data.id}-${index}`}
      className="border rounded-lg p-3 cursor-pointer flex items-center gap-2 border-blue-500 bg-blue-50"
      onClick={onClick}
    >
      <div className="flex-1 flex items-center gap-3">
        {hasVideo && (
          <div className="relative" onClick={(e) => e.stopPropagation()}>
            <PlayButton
              videoUrl={item.data.video_url || null}
              videoType={item.data.video_type}
              exerciseName={exerciseName}
            />
          </div>
        )}
        {!hasVideo && (
          <div className="relative">
            <svg
              className="w-5 h-5 text-gray-500 hover:text-blue-600 cursor-pointer"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path d="M6.3 2.841A1.5 1.5 0 004 4.11V15.89a1.5 1.5 0 002.3 1.269l9.344-5.89a1.5 1.5 0 000-2.538L6.3 2.84z" />
            </svg>
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
        className="text-red-500 hover:text-red-700 text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}
