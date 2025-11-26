// Storage initialization utility
// Checks if localStorage is empty and populates with defaults

import {
  getTeams,
  getPrograms,
  getPhases,
  getBlocks,
  getAssignedExercises,
  getExerciseSets,
  getTeamAssignments,
  getAssignProgramDays,
  resetToDefaults,
} from './storage-client';

const STORAGE_KEY = 'vantaverse_initialized';

/**
 * Initialize localStorage with default data if it hasn't been initialized yet
 * This should be called once on app startup (client-side only)
 */
export function initializeStorage(): void {
  if (typeof window === 'undefined') return;

  try {
    // Check if we've already initialized (even if user cleared some data, we don't want to auto-reset)
    const initialized = localStorage.getItem(STORAGE_KEY);
    
    if (!initialized) {
      // Check if any of our keys exist - if none exist, initialize all
      const hasAnyData = 
        getTeams().length > 0 ||
        getPrograms().length > 0 ||
        getPhases().length > 0 ||
        getBlocks().length > 0 ||
        getAssignedExercises().length > 0 ||
        getExerciseSets().length > 0 ||
        getTeamAssignments().length > 0 ||
        getAssignProgramDays().length > 0;

      // If no data exists, initialize with defaults
      if (!hasAnyData) {
        resetToDefaults();
      }
      
      // Mark as initialized
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  } catch (error) {
    console.error('Failed to initialize storage:', error);
  }
}

