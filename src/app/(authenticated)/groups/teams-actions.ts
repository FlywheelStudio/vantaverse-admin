'use server';

import { formatDalError, mutate, type DalResult } from '@/lib/dal';
import { queryWithSession } from '@/lib/dal/core/query.server';
import { createClient } from '@/lib/supabase/core/server';
import {
  createTeam as createTeamMutation,
  deleteTeam as deleteTeamMutation,
  getTeamMemberUserIds as getTeamMemberUserIdsQuery,
  listTeamsByOrganizationId,
  updateTeam as updateTeamMutation,
  updateTeamMembers as updateTeamMembersMutation,
} from '@/lib/supabase/queries/teams';
import type { Team } from '@/lib/supabase/schemas/teams';

type LegacySuccess<T> = { success: true; data: T };
type LegacyError = { success: false; error: string };
type LegacyResult<T> = LegacySuccess<T> | LegacyError;

function fromDalResult<T>(result: DalResult<T>): LegacyResult<T> {
  const [err, data] = result;
  if (err) {
    return { success: false, error: formatDalError(err) };
  }
  return { success: true, data };
}

/**
 * Get all teams for an organization
 */
export async function getTeamsByOrganizationId(
  organizationId: string,
): Promise<LegacyResult<Team[]>> {
  return fromDalResult(
    await queryWithSession(listTeamsByOrganizationId, organizationId),
  );
}

/**
 * Create a new team
 */
export async function createTeam(
  organizationId: string,
  name: string,
  description?: string | null,
  notes?: string | null,
): Promise<LegacyResult<Team>> {
  const client = await createClient();
  return fromDalResult(
    await mutate(
      createTeamMutation,
      { organizationId, name, description, notes },
      { client },
    ),
  );
}

/**
 * Update a team
 */
export async function updateTeam(
  id: string,
  data: Partial<Team>,
): Promise<LegacyResult<Team>> {
  const client = await createClient();
  return fromDalResult(
    await mutate(
      updateTeamMutation,
      {
        id,
        data: {
          name: data.name,
          description: data.description,
          notes: data.notes,
        },
      },
      { client },
    ),
  );
}

/**
 * Delete a team
 */
export async function deleteTeam(id: string): Promise<LegacyResult<void>> {
  const client = await createClient();
  const result = fromDalResult(
    await mutate(deleteTeamMutation, { id }, { client }),
  );
  if (!result.success) {
    return result;
  }
  return { success: true, data: undefined };
}

/**
 * Get current member user IDs for a team
 */
export async function getTeamMemberUserIds(
  teamId: string,
): Promise<LegacyResult<string[]>> {
  return fromDalResult(
    await queryWithSession(getTeamMemberUserIdsQuery, teamId),
  );
}

/**
 * Update team members (add and remove)
 */
export async function updateTeamMembers(
  teamId: string,
  userIds: string[],
): Promise<LegacyResult<{ added: number; removed: number }>> {
  const client = await createClient();
  const result = fromDalResult(
    await mutate(updateTeamMembersMutation, { teamId, userIds }, { client }),
  );
  if (!result.success) {
    return result;
  }

  return {
    success: true,
    data: {
      added: result.data.added,
      removed: result.data.removed,
    },
  };
}
