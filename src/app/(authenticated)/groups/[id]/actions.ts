'use server';

import { createClient } from '@/lib/supabase/core/server';

export type GroupMemberWithProgram = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  program_name: string | null;
};

export async function getOrganizationMembersWithPrograms(
  organizationId: string,
) {
  const supabase = await createClient();

  const { data: membersData, error: membersError } = await supabase
    .from('organization_members')
    .select(
      'user_id, profiles!inner(id, avatar_url, first_name, last_name, email)',
    )
    .eq('organization_id', organizationId)
    .eq('role', 'patient')
    .eq('is_active', true);

  if (membersError) {
    return {
      success: false as const,
      error: `Failed to fetch organization members: ${membersError.message}`,
    };
  }

  const members = (membersData || []).map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      user_id: m.user_id,
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      email: profile?.email ?? null,
      avatar_url: profile?.avatar_url ?? null,
    };
  });

  const userIds = members.map((m) => m.user_id);
  const programByUserId = new Map<string, string>();

  if (userIds.length > 0) {
    const { data: assignmentsData, error: assignmentsError } = await supabase
      .from('program_assignment')
      .select(
        `
        user_id,
        created_at,
        status,
        program_template (
          id,
          name
        )
      `,
      )
      .eq('organization_id', organizationId)
      .in('user_id', userIds)
      .neq('status', 'template')
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      return {
        success: false as const,
        error: `Failed to fetch program assignments: ${assignmentsError.message}`,
      };
    }

    for (const a of assignmentsData || []) {
      const userId = (a as { user_id: string | null }).user_id;
      if (!userId) continue;
      if (programByUserId.has(userId)) continue;

      const template = (
        a as { program_template?: { name?: string | null } | null }
      ).program_template;
      const name = template?.name ?? null;
      if (name) programByUserId.set(userId, name);
    }
  }

  const result: GroupMemberWithProgram[] = members.map((m) => ({
    ...m,
    program_name: programByUserId.get(m.user_id) ?? null,
  }));

  return {
    success: true as const,
    data: result,
  };
}

export async function removeMemberFromOrganization(
  organizationId: string,
  userId: string,
) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('role', 'patient');

  if (error) {
    return {
      success: false as const,
      error: `Failed to remove member: ${error.message}`,
    };
  }

  return {
    success: true as const,
    data: undefined,
  };
}
