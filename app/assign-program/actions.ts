"use client";

import {
  getTeams,
  getPrograms,
  updatePrograms,
  getPhases,
  updatePhases,
  getBlocks,
  updateBlocks,
  getAssignedExercises,
  updateAssignedExercises,
  getExerciseSets,
  updateExerciseSets,
  getTeamAssignments,
  updateTeamAssignments,
} from "@/lib/storage-client";
import {
  ProgramTemplate,
  PhaseTemplate,
  BlockTemplate,
  AssignedExerciseTemplate,
  ExerciseSetTemplate,
  TeamProgramAssignment,
  FullProgramStructure,
  ProgramPhaseRelation,
  PhaseBlockRelation,
  BlockExerciseRelation,
  ExerciseSetRelation,
} from "@/lib/types/program-templates";
import { Team } from "@/lib/mock-data";

// ============================================================================
// TEAMS
// ============================================================================

export function getTeamsAction(): Team[] {
  return getTeams();
}

// ============================================================================
// UPSERT FUNCTIONS (Find existing or create new)
// ============================================================================

export function upsertProgram(name: string, description: string): ProgramTemplate {
  const programs = getPrograms();
  
  // Find existing by name and description
  const existing = programs.find(p => p.name === name && p.description === description);
  if (existing) return existing;
  
  // Create new
  const newProgram: ProgramTemplate = {
    id: `prog-${Date.now()}`,
    name,
    description,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  updatePrograms([...programs, newProgram]);
  return newProgram;
}

export function upsertPhase(title: string): PhaseTemplate {
  const phases = getPhases();
  
  const existing = phases.find(p => p.title === title);
  if (existing) return existing;
  
  const newPhase: PhaseTemplate = {
    id: `phase-${Date.now()}`,
    title,
    createdAt: new Date().toISOString(),
  };
  
  updatePhases([...phases, newPhase]);
  return newPhase;
}

export function upsertBlock(name: string, isSuperset: boolean): BlockTemplate {
  const blocks = getBlocks();
  
  const existing = blocks.find(b => b.name === name && b.isSuperset === isSuperset);
  if (existing) return existing;
  
  const newBlock: BlockTemplate = {
    id: `block-${Date.now()}`,
    name,
    isSuperset,
    createdAt: new Date().toISOString(),
  };
  
  updateBlocks([...blocks, newBlock]);
  return newBlock;
}

export function upsertAssignedExercise(
  exerciseId: string,
  equipment: string[]
): AssignedExerciseTemplate {
  const exercises = getAssignedExercises();
  
  const existing = exercises.find(
    e => e.exerciseId === exerciseId && 
    JSON.stringify(e.equipment.sort()) === JSON.stringify(equipment.sort())
  );
  if (existing) return existing;
  
  const newExercise: AssignedExerciseTemplate = {
    id: `assigned-ex-${Date.now()}`,
    exerciseId,
    equipment,
    createdAt: new Date().toISOString(),
  };
  
  updateAssignedExercises([...exercises, newExercise]);
  return newExercise;
}

export function upsertExerciseSet(
  setNumber: number,
  reps?: number,
  time?: number,
  rest?: number,
  notes?: string
): ExerciseSetTemplate {
  const sets = getExerciseSets();
  
  const existing = sets.find(
    s => s.setNumber === setNumber &&
    s.reps === reps &&
    s.time === time &&
    s.rest === rest &&
    s.notes === notes
  );
  if (existing) return existing;
  
  const newSet: ExerciseSetTemplate = {
    id: `set-${Date.now()}`,
    setNumber,
    reps,
    time,
    rest,
    notes,
    createdAt: new Date().toISOString(),
  };
  
  updateExerciseSets([...sets, newSet]);
  return newSet;
}

// ============================================================================
// TEAM ASSIGNMENT FUNCTIONS
// ============================================================================

export function getTeamAssignment(teamId: string): TeamProgramAssignment | null {
  const assignments = getTeamAssignments();
  return assignments.find(a => a.teamId === teamId) || null;
}

export function getAllTeamAssignments(): TeamProgramAssignment[] {
  return getTeamAssignments();
}

export function saveTeamAssignment(assignment: TeamProgramAssignment): void {
  const assignments = getTeamAssignments();
  
  const existingIndex = assignments.findIndex(a => a.teamId === assignment.teamId);
  
  if (existingIndex >= 0) {
    assignments[existingIndex] = assignment;
  } else {
    assignments.push(assignment);
  }
  
  updateTeamAssignments(assignments);
}

// ============================================================================
// LOAD FULL PROGRAM STRUCTURE FOR A TEAM
// ============================================================================

export function loadTeamProgramStructure(teamId: string): FullProgramStructure | null {
  const assignment = getTeamAssignment(teamId);
  if (!assignment) return null;
  
  const programs = getPrograms();
  const phases = getPhases();
  const blocks = getBlocks();
  const exercises = getAssignedExercises();
  const sets = getExerciseSets();
  
  const program = programs.find(p => p.id === assignment.programId);
  if (!program) return null;
  
  // Build the full structure
  const structure: FullProgramStructure = {
    program,
    phases: assignment.programPhases
      .sort((a, b) => a.order - b.order)
      .map(pp => {
        const phase = phases.find(p => p.id === pp.phaseId)!;
        const phaseBlockRels = assignment.phaseBlocks.filter(pb => pb.phaseId === pp.phaseId);
        
        return {
          phase,
          blocks: phaseBlockRels
            .sort((a, b) => a.order - b.order)
            .map(pb => {
              const block = blocks.find(b => b.id === pb.blockId)!;
              const blockExRels = assignment.blockExercises.filter(be => be.blockId === pb.blockId);
              
              return {
                block,
                exercises: blockExRels
                  .sort((a, b) => a.order - b.order)
                  .map(be => {
                    const exercise = exercises.find(e => e.id === be.exerciseId)!;
                    const exSetRels = assignment.exerciseSets.filter(es => es.exerciseId === be.exerciseId);
                    
                    return {
                      exercise,
                      sets: exSetRels
                        .sort((a, b) => a.order - b.order)
                        .map(es => sets.find(s => s.id === es.setId)!)
                        .filter(Boolean),
                    };
                  }),
              };
            }),
        };
      }),
  };
  
  return structure;
}

// ============================================================================
// GET ALL PROGRAMS (for template selection)
// ============================================================================

export function getAllPrograms(): ProgramTemplate[] {
  return getPrograms();
}

export function getAllPhases(): PhaseTemplate[] {
  return getPhases();
}

export function getAllBlocks(): BlockTemplate[] {
  return getBlocks();
}
