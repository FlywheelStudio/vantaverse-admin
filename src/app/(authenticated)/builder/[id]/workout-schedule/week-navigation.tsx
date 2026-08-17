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
import { Icon } from '@/components/medvanta';
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
  dayCount,
  isCurrent,
  isDisabled,
  onClick,
  onMouseEnter,
  onMouseLeave,
  isAnimating,
  animationType,
}: {
  week: Week;
  dayCount: number;
  isCurrent: boolean;
  isDisabled: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  isAnimating?: boolean;
  animationType?: 'copy' | 'paste' | null;
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
    <button
      type="button"
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className={cn(
        'wk select-none touch-none',
        isCurrent && 'on',
        isDisabled && 'mt',
        isDragging && 'cursor-grabbing',
      )}
    >
      <span className="wn">
        {isAnimating && animationType === 'copy'
          ? 'Copied!'
          : isAnimating && animationType === 'paste'
            ? 'Pasted!'
            : `Week ${week.number}`}
      </span>
      <span className="wm">{dayCount} day{dayCount === 1 ? '' : 's'}</span>
    </button>
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
    schedule,
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

  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [hoveredWeekIndex, setHoveredWeekIndex] = useState<number | null>(null);
  const [animatingWeek, setAnimatingWeek] = useState<{
    weekIndex: number;
    type: 'copy' | 'paste';
  } | null>(null);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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

  // Cleanup animation timeout on unmount
  useEffect(() => {
    return () => {
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }
    };
  }, []);

  const triggerAnimation = useCallback(
    (weekIndex: number, type: 'copy' | 'paste') => {
      // Clear any existing timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      // Set animation state immediately
      setAnimatingWeek({ weekIndex, type });

      // Clear animation after 1.5 seconds
      animationTimeoutRef.current = setTimeout(() => {
        setAnimatingWeek(null);
        animationTimeoutRef.current = null;
      }, 1500);
    },
    [],
  );

  const handleCopyWeek = useCallback(
    (weekIndex: number) => {
      copyWeek(weekIndex);
      triggerAnimation(weekIndex, 'copy');
    },
    [copyWeek, triggerAnimation],
  );

  const handlePasteWeek = useCallback(
    (weekIndex: number) => {
      pasteWeek(weekIndex);
      triggerAnimation(weekIndex, 'paste');
    },
    [pasteWeek, triggerAnimation],
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if a week is hovered
      if (hoveredWeekIndex === null) return;

      // Check for Ctrl+C (Windows/Linux) or Cmd+C (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'c') {
        // Don't copy if week is disabled
        if (!isWeekBeforeStart(hoveredWeekIndex)) {
          event.preventDefault();
          handleCopyWeek(hoveredWeekIndex);
        }
        return;
      }

      // Check for Ctrl+V (Windows/Linux) or Cmd+V (Mac)
      if ((event.ctrlKey || event.metaKey) && event.key === 'v') {
        // Validate paste conditions
        const canPaste =
          copiedWeekData &&
          copiedWeekIndex !== hoveredWeekIndex &&
          !isWeekBeforeStart(hoveredWeekIndex);

        if (canPaste) {
          event.preventDefault();
          handlePasteWeek(hoveredWeekIndex);
        }
        return;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [
    hoveredWeekIndex,
    handleCopyWeek,
    handlePasteWeek,
    copiedWeekData,
    copiedWeekIndex,
    isWeekBeforeStart,
  ]);

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
    <div className="wrail" style={{ marginBottom: 16 }}>
      <button
        type="button"
        className="ib ib-sec ib-sq"
        aria-label="Previous weeks"
        onClick={() => handleScroll('left')}
        disabled={!canScrollLeft}
        style={{ opacity: canScrollLeft ? 1 : 0.45 }}
      >
        <Icon name="ChevronLeft" size={17} />
      </button>

      <div
        ref={scrollContainerRef}
        className="row"
        style={{ gap: 7, overflowX: 'auto', flex: 1, padding: 2 }}
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
            <div className="row" style={{ gap: 7, minWidth: 'max-content' }}>
              {weeks.map((week, index) => {
                const weekIndex = index;
                const isDisabled = isWeekBeforeStart(weekIndex);
                const isAnimating =
                  animatingWeek?.weekIndex === weekIndex && !!animatingWeek;
                const animationType = isAnimating ? animatingWeek.type : null;
                const dayCount =
                  schedule[weekIndex]?.filter((day) => day.length > 0).length ?? 0;

                return (
                  <DraggableWeekButton
                    key={week.id}
                    week={week}
                    dayCount={dayCount}
                    isCurrent={weekIndex === currentWeek}
                    isDisabled={isDisabled}
                    onClick={() => {
                      setCurrentWeek(weekIndex);
                    }}
                    onMouseEnter={() => setHoveredWeekIndex(weekIndex)}
                    onMouseLeave={() => setHoveredWeekIndex(null)}
                    isAnimating={isAnimating}
                    animationType={animationType}
                  />
                );
              })}
            </div>
          </SortableContext>
        </DndContext>
      </div>

      <button
        type="button"
        className="ib ib-sec ib-sq"
        aria-label="Next weeks"
        onClick={() => handleScroll('right')}
        disabled={!canScrollRight}
      >
        <Icon name="ChevronRight" size={17} />
      </button>

      <CopyPasteButtons
        size="md"
        onCopy={() => handleCopyWeek(currentWeek)}
        onPaste={() => handlePasteWeek(currentWeek)}
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
