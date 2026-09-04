import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineMutation, defineQuery } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';

import { teamSchema, type Team } from '../schemas/teams';
import { resolveDisplayProfilesByIds } from './resolve-display-profiles';

const teamListSchema = teamSchema.array();
const memberUserIdsSchema = z.array(z.string().uuid());

const teamImportLookupSchema = z.record(
  z.string(),
  z.object({
    id: z.string().uuid(),
    organizationId: z.string().uuid(),
  }),
);

export type TeamImportLookup = z.infer<typeof teamImportLookupSchema>;

const createTeamInputSchema = z.object({
  organizationId: z.string().uuid(),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const updateTeamInputSchema = z.object({
  id: z.string().uuid(),
  data: z
    .object({
      name: z.string().optional(),
      description: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    })
    .partial(),
});

const deleteTeamInputSchema = z.object({
  id: z.string().uuid(),
});

const deleteTeamResultSchema = z.object({
  id: z.string().uuid(),
});

const addUserToTeamInputSchema = z.object({
  userId: z.string().uuid(),
  teamId: z.string().uuid(),
});

const addUserToTeamResultSchema = z.object({
  id: z.string().uuid(),
});

const updateTeamMembersInputSchema = z.object({
  teamId: z.string().uuid(),
  userIds: z.array(z.string().uuid()),
});

const updateTeamMembersResultSchema = z.object({
  id: z.string().uuid(),
  added: z.number().int().nonnegative(),
  removed: z.number().int().nonnegative(),
});

export type CreateTeamInput = z.infer<typeof createTeamInputSchema>;
export type UpdateTeamInput = z.infer<typeof updateTeamInputSchema>;
export type UpdateTeamMembersInput = z.infer<typeof updateTeamMembersInputSchema>;

export const teamKeys = {
  all: ['teams'] as const,
  byOrganization: (organizationId: string) =>
    [...teamKeys.all, 'organization', organizationId] as const,
  detail: (teamId: string) => [...teamKeys.all, 'detail', teamId] as const,
  members: (teamId: string) => [...teamKeys.all, 'members', teamId] as const,
  importLookup: () => [...teamKeys.all, 'import'] as const,
};

type RawTeamMember = {
  id: string;
  user_id: string;
};

type RawTeam = Omit<Team, 'members_count' | 'member_ids' | 'members'> & {
  team_membership: RawTeamMember[] | null;
};

async function fetchTeamsByOrganizationId(
  client: SupabaseClient<Database>,
  organizationId: string,
): Promise<{
  data: Team[] | null;
  error: { message: string; code?: string } | null;
}> {
  const { data, error } = await client
    .from('teams')
    .select('*, team_membership(id, user_id)')
    .eq('organization_id', organizationId)
    .order('created_at', { ascending: false });

  if (error) {
    return { data: null, error };
  }

  if (!data) {
    return { data: [], error: null };
  }

  const teams = data as RawTeam[];
  const allUserIds = teams.flatMap((team) =>
    (team.team_membership ?? []).map((member) => member.user_id),
  );
  const profilesById = await resolveDisplayProfilesByIds(client, allUserIds);

  const transformedData = teams.map((team) => {
    const { team_membership, ...teamData } = team;
    const members =
      Array.isArray(team_membership) && team_membership.length > 0
        ? team_membership.map((member) => ({
            id: member.id,
            user_id: member.user_id,
            profile: profilesById.get(member.user_id) ?? null,
          }))
        : [];
    const memberIds = members.map((member) => member.id);

    return {
      ...teamData,
      members_count: members.length,
      member_ids: memberIds.length > 0 ? memberIds : undefined,
      members: members.length > 0 ? members : undefined,
    };
  });

  return { data: transformedData, error: null };
}

/** Teams for an organization with member profiles. */
export const listTeamsByOrganizationId = defineQuery({
  key: teamKeys.byOrganization,
  schema: teamListSchema,
  execute: (client, organizationId: string) =>
    fetchTeamsByOrganizationId(client, organizationId),
});

/** Create a team in an organization. */
export const createTeam = defineMutation({
  inputSchema: createTeamInputSchema,
  schema: teamSchema,
  execute: async (client, input) => {
    const { data, error } = await client
      .from('teams')
      .insert({
        organization_id: input.organizationId,
        name: input.name.trim(),
        description: input.description?.trim() || null,
        notes: input.notes?.trim() || null,
      })
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: { message: 'Failed to create team' } };
    }

    return {
      data: {
        ...data,
        members_count: 0,
        members: [],
      },
      error: null,
    };
  },
  targets: (input) => [
    teamKeys.all,
    teamKeys.byOrganization(input.organizationId),
  ],
});

