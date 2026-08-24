'use server';

import { createClient } from '@/lib/supabase/core/server';
import { createAdminClient } from '@/lib/supabase/core/admin';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';

export type GroupMemberWithProgram = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  program_name: string | null;
};

export type SuperAdminGroupUser = {
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: 'unassigned' | 'physician';
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

export async function getUnassignedUsers() {
  const query = new ProfilesQuery();
  const profilesResult = await query.getAllWithMemberships();

  if (!profilesResult.success) {
    return {
      success: false as const,
      error: profilesResult.error,
    };
  }

  const unassigned = profilesResult.data
    .filter(
      (p) =>
        (p.orgMemberships?.length ?? 0) === 0 &&
        (p.teamMemberships?.length ?? 0) === 0,
    )
    .map(
      (p): SuperAdminGroupUser => ({
        user_id: p.id,
        first_name: p.first_name ?? null,
        last_name: p.last_name ?? null,
        email: p.email ?? null,
        avatar_url: p.avatar_url ?? null,
        role: 'unassigned',
      }),
    );

  return {
    success: true as const,
    data: unassigned,
  };
}

export async function getOrganizationAdmins(organizationId: string) {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select(
      'user_id, profiles!inner(id, avatar_url, first_name, last_name, email)',
    )
    .eq('organization_id', organizationId)
    .eq('role', 'admin')
    .eq('is_active', true);

  if (error) {
    return {
      success: false as const,
      error: `Failed to fetch organization admins: ${error.message}`,
    };
  }

  const admins: SuperAdminGroupUser[] = (data || []).map((m) => {
    const profile = Array.isArray(m.profiles) ? m.profiles[0] : m.profiles;
    return {
      user_id: m.user_id,
      first_name: profile?.first_name ?? null,
      last_name: profile?.last_name ?? null,
      email: profile?.email ?? null,
      avatar_url: profile?.avatar_url ?? null,
      role: 'physician',
    };
  });

  return {
    success: true as const,
    data: admins,
  };
}

export async function addAdminToOrganization(
  organizationId: string,
  userId: string,
) {
  const supabase = await createAdminClient();

  const { data: existing, error: existingError } = await supabase
    .from('organization_members')
    .select('id, role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingError) {
    return {
      success: false as const,
      error: `Failed to check existing membership: ${existingError.message}`,
    };
  }

  if (existing?.id) {
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ role: 'admin', is_active: true })
      .eq('id', existing.id);

    if (updateError) {
      return {
        success: false as const,
        error: `Failed to update membership: ${updateError.message}`,
      };
    }

    return { success: true as const, data: undefined };
  }

  const { error: insertError } = await supabase.from('organization_members').insert({
    organization_id: organizationId,
    user_id: userId,
    role: 'admin',
    is_active: true,
  });

  if (insertError) {
    return {
      success: false as const,
      error: `Failed to add admin: ${insertError.message}`,
    };
  }

  return { success: true as const, data: undefined };
}

export async function removeAdminFromOrganization(
  organizationId: string,
  userId: string,
) {
  const supabase = await createAdminClient();

  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('role', 'admin');

  if (error) {
    return {
      success: false as const,
      error: `Failed to remove admin: ${error.message}`,
    };
  }

  return {
    success: true as const,
    data: undefined,
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

const DEFAULT_SCREENING_BASE =
  'https://calendly.com/movebetter-medvanta/vantamotion-screening-app-pilot';

/**
 * Validate + normalize a pasted Calendly event link.
 * Returns '' for empty input, the trimmed URL when valid, null when invalid.
 */
function normalizeScreeningUrl(raw: string): string | null {
  const trimmed = raw.trim().replace(/\/+$/, '');
  if (!trimmed) return '';
  try {
    const url = new URL(trimmed);
    const hostOk =
      url.protocol === 'https:' &&
      (url.hostname === 'calendly.com' || url.hostname.endsWith('.calendly.com'));
    return hostOk ? trimmed : null;
  } catch {
    return null;
  }
}

export async function updateOrganizationScreeningUrl(
  organizationId: string,
  rawUrl: string,
) {
  const normalized = normalizeScreeningUrl(rawUrl);
  if (normalized === null) {
    return {
      success: false as const,
      error: 'Enter a valid https://calendly.com event link.',
    };
  }

  const supabase = await createClient();
  const { error } = await supabase
    .from('organizations')
    .update({ screening_url: normalized || null })
    .eq('id', organizationId);

  if (error) {
    return {
      success: false as const,
      error: `Failed to save screening link: ${error.message}`,
    };
  }

  return { success: true as const, data: undefined };
}

function buildScreeningLink(
  base: string,
  user: { uid: string; firstName: string; lastName: string; email: string },
): string {
  const sep = base.includes('?') ? '&' : '?';
  const first = user.firstName.trim();
  const last = user.lastName.trim();
  const name = first && last ? `${first} ${last}` : first || last;
  let link = `${base}${sep}utm_term=${encodeURIComponent(user.uid)}&utm_content=onboarding_screening`;
  if (name) link += `&name=${encodeURIComponent(name)}`;
  if (first) link += `&first_name=${encodeURIComponent(first)}`;
  if (last) link += `&last_name=${encodeURIComponent(last)}`;
  if (user.email.trim()) link += `&email=${encodeURIComponent(user.email.trim())}`;
  return link;
}

/** Computed screening link for the logged-in admin, used by the Test button. */
export async function getScreeningTestLink(organizationId: string) {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) {
    return { success: false as const, error: 'Not signed in.' };
  }

  const [{ data: org }, { data: profile }] = await Promise.all([
    supabase.from('organizations').select('screening_url').eq('id', organizationId).single(),
    supabase
      .from('profiles')
      .select('first_name, last_name, email')
      .eq('id', uid)
      .single(),
  ]);

  if (!org && !profile) {
    return { success: false as const, error: 'Failed to load screening test data.' };
  }

  const base = (org?.screening_url ?? DEFAULT_SCREENING_BASE).trim() || DEFAULT_SCREENING_BASE;
  const link = buildScreeningLink(base, {
    uid,
    firstName: profile?.first_name ?? '',
    lastName: profile?.last_name ?? '',
    email: profile?.email ?? '',
  });

  return { success: true as const, data: link };
}
