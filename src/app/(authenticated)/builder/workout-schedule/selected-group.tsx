'use client';

import { Checkbox } from '@/components/ui/checkbox';
import { Group } from '@/lib/supabase/schemas/exercise-templates';

interface SelectedGroupProps {
  group: Group;
  index: number;
  onRemove: () => void;
  onToggleSuperset: () => void;
}

export function SelectedGroupComponent({
  group,
  index,
  onRemove,
  onToggleSuperset,
}: SelectedGroupProps) {
  return (
    <div className="border rounded-lg p-3 mb-3 border-purple-300 bg-purple-50/50">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold text-sm">{group.name}</div>
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
          >
            ×
          </button>
        </div>
      </div>
      <button className="w-full p-2 border-2 border-dashed border-gray-300 rounded hover:border-blue-500 hover:bg-blue-50 text-gray-600 hover:text-blue-600 text-sm">
        + Add Exercise to Group
      </button>
    </div>
  );
}
