'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { ExerciseBuilderModal } from './exercise-builder-modal';
import type { SelectedItem } from '@/app/(authenticated)/builder/template-config/types';

export function DayBoxesGrid() {
  const days = Array.from({ length: 7 }, (_, i) => i + 1);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const handleAddExercise = (day: number) => {
    setSelectedDay(day);
    setModalOpen(true);
  };

  const handleModalDone = (selectedItems: SelectedItem[]) => {
    // TODO: Handle selected items (save to workout schedule)
    console.log('Selected items for day', selectedDay, ':', selectedItems);
    setModalOpen(false);
    setSelectedDay(null);
  };

  return (
    <>
      <div className="mt-6 overflow-x-auto scrollbar-hide">
        <div className="flex gap-4">
          {days.map((day) => (
            <div key={day} className="flex flex-col flex-1 min-w-[160px]">
              <h3 className="text-base font-semibold text-[#1E3A5F] mb-3 text-center">
                Day {day}
              </h3>
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[200px] flex flex-col items-center justify-center gap-4 bg-gray-50/50">
                <p className="h-full flex flex-col items-center justify-center text-gray-400 text-sm cursor-default">
                  Rest Day
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-dashed border-gray-300 text-gray-600 hover:bg-gray-100 cursor-pointer"
                  onClick={() => handleAddExercise(day)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Exercise
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <ExerciseBuilderModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        onDone={handleModalDone}
      />
    </>
  );
}
