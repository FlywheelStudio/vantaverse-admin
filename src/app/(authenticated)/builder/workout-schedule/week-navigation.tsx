'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import { restrictToHorizontalAxis } from '@dnd-kit/modifiers';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  horizontalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBuilder } from '@/context/builder-context';
import { CopyPasteButtons } from '@/components/ui/copy-paste-buttons';
import { cn } from '@/lib/utils';

interface Week {
  id: string;
  number: number;
}

interface WeekNavigationProps {
  initialWeeks: number;
}

function DraggableWeekButton({
  week,
  isCurrent,
  isDisabled,
  onClick,
}: {
  week: Week;
  isCurrent: boolean;
  isDisabled: boolean;
  onClick: () => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: week.id });

  const hasDraggedRef = useRef(false);

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  useEffect(() => {
    if (isDragging) {
      hasDraggedRef.current = true;
    } else {
      // Reset after drag ends
      setTimeout(() => {
        hasDraggedRef.current = false;
      }, 100);
    }
  }, [isDragging]);

  const handleClick = () => {
    // Only handle click if no drag occurred and not disabled
    if (!hasDraggedRef.current && !isDragging && !isDisabled) {
      onClick();
    }
    hasDraggedRef.current = false;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all min-w-[100px] h-9 px-4 py-2 select-none touch-none',
        isDisabled
          ? 'opacity-70 cursor-not-allowed border-red-400 bg-red-50/50 text-red-500'
          : isDragging
            ? 'cursor-grabbing border bg-background shadow-xs'
            : 'cursor-pointer active:cursor-grabbing',
        !isDisabled && !isDragging && isCurrent
          ? 'bg-[#2454FF] hover:bg-[#1E3FCC] text-white border-none'
          : !isDisabled
            ? 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50'
            : '',
      )}
    >
      Week {week.number}
    </div>
  );
}

export function WeekNavigation({ initialWeeks }: WeekNavigationProps) {
  const {
    currentWeek,
    setCurrentWeek,
    reorderWeeks,
    copiedWeekIndex,
    copiedWeekData,
    copyWeek,
    pasteWeek,
    programStartDate,
  } = useBuilder();

  // Parse date string to local date (avoiding timezone issues)
  const parseLocalDate = useCallback((dateString: string): Date => {
    // Parse YYYY-MM-DD format to local date
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day, 0, 0, 0, 0);
  }, []);

  // Calculate if all days in a week are before start_date
  const isWeekBeforeStart = useCallback(
    (weekIndex: number): boolean => {
      if (!programStartDate) return false;

      const start = parseLocalDate(programStartDate);

      // Check all 7 days in the week
      for (let dayIndex = 0; dayIndex < 7; dayIndex++) {
        const dayDate = new Date(start);
        dayDate.setDate(dayDate.getDate() + weekIndex * 7 + dayIndex);
        dayDate.setHours(0, 0, 0, 0);

        // If any day is on or after start, the week is not entirely before start
        if (dayDate.getTime() >= start.getTime()) {
          return false;
        }
      }
      // All days are before start
      return true;
    },
    [programStartDate, parseLocalDate],
  );

  const [weeks, setWeeks] = useState<Week[]>(() =>
    Array.from({ length: initialWeeks }, (_, i) => ({
      id: `week-${i + 1}`,
      number: i + 1,
    })),
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  useEffect(() => {
    const checkScroll = () => {
      const container = scrollContainerRef.current;
      if (container) {
        setCanScrollLeft(container.scrollLeft > 0);
        setCanScrollRight(
          container.scrollLeft < container.scrollWidth - container.clientWidth,
        );
      }
    };

    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener('scroll', checkScroll);
      window.addEventListener('resize', checkScroll);
      return () => {
        container.removeEventListener('scroll', checkScroll);
        window.removeEventListener('resize', checkScroll);
      };
    }
  }, [weeks]);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      // Calculate indices and new order using current weeks state
      const oldIndex = weeks.findIndex((item) => item.id === active.id);
      const newIndex = weeks.findIndex((item) => item.id === over.id);

      // Create array of original indices [0, 1, 2, ...]
      const originalIndices = weeks.map((_, index) => index);
      // Apply the same move operation to get the new order
      const newOrder = arrayMove(originalIndices, oldIndex, newIndex);

      // Call reorderWeeks once, before state update
      reorderWeeks(newOrder);

      // Update weeks state
      setWeeks((items) => {
        const reordered = arrayMove(items, oldIndex, newIndex);
        const reorderedWithNewNumbers = reordered.map((week, index) => ({
          ...week,
          number: index + 1,
        }));

        return reorderedWithNewNumbers;
      });
    }
  };

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        onClick={() => handleScroll('left')}
        disabled={!canScrollLeft}
        className="shrink-0"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <div
        ref={scrollContainerRef}
        className="flex-1 overflow-x-auto scrollbar-hide flex gap-2 px-2"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          modifiers={[restrictToHorizontalAxis]}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={weeks.map((w) => w.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-2 min-w-max">
              {weeks.map((week, index) => {
                const weekIndex = index;
                const isDisabled = isWeekBeforeStart(weekIndex);
                return (
                  <DraggableWeekButton
                    key={week.id}
                    week={week}
                    isCurrent={weekIndex === currentWeek}
                    isDisabled={isDisabled}
                    onClick={() => {
                      setCurrentWeek(weekIndex);
                    }}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <Button
        variant="outline"
        size="icon"
        onClick={() => handleScroll('right')}
        disabled={!canScrollRight}
        className="shrink-0"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      <CopyPasteButtons
        size="md"
        onCopy={() => copyWeek(currentWeek)}
        onPaste={() => pasteWeek(currentWeek)}
        isCopied={copiedWeekIndex === currentWeek}
        isPasteDisabled={
          !copiedWeekData ||
          copiedWeekIndex === currentWeek ||
          isWeekBeforeStart(currentWeek)
        }
        copyTooltip="Copy Current Week"
        pasteTooltip="Paste Week"
        copiedTooltip="Week already copied"
      />
    </div>
  );
}
