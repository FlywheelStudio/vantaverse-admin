// Default data loaded from JSON files at build time
// These are used to initialize localStorage and reset to defaults

import teamsData from '@/data/teams.json';
import programsData from '@/data/programs.json';
import phasesData from '@/data/phases.json';
import blocksData from '@/data/blocks.json';
import assignedExercisesData from '@/data/assigned-exercises.json';
import exerciseSetsData from '@/data/exercise-sets.json';
import teamAssignmentsData from '@/data/team-assignments.json';
import { ProgramDay } from './types/assign-program-days';

export const defaultTeams = teamsData;
export const defaultPrograms = programsData;
export const defaultPhases = phasesData;
export const defaultBlocks = blocksData;
export const defaultAssignedExercises = assignedExercisesData;
export const defaultExerciseSets = exerciseSetsData;
export const defaultTeamAssignments = teamAssignmentsData;

// New days-based structure (empty by default)
export const defaultAssignProgramDays: ProgramDay[] = [];

