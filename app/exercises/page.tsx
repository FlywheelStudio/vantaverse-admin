"use client";

import { ExerciseGrid } from "@/components/exercises/exercise-grid";

export default function ExercisesPage() {
  return (
    <div className="flex-1 space-y-4">
      <div className="flex items-center justify-between space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Exercise Library</h2>
      </div>
      <ExerciseGrid />
    </div>
  );
}
