'use server';

import { createClient } from '@/lib/supabase/core/server';
import { buildBookingLink, normalizeCalendlyUrl } from '@/lib/calendly';

type SuperAdminAuthz =
  | { ok: true; organizationId: string }
  | { ok: false; error: string };

/**
 * Verify the signed-in user is an active member of the super-admin
 * organization and return that org's id, or an error message.
 */
async function requireSuperAdminOrgId(): Promise<SuperAdminAuthz> {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) return { ok: false, error: 'Not signed in.' };

  const { data: memberships, error } = await supabase
    .from('organization_members')
    .select('organization_id, is_active, organizations(is_super_admin)')
    .eq('user_id', uid);

  if (error) return { ok: false, error: `Authorization check failed: ${error.message}` };

  const superAdminOrgId = (memberships ?? []).find((m) => {
    const orgs = (
      m as unknown as {
        organizations?: { is_super_admin?: boolean } | null;
      }
    ).organizations;
    return m.is_active === true && orgs?.is_super_admin === true;
  })?.organization_id;

  if (!superAdminOrgId) {
    return { ok: false, error: 'Only super admins can change settings.' };
  }

  return { ok: true, organizationId: superAdminOrgId };
}

/** Current consultation URL stored on the super-admin organization. */
export async function getConsultationSettings() {
  const authz = await requireSuperAdminOrgId();
  if (!authz.ok) return { success: false as const, error: authz.error };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('consultation_url')
    .eq('id', authz.organizationId)
    .single();

  if (error) {
    return {
      success: false as const,
      error: `Failed to load settings: ${error.message}`,
    };
  }

  return { success: true as const, data: data?.consultation_url ?? null };
}

export async function updateOrganizationConsultationUrl(rawUrl: string) {
  const normalized = normalizeCalendlyUrl(rawUrl);
  if (normalized === null) {
    return {
      success: false as const,
      error: 'Enter a valid https://calendly.com event link.',
    };
  }

  const authz = await requireSuperAdminOrgId();
  if (!authz.ok) return { success: false as const, error: authz.error };

  const supabase = await createClient();
  const { error } = await supabase
    .from('organizations')
    .update({ consultation_url: normalized || null })
    .eq('id', authz.organizationId);

  if (error) {
    return {
      success: false as const,
      error: `Failed to save consultation link: ${error.message}`,
    };
  }

  return { success: true as const, data: undefined };
}

/**
 * Computed consultation link for the logged-in admin, used by the Test button.
 * When rawUrl is set, tests that unsaved input instead of the stored link.
 */
export async function getConsultationTestLink(rawUrl?: string) {
  const supabase = await createClient();

  const { data: auth } = await supabase.auth.getUser();
  const uid = auth?.user?.id;
  if (!uid) {
    return { success: false as const, error: 'Not signed in.' };
  }

  let base: string | null;
  if (rawUrl && rawUrl.trim()) {
    const normalized = normalizeCalendlyUrl(rawUrl);
    if (normalized === null) {
      return {
        success: false as const,
        error: 'Enter a valid https://calendly.com event link.',
      };
    }
    base = normalized;
  } else {
    const authz = await requireSuperAdminOrgId();
    if (!authz.ok) return { success: false as const, error: authz.error };

    const { data: org, error } = await supabase
      .from('organizations')
      .select('consultation_url')
      .eq('id', authz.organizationId)
      .single();

    if (error) {
      return {
        success: false as const,
        error: `Failed to load consultation test data: ${error.message}`,
      };
    }
    base = org?.consultation_url ?? null;
  }

  if (!base) {
    return {
      success: false as const,
      error: 'No consultation link saved yet.',
    };
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('first_name, last_name, email')
    .eq('id', uid)
    .single();

  const link = buildBookingLink(base, 'onboarding_consultation', {
    uid,
    firstName: profile?.first_name ?? '',
    lastName: profile?.last_name ?? '',
    email: profile?.email ?? '',
  });

  return { success: true as const, data: link };
}
