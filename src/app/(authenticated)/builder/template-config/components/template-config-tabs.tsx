import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TabType } from '../types';

interface TemplateConfigTabsProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
  currentSetIndex: number;
  sets: number;
  onSetIndexChange: (index: number) => void;
}

const NavigationButtons = ({
  children,
  activeTab,
  sets,
  currentSetIndex,
  onSetIndexChange,
}: {
  children: React.ReactNode;
  activeTab: TabType;
  sets: number;
  currentSetIndex: number;
  onSetIndexChange: (index: number) => void;
}) => {
  return activeTab === 'set' && sets > 0 ? (
    <>
      {activeTab === 'set' && sets > 0 && (
        <button
          onClick={() => onSetIndexChange(Math.max(0, currentSetIndex - 1))}
          disabled={currentSetIndex === 0}
          className="p-0.5 hover:bg-blue-100 rounded disabled:opacity-50"
        >
          <ChevronLeft className="h-3 w-3" />
        </button>
      )}
      {children}
      {activeTab === 'set' && sets > 0 && (
        <button
          onClick={() =>
            onSetIndexChange(Math.min(sets - 1, currentSetIndex + 1))
          }
          disabled={currentSetIndex >= sets - 1}
          className="p-0.5 hover:bg-blue-100 rounded disabled:opacity-50"
        >
          <ChevronRight className="h-3 w-3" />
        </button>
      )}
    </>
  ) : (
    <>{children}</>
  );
};

export function TemplateConfigTabs({
  activeTab,
  onTabChange,
  currentSetIndex,
  sets,
  onSetIndexChange,
}: TemplateConfigTabsProps) {
  return (
    <div className="flex border-b border-gray-200">
      <button
        className={cn(
          'flex-1 px-3 py-1.5 text-xs font-medium cursor-pointer',
          activeTab === 'all'
            ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
        )}
        onClick={() => onTabChange('all')}
      >
        All
      </button>
      <div className="flex-1 flex items-center justify-center gap-1 relative">
        <div
          className={cn(
            'flex-1 px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-1 cursor-pointer',
            activeTab === 'set'
              ? 'border-b-2 border-blue-500 text-blue-600 bg-blue-50'
              : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
          )}
          onClick={() => onTabChange('set')}
        >
          <NavigationButtons
            activeTab={activeTab}
            sets={sets}
            currentSetIndex={currentSetIndex}
            onSetIndexChange={onSetIndexChange}
          >
            Set
            {activeTab === 'set' && sets > 0 && (
              <span className="text-xs">
                {currentSetIndex + 1}/{sets}
              </span>
            )}
          </NavigationButtons>
        </div>
      </div>
    </div>
  );
}
