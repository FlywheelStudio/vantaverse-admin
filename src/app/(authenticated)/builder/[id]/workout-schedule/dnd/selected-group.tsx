'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Group } from '@/lib/supabase/schemas/exercise-templates';
import type { SelectedItem } from '@/app/(authenticated)/builder/[id]/template-config/types';
import { cn } from '@/lib/utils';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableItem } from './sortable-item';
import { SelectedItemComponent } from './selected-item';
import { generateItemId, getGroupItemIds } from './dnd-utils';

interface SelectedGroupProps {
  group: Group;
  index: number;
  groupId: string;
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

export function SelectedGroupComponent({
  group,
  index,
  groupId,
  onRemove,
  onToggleSuperset,
  onUpdateGroup,
  onGroupItemClick,
}: SelectedGroupProps): React.ReactNode {
  const { setNodeRef, isOver } = useDroppable({
    id: `droppable-${groupId}`,
    data: {
      type: 'group',
      groupId,
      groupIndex: index,
    },
  });

  const groupItemIds = getGroupItemIds(group.items, groupId);

  return (
    <div
      ref={setNodeRef}
      className={cn(
        'border rounded-lg p-3 mb-3 border-purple-300 bg-purple-50/50 transition-all duration-200',
        isOver && 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-300',
      )}
      role="group"
      aria-label={`Group: ${group.name}. ${group.items.length} items.`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 flex-1">
          <div className="font-semibold text-sm">{group.name}</div>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 ">
            <Checkbox
              id={`superset-${index}`}
              checked={group.isSuperset}
              onCheckedChange={onToggleSuperset}
              className="cursor-pointer"
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

      <SortableContext
        items={groupItemIds}
        strategy={verticalListSortingStrategy}
      >
        {group.items.length > 0 ? (
          <div
            className="space-y-2 mb-2"
            role="list"
            aria-label={`Items in ${group.name}`}
          >
            {group.items.map((item, itemIndex) => {
              const itemId = generateItemId(item, itemIndex, groupId);

              return (
                <SortableItem key={itemId} id={itemId}>
                  <SelectedItemComponent
                    item={item}
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
                        : () => {}
                    }
                  />
                </SortableItem>
              );
            })}
          </div>
        ) : null}
      </SortableContext>

      <div
        className={cn(
          'w-full p-3 border-2 border-dashed rounded text-center text-sm transition-all duration-200',
          'border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 text-gray-600 hover:text-blue-600',
          isOver && 'border-blue-500 bg-blue-100',
        )}
        role="button"
        aria-label="Add exercises to group"
      >
        <span>+ Drop Exercises to Group</span>
      </div>
    </div>
  );
}