/** Update team fields. */
export const updateTeam = defineMutation({
  inputSchema: updateTeamInputSchema,
  schema: teamSchema,
  execute: async (client, input) => {
    const { data, error } = await client
      .from('teams')
      .update({
        ...input.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', input.id)
      .select()
      .single();

    if (error) {
      return { data: null, error };
    }

    if (!data) {
      return { data: null, error: { message: 'Failed to update team' } };
    }

    return { data, error: null };
  },
  targets: (input) => [teamKeys.all, teamKeys.detail(input.id)],
});

/** Delete a team by id. */
export const deleteTeam = defineMutation({
  inputSchema: deleteTeamInputSchema,
  schema: deleteTeamResultSchema,
  execute: async (client, input) => {
    const { error } = await client.from('teams').delete().eq('id', input.id);

    if (error) {
      return { data: null, error };
    }

    return { data: { id: input.id }, error: null };
  },
  targets: () => [teamKeys.all],
});

/** Current member user ids for a team. */
export const getTeamMemberUserIds = defineQuery({
  key: teamKeys.members,
  schema: memberUserIdsSchema,
  execute: async (client, teamId: string) => {
    const { data, error } = await client
      .from('team_membership')
      .select('user_id')
      .eq('team_id', teamId);

    if (error) {
      return { data: null, error };
    }

    return {
      data: (data ?? []).map((member) => member.user_id),
      error: null,
    };
  },
});

/** Case-sensitive orgId:teamName lookup map for import validation. */
export const getTeamsForImport = defineQuery({
  key: teamKeys.importLookup,
  schema: teamImportLookupSchema,
  execute: async (client) => {
    const { data, error } = await client
      .from('teams')
      .select('id, name, organization_id');

    if (error) {
      return { data: null, error };
    }

    const lookup: TeamImportLookup = {};
    for (const team of data ?? []) {
      lookup[`${team.organization_id}:${team.name}`] = {
        id: team.id,
        organizationId: team.organization_id,
      };
    }

    return { data: lookup, error: null };
  },
});

/** Idempotent add user to team (service role). */
export const addUserToTeam = defineMutation({
  inputSchema: addUserToTeamInputSchema,
  schema: addUserToTeamResultSchema,
  client: 'admin',
  execute: async (client, input) => {
    const { data: existingMembership } = await client
      .from('team_membership')
      .select('id')
      .eq('user_id', input.userId)
      .eq('team_id', input.teamId)
      .maybeSingle();

    if (existingMembership) {
      return { data: { id: input.teamId }, error: null };
    }

    const { error } = await client.from('team_membership').insert({
      user_id: input.userId,
      team_id: input.teamId,
    });

    if (error) {
      return { data: null, error };
    }

    return { data: { id: input.teamId }, error: null };
  },
  targets: (input) => [teamKeys.members(input.teamId), teamKeys.all],
});

/** Replace team membership with the given user ids. */
export const updateTeamMembers = defineMutation({
  inputSchema: updateTeamMembersInputSchema,
  schema: updateTeamMembersResultSchema,
  execute: async (client, input) => {
    const { data: currentMembers, error: fetchError } = await client
      .from('team_membership')
      .select('user_id')
      .eq('team_id', input.teamId);

    if (fetchError) {
      return { data: null, error: fetchError };
    }

    const currentUserIds = (currentMembers ?? []).map((member) => member.user_id);
    const currentUserIdsSet = new Set(currentUserIds);
    const newUserIdsSet = new Set(input.userIds);
    const toAdd = input.userIds.filter((id) => !currentUserIdsSet.has(id));
    const toRemove = currentUserIds.filter((id) => !newUserIdsSet.has(id));

    let added = 0;
    let removed = 0;

    if (toAdd.length > 0) {
      const { error: insertError } = await client.from('team_membership').insert(
        toAdd.map((user_id) => ({
          team_id: input.teamId,
          user_id,
        })),
      );

      if (insertError) {
        return { data: null, error: insertError };
      }

      added = toAdd.length;
    }

    if (toRemove.length > 0) {
      const { error: deleteError } = await client
        .from('team_membership')
        .delete()
        .eq('team_id', input.teamId)
        .in('user_id', toRemove);

      if (deleteError) {
        return { data: null, error: deleteError };
      }

      removed = toRemove.length;
    }

    return {
      data: {
        id: input.teamId,
        added,
        removed,
      },
      error: null,
    };
  },
  targets: (input) => [teamKeys.members(input.teamId), teamKeys.all],
});
