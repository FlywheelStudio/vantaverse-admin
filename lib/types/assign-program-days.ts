// Days-based structure for assign-program data
// Simple structure: Array of days, each day has exercises, each exercise has sets

export type DayExerciseSet = {
  id: string;
  setNumber: number;
  reps?: number;
  time?: number;
  rest?: number;
  notes?: string;
};

export type DayExercise = {
  id: string;
  exerciseId: string;
  equipment: string[];
  sets: DayExerciseSet[];
};

export type ProgramDay = {
  id: string;
  dayNumber: number;
  name?: string;
  exercises: DayExercise[];
};

