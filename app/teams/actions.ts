'use client'

import { getTeams, updateTeams } from '@/lib/storage-client';
import { Team } from '@/lib/mock-data';

export function getTeamsAction(): Team[] {
  return getTeams();
}

export function createTeam(name: string): Team {
  const teams = getTeams();
  const newTeam: Team = {
    id: `team-${Date.now()}`,
    name,
    patientIds: [],
    createdAt: new Date().toISOString(),
  };
  
  updateTeams([...teams, newTeam]);
  return newTeam;
}

export function assignPatientToTeam(teamId: string, patientId: string): void {
  const teams = getTeams();
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

  updateTeams(updatedTeams);
}

export function assignMultiplePatientsToTeam(teamId: string, patientIds: string[]): void {
  const teams = getTeams();
  const updatedTeams = teams.map(team => {
    if (team.id === teamId) {
      // Add new patients, avoiding duplicates
      const newIds = patientIds.filter(id => !team.patientIds.includes(id));
      return { ...team, patientIds: [...team.patientIds, ...newIds] };
    }
    // Do not remove patients from other teams; allow multiple team memberships
    return team;
  });

  updateTeams(updatedTeams);
}
