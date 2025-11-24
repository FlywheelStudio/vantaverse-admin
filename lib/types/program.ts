// Program Assignment Types

export type EquipmentType = 
  | "Bodyweight"
  | "Mat"
  | "Foam Roller"
  | "Kettlebell"
  | "Dumbbell"
  | "Cable Machine"
  | "Rope"
  | "Box"
  | "Resistance Band"
  | "Barbell"
  | "Medicine Ball"
  | "TRX"
  | "Yoga Block"
  | "Custom";

export type ExerciseSet = {
  id: string;
  setNumber: number;
  reps?: number; // Either reps OR time
  time?: number; // in seconds
  rest?: number; // in seconds
  notes?: string;
};

export type AssignedExercise = {
  id: string;
  exerciseId: string; // Reference to exercise from library
  equipment: string[]; // Can include custom equipment
  sets: ExerciseSet[];
  order: number;
};

export type Block = {
  id: string;
  name: string;
  isSuperset: boolean;
  exercises: AssignedExercise[];
  order: number;
};

export type Phase = {
  id: string;
  title: string;
  blocks: Block[];
  order: number;
};

export type Program = {
  id: string;
  name: string;
  description: string;
  isTemplate: boolean;
  phases: Phase[];
  createdAt: string;
  updatedAt: string;
};

export type ProgramAssignment = {
  id: string;
  teamId: string;
  programId: string;
  assignedAt: string;
  status: "draft" | "active" | "completed";
};

// Breadcrumb step types
export type BreadcrumbStep = 
  | "team"
  | "program"
  | "phase"
  | "block"
  | "exercise"
  | "sets"
  | "summary";

export type AssignmentState = {
  currentStep: BreadcrumbStep;
  selectedTeamId?: string;
  selectedProgramId?: string;
  currentProgram?: Program;
  currentPhaseId?: string;
  currentBlockId?: string;
  currentExerciseId?: string;
};
