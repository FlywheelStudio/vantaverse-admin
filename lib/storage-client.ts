import { Team } from './mock-data';

// Client-side helper functions
export function getTeams(): Team[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const data = localStorage.getItem('teams');
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export function updateTeams(teams: Team[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('teams', JSON.stringify(teams));
}
