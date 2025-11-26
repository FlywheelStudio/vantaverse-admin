import { Team } from './mock-data';
import {
  ProgramTemplate,
  PhaseTemplate,
  BlockTemplate,
  AssignedExerciseTemplate,
  ExerciseSetTemplate,
  TeamProgramAssignment,
} from './types/program-templates';
import { ProgramDay } from './types/assign-program-days';
import {
  defaultTeams,
  defaultPrograms,
  defaultPhases,
  defaultBlocks,
  defaultAssignedExercises,
  defaultExerciseSets,
  defaultTeamAssignments,
  defaultAssignProgramDays,
} from './storage-defaults';

// LocalStorage keys
const STORAGE_KEYS = {
  TEAMS: 'vantaverse_teams',
  PROGRAMS: 'vantaverse_programs',
  PHASES: 'vantaverse_phases',
  BLOCKS: 'vantaverse_blocks',
  ASSIGNED_EXERCISES: 'vantaverse_assigned_exercises',
  EXERCISE_SETS: 'vantaverse_exercise_sets',
  TEAM_ASSIGNMENTS: 'vantaverse_team_assignments',
  ASSIGN_PROGRAM_DAYS: 'vantaverse_assign_program_days',
} as const;

// Helper function to safely get from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') return defaultValue;
  
  try {
    const data = localStorage.getItem(key);
    return data ? JSON.parse(data) : defaultValue;
  } catch {
    return defaultValue;
  }
}

// Helper function to safely set to localStorage
function setToStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Failed to save to localStorage key "${key}":`, error);
  }
}

// Teams
export function getTeams(): Team[] {
  return getFromStorage(STORAGE_KEYS.TEAMS, defaultTeams);
}

export function updateTeams(teams: Team[]): void {
  setToStorage(STORAGE_KEYS.TEAMS, teams);
}

// Programs
export function getPrograms(): ProgramTemplate[] {
  return getFromStorage(STORAGE_KEYS.PROGRAMS, defaultPrograms);
}

export function updatePrograms(programs: ProgramTemplate[]): void {
  setToStorage(STORAGE_KEYS.PROGRAMS, programs);
}

// Phases
export function getPhases(): PhaseTemplate[] {
  return getFromStorage(STORAGE_KEYS.PHASES, defaultPhases);
}

export function updatePhases(phases: PhaseTemplate[]): void {
  setToStorage(STORAGE_KEYS.PHASES, phases);
}

// Blocks
export function getBlocks(): BlockTemplate[] {
  return getFromStorage(STORAGE_KEYS.BLOCKS, defaultBlocks);
}

export function updateBlocks(blocks: BlockTemplate[]): void {
  setToStorage(STORAGE_KEYS.BLOCKS, blocks);
}

// Assigned Exercises
export function getAssignedExercises(): AssignedExerciseTemplate[] {
  return getFromStorage(STORAGE_KEYS.ASSIGNED_EXERCISES, defaultAssignedExercises);
}

export function updateAssignedExercises(exercises: AssignedExerciseTemplate[]): void {
  setToStorage(STORAGE_KEYS.ASSIGNED_EXERCISES, exercises);
}

// Exercise Sets
export function getExerciseSets(): ExerciseSetTemplate[] {
  return getFromStorage(STORAGE_KEYS.EXERCISE_SETS, defaultExerciseSets);
}

export function updateExerciseSets(sets: ExerciseSetTemplate[]): void {
  setToStorage(STORAGE_KEYS.EXERCISE_SETS, sets);
}

// Team Assignments
export function getTeamAssignments(): TeamProgramAssignment[] {
  return getFromStorage(STORAGE_KEYS.TEAM_ASSIGNMENTS, defaultTeamAssignments);
}

export function updateTeamAssignments(assignments: TeamProgramAssignment[]): void {
  setToStorage(STORAGE_KEYS.TEAM_ASSIGNMENTS, assignments);
}

// Assign Program Days (new days-based structure)
export function getAssignProgramDays(): ProgramDay[] {
  return getFromStorage(STORAGE_KEYS.ASSIGN_PROGRAM_DAYS, defaultAssignProgramDays);
}

export function updateAssignProgramDays(days: ProgramDay[]): void {
  setToStorage(STORAGE_KEYS.ASSIGN_PROGRAM_DAYS, days);
}

// Reset to defaults
export function resetToDefaults(): void {
  if (typeof window === 'undefined') return;
  
  try {
    updateTeams(defaultTeams);
    updatePrograms(defaultPrograms);
    updatePhases(defaultPhases);
    updateBlocks(defaultBlocks);
    updateAssignedExercises(defaultAssignedExercises);
    updateExerciseSets(defaultExerciseSets);
    updateTeamAssignments(defaultTeamAssignments);
    updateAssignProgramDays(defaultAssignProgramDays);
  } catch (error) {
    console.error('Failed to reset localStorage to defaults:', error);
    throw error;
  }
}
