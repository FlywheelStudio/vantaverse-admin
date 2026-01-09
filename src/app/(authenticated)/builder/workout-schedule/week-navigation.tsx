'use client';

import { useState, useRef, useEffect } from 'react';
import type { MouseEvent } from 'react';
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
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBuilder } from '@/context/builder-context';

interface Week {
  id: string;
  number: number;
}

interface WeekNavigationProps {
  initialWeeks: number;
  onWeeksChange?: (weeks: Week[]) => void;
}

function DraggableWeekButton({
  week,
  isCurrent,
  onClick,
}: {
  week: Week;
  isCurrent: boolean;
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
  const pointerDownRef = useRef(false);

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
        pointerDownRef.current = false;
      }, 0);
    }
  }, [isDragging]);

  const handleClick = (e: MouseEvent) => {
    // Only handle click if no drag occurred
    if (!hasDraggedRef.current && !isDragging) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
    hasDraggedRef.current = false;
  };

  const handleMouseUp = (e: MouseEvent) => {
    // Handle click on mouse up if no drag occurred
    if (!hasDraggedRef.current && !isDragging && pointerDownRef.current) {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    }
    pointerDownRef.current = false;
    hasDraggedRef.current = false;
  };

  const handlePointerDown = () => {
    pointerDownRef.current = true;
    hasDraggedRef.current = false;
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onPointerDown={handlePointerDown}
    >
      <Button
        variant={isDragging ? 'outline' : isCurrent ? 'default' : 'outline'}
        onClick={handleClick}
        onMouseUp={handleMouseUp}
        className={`min-w-[100px] ${
          isDragging
            ? 'cursor-grabbing'
            : 'cursor-pointer active:cursor-grabbing'
        } ${
          !isDragging && isCurrent
            ? 'bg-[#2454FF] hover:bg-[#1E3FCC] text-white'
            : ''
        }`}
      >
        Week {week.number}
      </Button>
    </div>
  );
}

export function WeekNavigation({
  initialWeeks,
  onWeeksChange,
}: WeekNavigationProps) {
  const { currentWeek, setCurrentWeek } = useBuilder();
  const [weeks, setWeeks] = useState<Week[]>(() =>
    Array.from({ length: initialWeeks }, (_, i) => ({
      id: `week-${i + 1}`,
      number: i + 1,
    })),
  );

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Initialize current week to 0 if not set
  useEffect(() => {
    if (currentWeek === 0 && weeks.length > 0) {
      setCurrentWeek(0);
    }
  }, [currentWeek, weeks.length, setCurrentWeek]);

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
    onWeeksChange?.(weeks);
  }, [weeks, onWeeksChange]);

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
      setWeeks((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
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

  const handleAddWeek = () => {
    const newWeekNumber = weeks.length + 1;
    setWeeks([
      ...weeks,
      {
        id: `week-${newWeekNumber}`,
        number: newWeekNumber,
      },
    ]);
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
              {weeks.map((week) => (
                <DraggableWeekButton
                  key={week.id}
                  week={week}
                  isCurrent={week.number - 1 === currentWeek}
                  onClick={() => setCurrentWeek(week.number - 1)}
                />
              ))}
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

      <Button
        onClick={handleAddWeek}
        className="bg-[#2454FF] hover:bg-[#1E3FCC] text-white font-semibold px-4 rounded-xl shadow-lg shrink-0 flex items-center gap-2"
      >
        <Plus className="h-4 w-4" />
        Add Week
      </Button>
    </div>
  );
}
