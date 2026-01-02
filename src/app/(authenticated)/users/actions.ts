'use server';

import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { createClient } from '@/lib/supabase/core/server';
import type { Profile } from '@/lib/supabase/schemas/profiles';

/**
 * Get users with stats
 */
export async function getUsersWithStats(filters?: {
  organization_id?: string;
  team_id?: string;
  journey_phase?: string;
}) {
  const query = new ProfilesQuery();
  return query.getListWithStats(filters);
}

/**
 * Create a new user
 */
export async function createUser(profileData: Partial<Profile>) {
  const query = new ProfilesQuery();
  return query.create(profileData);
}

/**
 * Update a user
 */
export async function updateUser(
  userId: string,
  profileData: Partial<Profile>,
) {
  const query = new ProfilesQuery();
  return query.update(userId, profileData);
}

/**
 * Delete a user
 */
export async function deleteUser(userId: string) {
  const query = new ProfilesQuery();
  return query.delete(userId);
}

/**
 * Get super admin organization ID
 */
async function getSuperAdminOrganizationId(): Promise<
  { success: true; data: string } | { success: false; error: string }
> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('id')
    .eq('is_super_admin', true)
    .single();

  if (error || !data) {
    return {
      success: false,
      error: 'Super admin organization not found',
    };
  }

  return {
    success: true,
    data: data.id,
  };
}

/**
 * Make a user a super admin
 */
export async function makeSuperAdmin(userId: string) {
  const orgResult = await getSuperAdminOrganizationId();
  if (!orgResult.success) {
    return orgResult;
  }

  const supabase = await createClient();

  // Check if user is already a member
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', orgResult.data)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMember) {
    // User is already a member, just ensure they're active
    const { error } = await supabase
      .from('organization_members')
      .update({ is_active: true, role: 'admin' })
      .eq('id', existingMember.id);

    if (error) {
      return {
        success: false as const,
        error: `Failed to update super admin membership: ${error.message}`,
      };
    }
  } else {
    // Add user as member
    const { error } = await supabase.from('organization_members').insert({
      organization_id: orgResult.data,
      user_id: userId,
      role: 'admin',
      is_active: true,
    });

    if (error) {
      return {
        success: false as const,
        error: `Failed to add super admin: ${error.message}`,
      };
    }
  }

  return {
    success: true as const,
    data: undefined,
  };
}

/**
 * Revoke super admin status from a user
 */
export async function revokeSuperAdmin(userId: string) {
  const orgResult = await getSuperAdminOrganizationId();
  if (!orgResult.success) {
    return orgResult;
  }

  const supabase = await createClient();

  // Remove user from super admin organization
  const { error } = await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', orgResult.data)
    .eq('user_id', userId);

  if (error) {
    return {
      success: false as const,
      error: `Failed to revoke super admin: ${error.message}`,
    };
  }

  return {
    success: true as const,
    data: undefined,
  };
}

/**
 * Check if user is super admin
 */
export async function isUserSuperAdmin(userId: string) {
  const orgResult = await getSuperAdminOrganizationId();
  if (!orgResult.success) {
    return { success: false as const, error: orgResult.error };
  }

  const supabase = await createClient();

  const { data, error } = await supabase
    .from('organization_members')
    .select('id')
    .eq('organization_id', orgResult.data)
    .eq('user_id', userId)
    .eq('is_active', true)
    .maybeSingle();

  if (error) {
    return {
      success: false as const,
      error: `Failed to check super admin status: ${error.message}`,
    };
  }

  return {
    success: true as const,
    data: !!data,
  };
}

/**
 * Download CSV template (placeholder - UI only)
 */
export async function downloadTemplateCSV() {
  // Placeholder function - implementation later
  return {
    success: false as const,
    error: 'Not implemented',
  };
}

/**
 * Download Excel template (placeholder - UI only)
 */
export async function downloadTemplateExcel() {
  // Placeholder function - implementation later
  return {
    success: false as const,
    error: 'Not implemented',
  };
}

/**
 * Upload users CSV (placeholder - UI only)
 */
export async function uploadUsersCSV(file: File) {
  // Placeholder function - implementation later
  console.log('uploadUsersCSV', file);
  return {
    success: false as const,
    error: 'Not implemented',
  };
}

/**
 * Upload users Excel (placeholder - UI only)
 */
export async function uploadUsersExcel(file: File) {
  console.log('uploadUsersExcel', file);
  // Placeholder function - implementation later
  return {
    success: false as const,
    error: 'Not implemented',
  };
}
