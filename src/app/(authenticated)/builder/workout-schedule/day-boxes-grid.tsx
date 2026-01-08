'use client';

import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function DayBoxesGrid() {
  const days = Array.from({ length: 7 }, (_, i) => i + 1);

  return (
    <div className="mt-6 overflow-x-auto scrollbar-hide">
      <div className="flex gap-4">
        {days.map((day) => (
          <div key={day} className="flex flex-col flex-1 min-w-[160px]">
            <h3 className="text-base font-semibold text-[#1E3A5F] mb-3 text-center">
              Day {day}
            </h3>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 min-h-[200px] flex flex-col items-center justify-center gap-4 bg-gray-50/50">
              <p className="text-gray-400 text-sm">Rest Day</p>
              <Button
                variant="outline"
                size="sm"
                className="border-dashed border-gray-300 text-gray-600 hover:bg-gray-100"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Exercise
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
