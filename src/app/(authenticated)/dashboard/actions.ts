'use server';

import { createAdminClient } from '@/lib/supabase/core/admin';

export type UserWithoutProgram = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
};

export type UserWithProgramAndGroup = UserWithoutProgram & {
  organization_id: string;
};

/**
 * Users who are in an organization (patient) but have no program assignment.
 */
export async function getUsersWithoutProgram() {
  const supabase = await createAdminClient();

  const { data: orgMembers, error: orgError } = await supabase
    .from('organization_members')
    .select('user_id')
    .eq('role', 'patient')
    .eq('is_active', true);

  if (orgError) {
    return { success: false as const, error: orgError.message };
  }

  const orgUserIds = [...new Set((orgMembers ?? []).map((m) => m.user_id))];
  if (orgUserIds.length === 0) {
    return { success: true as const, data: [] };
  }

  const { data: withProgram, error: progError } = await supabase
    .from('program_assignment')
    .select('user_id')
    .in('user_id', orgUserIds)
    .neq('status', 'template');

  if (progError) {
    return { success: false as const, error: progError.message };
  }

  const hasProgramIds = new Set((withProgram ?? []).map((p) => p.user_id));
  const withoutProgramIds = orgUserIds.filter((id) => !hasProgramIds.has(id));
  if (withoutProgramIds.length === 0) {
    return { success: true as const, data: [] };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, avatar_url')
    .in('id', withoutProgramIds);

  if (profilesError) {
    return { success: false as const, error: profilesError.message };
  }

  const data: UserWithoutProgram[] = (profiles ?? []).map((p) => ({
    user_id: p.id,
    first_name: p.first_name ?? null,
    last_name: p.last_name ?? null,
    email: p.email ?? null,
    avatar_url: p.avatar_url ?? null,
  }));

  return { success: true as const, data };
}

/**
 * Users who are in an organization (patient) and have a program assignment (non-template).
 * Includes organization_id from the user's latest organization membership.
 */
export async function getUsersWithProgramAndGroup() {
  const supabase = await createAdminClient();

  const { data: orgMembers, error: orgError } = await supabase
    .from('organization_members')
    .select('user_id, organization_id, created_at')
    .eq('role', 'patient')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (orgError) {
    return { success: false as const, error: orgError.message };
  }

  const latestOrgByUserId = new Map<string, string>();
  for (const m of orgMembers ?? []) {
    if (!latestOrgByUserId.has(m.user_id)) {
      latestOrgByUserId.set(m.user_id, m.organization_id);
    }
  }

  const orgUserIds = [...latestOrgByUserId.keys()];
  if (orgUserIds.length === 0) {
    return { success: true as const, data: [] };
  }

  const { data: withProgram, error: progError } = await supabase
    .from('program_assignment')
    .select('user_id')
    .in('user_id', orgUserIds)
    .neq('status', 'template');

  if (progError) {
    return { success: false as const, error: progError.message };
  }

  const hasProgramIds = [...new Set((withProgram ?? []).map((p) => p.user_id))];
  if (hasProgramIds.length === 0) {
    return { success: true as const, data: [] };
  }

  const { data: profiles, error: profilesError } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, avatar_url')
    .in('id', hasProgramIds);

  if (profilesError) {
    return { success: false as const, error: profilesError.message };
  }

  const data: UserWithProgramAndGroup[] = (profiles ?? [])
    .map((p) => {
      const organization_id = latestOrgByUserId.get(p.id);
      if (!organization_id) return null;
      return {
        user_id: p.id,
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
        email: p.email ?? null,
        avatar_url: p.avatar_url ?? null,
        organization_id,
      } satisfies UserWithProgramAndGroup;
    })
    .filter((x): x is UserWithProgramAndGroup => x !== null);

  return { success: true as const, data };
}
