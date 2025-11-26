"use server";

import { getJsonFile, updateJsonFile } from "@/lib/storage";
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

export async function getTeamsAction(): Promise<Team[]> {
  return await getJsonFile<Team[]>("teams.json");
}

// ============================================================================
// UPSERT FUNCTIONS (Find existing or create new)
// ============================================================================

export async function upsertProgram(name: string, description: string): Promise<ProgramTemplate> {
  const programs = await getJsonFile<ProgramTemplate[]>("programs.json");
  
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
  
  await updateJsonFile("programs.json", [...programs, newProgram]);
  return newProgram;
}

export async function upsertPhase(title: string): Promise<PhaseTemplate> {
  const phases = await getJsonFile<PhaseTemplate[]>("phases.json");
  
  const existing = phases.find(p => p.title === title);
  if (existing) return existing;
  
  const newPhase: PhaseTemplate = {
    id: `phase-${Date.now()}`,
    title,
    createdAt: new Date().toISOString(),
  };
  
  await updateJsonFile("phases.json", [...phases, newPhase]);
  return newPhase;
}

export async function upsertBlock(name: string, isSuperset: boolean): Promise<BlockTemplate> {
  const blocks = await getJsonFile<BlockTemplate[]>("blocks.json");
  
  const existing = blocks.find(b => b.name === name && b.isSuperset === isSuperset);
  if (existing) return existing;
  
  const newBlock: BlockTemplate = {
    id: `block-${Date.now()}`,
    name,
    isSuperset,
    createdAt: new Date().toISOString(),
  };
  
  await updateJsonFile("blocks.json", [...blocks, newBlock]);
  return newBlock;
}

export async function upsertAssignedExercise(
  exerciseId: string,
  equipment: string[]
): Promise<AssignedExerciseTemplate> {
  const exercises = await getJsonFile<AssignedExerciseTemplate[]>("assigned-exercises.json");
  
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
  
  await updateJsonFile("assigned-exercises.json", [...exercises, newExercise]);
  return newExercise;
}

export async function upsertExerciseSet(
  setNumber: number,
  reps?: number,
  time?: number,
  rest?: number,
  notes?: string
): Promise<ExerciseSetTemplate> {
  const sets = await getJsonFile<ExerciseSetTemplate[]>("exercise-sets.json");
  
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
  
  await updateJsonFile("exercise-sets.json", [...sets, newSet]);
  return newSet;
}

// ============================================================================
// TEAM ASSIGNMENT FUNCTIONS
// ============================================================================

export async function getTeamAssignment(teamId: string): Promise<TeamProgramAssignment | null> {
  const assignments = await getJsonFile<TeamProgramAssignment[]>("team-assignments.json");
  return assignments.find(a => a.teamId === teamId) || null;
}

export async function getAllTeamAssignments(): Promise<TeamProgramAssignment[]> {
  return await getJsonFile<TeamProgramAssignment[]>("team-assignments.json");
}

export async function saveTeamAssignment(assignment: TeamProgramAssignment): Promise<void> {
  const assignments = await getJsonFile<TeamProgramAssignment[]>("team-assignments.json");
  
  const existingIndex = assignments.findIndex(a => a.teamId === assignment.teamId);
  
  if (existingIndex >= 0) {
    assignments[existingIndex] = assignment;
  } else {
    assignments.push(assignment);
  }
  
  await updateJsonFile("team-assignments.json", assignments);
}

// ============================================================================
// LOAD FULL PROGRAM STRUCTURE FOR A TEAM
// ============================================================================

export async function loadTeamProgramStructure(teamId: string): Promise<FullProgramStructure | null> {
  const assignment = await getTeamAssignment(teamId);
  if (!assignment) return null;
  
  const programs = await getJsonFile<ProgramTemplate[]>("programs.json");
  const phases = await getJsonFile<PhaseTemplate[]>("phases.json");
  const blocks = await getJsonFile<BlockTemplate[]>("blocks.json");
  const exercises = await getJsonFile<AssignedExerciseTemplate[]>("assigned-exercises.json");
  const sets = await getJsonFile<ExerciseSetTemplate[]>("exercise-sets.json");
  
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

export async function getAllPrograms(): Promise<ProgramTemplate[]> {
  return await getJsonFile<ProgramTemplate[]>("programs.json");
}

export async function getAllPhases(): Promise<PhaseTemplate[]> {
  return await getJsonFile<PhaseTemplate[]>("phases.json");
}

export async function getAllBlocks(): Promise<BlockTemplate[]> {
  return await getJsonFile<BlockTemplate[]>("blocks.json");
}
