'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Group } from '@/lib/supabase/schemas/exercise-templates';
import type { SelectedItem } from '@/app/(authenticated)/builder/template-config/types';
import { cn } from '@/lib/utils';

interface SelectedGroupProps {
  group: Group;
  index: number;
  onRemove: () => void;
  onToggleSuperset: () => void;
  onUpdateGroup: (group: Group) => void;
  onGroupItemClick?: (
    item: SelectedItem,
    groupIndex: number,
    itemIndex: number,
    event: React.MouseEvent,
  ) => void;
}

function GroupItemComponent({
  item,
  groupIndex,
  itemIndex,
  onRemove,
  onClick,
}: {
  item: SelectedItem;
  groupIndex: number;
  itemIndex: number;
  onRemove: () => void;
  onClick?: (event: React.MouseEvent) => void;
}) {
  if (item.type === 'group' || item.type === 'exercise') {
    return null;
  }

  const exerciseName = item.data.exercise_name || 'Unnamed Exercise';
  const hasVideo = item.data.video_url && item.data.video_type;

  return (
    <div
      className={cn(
        'border rounded-lg p-2 flex items-center gap-2 border-blue-400 bg-blue-100/50 text-sm',
      )}
      aria-label={`Template in group: ${exerciseName}`}
    >
      <div
        className="flex-1 flex items-center gap-2 min-w-0"
        onClick={onClick}
        style={{ cursor: onClick ? 'pointer' : 'default' }}
      >
        {hasVideo && (
          <div
            className="relative shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-6 h-6 rounded bg-gray-200 flex items-center justify-center text-[10px] text-gray-600">
              ▶
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-medium text-xs truncate">{exerciseName}</div>
        </div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
        className="text-red-500 hover:text-red-700 text-sm leading-none cursor-pointer"
        aria-label="Remove from group"
      >
        ×
      </button>
    </div>
  );
}

export function SelectedGroupComponent({
  group,
  index,
  onRemove,
  onToggleSuperset,
  onUpdateGroup,
  onGroupItemClick,
}: SelectedGroupProps) {
  return (
    <div
      className={cn(
        'border rounded-lg p-3 mb-3 border-purple-300 bg-purple-50/50',
      )}
      role="group"
      aria-label={`Group: ${group.name}. ${group.items.length} items.`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="font-semibold text-sm">{group.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            <Checkbox
              id={`superset-${index}`}
              checked={group.isSuperset}
              onCheckedChange={onToggleSuperset}
            />
            <label
              htmlFor={`superset-${index}`}
              className="text-sm text-gray-700 cursor-pointer"
            >
              Superset
            </label>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="text-red-500 hover:text-red-700 text-lg leading-none cursor-pointer"
            aria-label="Remove group"
          >
            ×
          </button>
        </div>
      </div>

      {group.items.length > 0 ? (
        <div
          className="space-y-2 mb-2"
          role="list"
          aria-label={`Items in ${group.name}`}
        >
          {group.items.map((item, itemIndex) => (
            <div key={`group-item-${index}-${itemIndex}`} role="listitem">
              <GroupItemComponent
                item={item}
                groupIndex={index}
                itemIndex={itemIndex}
                onRemove={() => {
                  const newItems = group.items.filter(
                    (_, i) => i !== itemIndex,
                  );
                  onUpdateGroup({
                    ...group,
                    items: newItems,
                  });
                }}
                onClick={
                  onGroupItemClick
                    ? (e) => onGroupItemClick(item, index, itemIndex, e)
                    : undefined
                }
              />
            </div>
          ))}
        </div>
      ) : null}

      <div
        className={cn(
          'w-full p-3 border-2 border-dashed rounded text-center text-sm transition-all duration-200',
          'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 text-gray-600 hover:text-blue-600',
        )}
        role="button"
        aria-label="Add exercises to group"
      >
        <span>+ Add Exercise to Group</span>
      </div>
    </div>
  );
}
