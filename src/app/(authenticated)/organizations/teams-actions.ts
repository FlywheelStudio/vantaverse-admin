'use server';

import { TeamsQuery } from '@/lib/supabase/queries/teams';
import type { Team } from '@/lib/supabase/schemas/teams';

/**
 * Get all teams for an organization
 */
export async function getTeamsByOrganizationId(organizationId: string) {
  const query = new TeamsQuery();
  return query.getByOrganizationId(organizationId);
}

/**
 * Create a new team
 */
export async function createTeam(
  organizationId: string,
  name: string,
  description?: string | null,
  notes?: string | null,
) {
  const query = new TeamsQuery();
  return query.create(organizationId, name, description, notes);
}

/**
 * Update a team
 */
export async function updateTeam(id: string, data: Partial<Team>) {
  const query = new TeamsQuery();
  return query.update(id, data);
}

/**
 * Delete a team
 */
export async function deleteTeam(id: string) {
  const query = new TeamsQuery();
  return query.delete(id);
}
