// Normalized database-like structure for programs

// Base entities (templates)
export type ProgramTemplate = {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
};

export type PhaseTemplate = {
  id: string;
  title: string;
  createdAt: string;
};

export type BlockTemplate = {
  id: string;
  name: string;
  isSuperset: boolean;
  createdAt: string;
};

export type AssignedExerciseTemplate = {
  id: string;
  exerciseId: string; // Reference to exercise library
  equipment: string[];
  createdAt: string;
};

export type ExerciseSetTemplate = {
  id: string;
  setNumber: number;
  reps?: number;
  time?: number;
  rest?: number;
  notes?: string;
  createdAt: string;
};

// Relationship tables
export type ProgramPhaseRelation = {
  programId: string;
  phaseId: string;
  order: number;
};

export type PhaseBlockRelation = {
  phaseId: string;
  blockId: string;
  order: number;
};

export type BlockExerciseRelation = {
  blockId: string;
  exerciseId: string;
  order: number;
};

export type ExerciseSetRelation = {
  exerciseId: string;
  setId: string;
  order: number;
};

// Team assignment (stores the complete program structure for a team)
export type TeamProgramAssignment = {
  id: string;
  teamId: string;
  programId: string;
  assignedAt: string;
  // Store the complete relationship tree for this team
  programPhases: ProgramPhaseRelation[];
  phaseBlocks: PhaseBlockRelation[];
  blockExercises: BlockExerciseRelation[];
  exerciseSets: ExerciseSetRelation[];
};

// Helper type for working with full program structure
export type FullProgramStructure = {
  program: ProgramTemplate;
  phases: Array<{
    phase: PhaseTemplate;
    blocks: Array<{
      block: BlockTemplate;
      exercises: Array<{
        exercise: AssignedExerciseTemplate;
        sets: ExerciseSetTemplate[];
      }>;
    }>;
  }>;
};
