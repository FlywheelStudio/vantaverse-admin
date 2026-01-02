'use server';

import { TeamsQuery } from '@/lib/supabase/queries/teams';
import { createClient } from '@/lib/supabase/core/server';
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

/**
 * Get current member user IDs for a team
 */
export async function getTeamMemberUserIds(teamId: string) {
  const query = new TeamsQuery();
  return query.getMemberUserIds(teamId);
}

/**
 * Update team members (add and remove)
 */
export async function updateTeamMembers(teamId: string, userIds: string[]) {
  const teamsQuery = new TeamsQuery();
  const supabase = await createClient();

  // Get current member user IDs
  const currentResult = await teamsQuery.getMemberUserIds(teamId);
  if (!currentResult.success) {
    return currentResult;
  }

  const currentUserIds = currentResult.data;
  const currentUserIdsSet = new Set(currentUserIds);

  // Calculate additions and removals
  const newUserIdsSet = new Set(userIds);
  const toAdd = userIds.filter((id) => !currentUserIdsSet.has(id));
  const toRemove = currentUserIds.filter((id) => !newUserIdsSet.has(id));

  let added = 0;
  let removed = 0;

  // Add new members
  if (toAdd.length > 0) {
    const { error: insertError } = await supabase
      .from('team_membership')
      .insert(
        toAdd.map((user_id) => ({
          team_id: teamId,
          user_id,
        })),
      );

    if (insertError) {
      return {
        success: false as const,
        error: `Failed to add members: ${insertError.message}`,
      };
    }
    added = toAdd.length;
  }

  // Remove members (hard delete)
  if (toRemove.length > 0) {
    const { error: deleteError } = await supabase
      .from('team_membership')
      .delete()
      .eq('team_id', teamId)
      .in('user_id', toRemove);

    if (deleteError) {
      return {
        success: false as const,
        error: `Failed to remove members: ${deleteError.message}`,
      };
    }
    removed = toRemove.length;
  }

  return {
    success: true as const,
    data: { added, removed },
  };
}
