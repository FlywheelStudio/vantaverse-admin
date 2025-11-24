'use server'

import { getJsonFile, updateJsonFile } from '@/lib/storage';
import { Team } from '@/lib/mock-data';
import { revalidatePath } from 'next/cache';

const TEAMS_FILE = 'teams.json';

export async function getTeams(): Promise<Team[]> {
  return getJsonFile<Team[]>(TEAMS_FILE);
}

export async function createTeam(name: string): Promise<Team> {
  const teams = await getTeams();
  const newTeam: Team = {
    id: `team-${Date.now()}`,
    name,
    patientIds: [],
    createdAt: new Date().toISOString(),
  };
  
  await updateJsonFile(TEAMS_FILE, [...teams, newTeam]);
  revalidatePath('/teams');
  return newTeam;
}

export async function assignPatientToTeam(teamId: string, patientId: string): Promise<void> {
  const teams = await getTeams();
  const updatedTeams = teams.map(team => {
    if (team.id === teamId) {
      // Add patient if not already in team
      if (!team.patientIds.includes(patientId)) {
        return { ...team, patientIds: [...team.patientIds, patientId] };
      }
    }
    // Do not remove patient from other teams; allow multiple team memberships
    return team;
  });

  await updateJsonFile(TEAMS_FILE, updatedTeams);
  revalidatePath('/teams');
}

export async function assignMultiplePatientsToTeam(teamId: string, patientIds: string[]): Promise<void> {
  const teams = await getTeams();
  const updatedTeams = teams.map(team => {
    if (team.id === teamId) {
      // Add new patients, avoiding duplicates
      const newIds = patientIds.filter(id => !team.patientIds.includes(id));
      return { ...team, patientIds: [...team.patientIds, ...newIds] };
    }
    // Do not remove patients from other teams; allow multiple team memberships
    return team;
  });

  await updateJsonFile(TEAMS_FILE, updatedTeams);
  revalidatePath('/teams');
}
