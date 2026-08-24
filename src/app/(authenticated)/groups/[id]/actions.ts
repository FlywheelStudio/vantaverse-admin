'use server';

import { createClient } from '@/lib/supabase/core/server';
import { createAdminClient } from '@/lib/supabase/core/admin';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import {
  ProgramAssignmentsQuery,
} from '@/lib/supabase/queries/program-assignments';
import { PROGRAM_ASSIGNMENT_STATUS } from '@/lib/constants/program-assignment-status';

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

type GroupProgramMember = {
  assignment_id: string;
  user_id: string;
  name: string;
  avatar_url: string | null;
  status: string;
  start_date: string | null;
  end_date: string | null;
};

export type GroupProgramRowData = {
  template_id: string;
  template_name: string;
  image_url: string | null;
  weeks: number | null;
  members: GroupProgramMember[];
};

export type BulkAssignSkip = {
  user_id: string;
  name: string;
  current_program: string | null;
};

export type BulkAssignResult = {
  assignedCount: number;
  failed: Array<{ user_id: string; error: string }>;
  skipped: BulkAssignSkip[];
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

export async function updateOrganizationDescription(
  organizationId: string,
  rawDescription: string,
) {
  const supabase = await createClient();
  const { error } = await supabase
    .from('organizations')
    .update({ description: rawDescription.trim() || null })
    .eq('id', organizationId);

  if (error) {
    return {
      success: false as const,
      error: `Failed to save description: ${error.message}`,
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

/**
 * Verify the signed-in user is an active admin of this organization or an
 * active member of the super-admin organization. Returns an error message
 * or null when authorized.
 */
async function assertOrgAdmin(organizationId: string): Promise<string | null> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return 'Not signed in.';

  const { data: memberships, error } = await supabase
    .from('organization_members')
    .select('organization_id, role, is_active, organizations(is_super_admin)')
    .eq('user_id', uid);

  if (error) return `Authorization check failed: ${error.message}`;

  const authorized = (memberships ?? []).some(
    (m) =>
      m.is_active === true &&
      (m as { organization_id: string }).organization_id === organizationId &&
      (m as { role: string }).role === 'admin',
  );
  if (authorized) return null;

  const isSuperAdminMember = (memberships ?? []).some((m) => {
    const orgs = (
      m as unknown as {
        organizations?: { is_super_admin?: boolean } | null;
      }
    ).organizations;
    return m.is_active === true && orgs?.is_super_admin === true;
  });

  return isSuperAdminMember ? null : 'Only group admins can manage programs.';
}

function extractImageUrl(imageUrl: unknown): string | null {
  if (typeof imageUrl === 'string') return imageUrl;
  if (
    imageUrl &&
    typeof imageUrl === 'object' &&
    'image_url' in imageUrl &&
    typeof (imageUrl as { image_url: unknown }).image_url === 'string'
  ) {
    return (imageUrl as { image_url: string }).image_url;
  }
  return null;
}

/** Programs tab read: assignments grouped by template with member details. */
export async function getOrganizationPrograms(organizationId: string) {
  const supabase = await createAdminClient();

  const { data, error } = await supabase
    .from('program_assignment')
    .select(
      `id, user_id, status, start_date, end_date,
       profiles!program_assignment_user_id_fkey (id, first_name, last_name, avatar_url),
       program_template (id, name, weeks, image_url)`,
    )
    .eq('organization_id', organizationId)
    .in('status', [
      PROGRAM_ASSIGNMENT_STATUS.ACTIVE,
      'completed',
      'paused',
      'cancelled',
      PROGRAM_ASSIGNMENT_STATUS.PRE_PROGRAM,
    ])
    .order('created_at', { ascending: false });

  if (error) {
    return { success: false as const, error: error.message };
  }

  type Row = {
    id: string;
    user_id: string | null;
    status: string;
    start_date: string | null;
    end_date: string | null;
    profiles: {
      first_name?: string | null;
      last_name?: string | null;
      avatar_url?: string | null;
    } | null;
    program_template: {
      id: string;
      name: string;
      weeks: number | null;
      image_url: unknown;
    } | null;
  };

  // Newest assignment wins per (template, user) so re-assignments don't duplicate rows.
  const latest = new Map<string, Row>();
  for (const row of (data ?? []) as unknown as Row[]) {
    if (!row.program_template || !row.user_id || !row.profiles) continue;
    const key = `${row.program_template.id}:${row.user_id}`;
    if (!latest.has(key)) latest.set(key, row);
  }

  const byTemplate = new Map<string, GroupProgramRowData>();
  for (const row of latest.values()) {
    const template = row.program_template;
    const p = row.profiles;
    if (!template || !p || !row.user_id) continue;

    let bucket = byTemplate.get(template.id);
    if (!bucket) {
      bucket = {
        template_id: template.id,
        template_name: template.name,
        image_url: extractImageUrl(template.image_url),
        weeks: template.weeks ?? null,
        members: [],
      };
      byTemplate.set(template.id, bucket);
    }
    bucket.members.push({
      assignment_id: row.id,
      user_id: row.user_id,
      name: [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unnamed',
      avatar_url: p.avatar_url ?? null,
      status: row.status,
      start_date: row.start_date,
      end_date: row.end_date,
    });
  }

  return { success: true as const, data: Array.from(byTemplate.values()) };
}

/** Bulk assign a program template to members; skips users with an active assignment. */
export async function bulkAssignProgram(
  organizationId: string,
  templateAssignmentId: string,
  userIds: string[],
  startDate: string, // ISO date YYYY-MM-DD
) {
  const denied = await assertOrgAdmin(organizationId);
  if (denied) return { success: false as const, error: denied };

  if (userIds.length === 0) {
    return { success: false as const, error: 'Select at least one member.' };
  }

  const supabase = await createAdminClient();
  const { data: actives, error: activesError } = await supabase
    .from('program_assignment')
    .select('user_id, program_template(name)')
    .eq('organization_id', organizationId)
    .in('user_id', userIds)
    .eq('status', PROGRAM_ASSIGNMENT_STATUS.ACTIVE);

  if (activesError) {
    return {
      success: false as const,
      error: `Failed to check existing assignments: ${activesError.message}`,
    };
  }

  const activeByUser = new Map<string, string | null>();
  for (const a of (actives ?? []) as unknown as Array<{
    user_id: string;
    program_template: { name: string } | null;
  }>) {
    if (!activeByUser.has(a.user_id)) {
      activeByUser.set(a.user_id, a.program_template?.name ?? null);
    }
  }

  const skipped: BulkAssignSkip[] = [];
  const assignees = userIds.filter((userId) => {
    if (activeByUser.has(userId)) {
      skipped.push({
        user_id: userId,
        name: '',
        current_program: activeByUser.get(userId) ?? null,
      });
      return false;
    }
    return true;
  });

  // Fill names for skipped users from profiles.
  if (skipped.length > 0) {
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, first_name, last_name')
      .in(
        'id',
        skipped.map((s) => s.user_id),
      );
    const nameById = new Map(
      ((profilesData ?? []) as Array<{
        id: string;
        first_name: string | null;
        last_name: string | null;
      }>).map((p) => [
        p.id,
        [p.first_name, p.last_name].filter(Boolean).join(' ') || 'Unnamed',
      ]),
    );
    for (const s of skipped) s.name = nameById.get(s.user_id) ?? 'Unnamed';
  }

  const query = new ProgramAssignmentsQuery();
  const failed: Array<{ user_id: string; error: string }> = [];
  let assignedCount = 0;
  for (const userId of assignees) {
    const result = await query.assignToUser(templateAssignmentId, userId, startDate);
    if (result.success) assignedCount += 1;
    else failed.push({ user_id: userId, error: result.error });
  }

  const result: BulkAssignResult = { assignedCount, failed, skipped };
  return { success: true as const, data: result };
}

/** Cancel a member's active assignment and assign a new template. */
export async function replaceMemberProgram(
  organizationId: string,
  userId: string,
  templateAssignmentId: string,
  startDate: string,
) {
  const denied = await assertOrgAdmin(organizationId);
  if (denied) return { success: false as const, error: denied };

  const supabase = await createAdminClient();
  const { error: cancelError } = await supabase
    .from('program_assignment')
    .update({ status: 'cancelled' })
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .eq('status', PROGRAM_ASSIGNMENT_STATUS.ACTIVE);

  if (cancelError) {
    return {
      success: false as const,
      error: `Failed to cancel current program: ${cancelError.message}`,
    };
  }

  const query = new ProgramAssignmentsQuery();
  return query.assignToUser(templateAssignmentId, userId, startDate);
}

/** Soft-cancel one assignment (history preserved). */
export async function cancelMemberProgram(
  organizationId: string,
  assignmentId: string,
) {
  const denied = await assertOrgAdmin(organizationId);
  if (denied) return { success: false as const, error: denied };

  const supabase = await createAdminClient();
  const { error } = await supabase
    .from('program_assignment')
    .update({ status: 'cancelled' })
    .eq('id', assignmentId)
    .eq('organization_id', organizationId)
    .in('status', ['active', 'paused']);

  if (error) {
    return { success: false as const, error: error.message };
  }
  return { success: true as const, data: undefined };
}
