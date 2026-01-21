'use client';

import { cn } from '@/lib/utils';

type TabType = 'library' | 'templates';

interface ExerciseTabSwitcherProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function ExerciseTabSwitcher({
  activeTab,
  onTabChange,
}: ExerciseTabSwitcherProps) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <button
        onClick={() => onTabChange('library')}
        className={cn(
          'px-4 py-2 rounded-md font-medium transition-colors',
          activeTab === 'library'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        )}
      >
        Library
      </button>
      <button
        onClick={() => onTabChange('templates')}
        className={cn(
          'px-4 py-2 rounded-md font-medium transition-colors',
          activeTab === 'templates'
            ? 'bg-blue-500 text-white'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200',
        )}
      >
        Templates
      </button>
    </div>
  );
}
