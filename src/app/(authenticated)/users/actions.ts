'use server';

import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { createClient } from '@/lib/supabase/core/server';
import { createAdminClient } from '@/lib/supabase/core/admin';

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

/**
 * Create a user quickly with email, name, and optional org/team assignment
 */
export async function createUserQuickAdd(data: {
  email: string;
  firstName: string;
  lastName: string;
  organizationId?: string;
  teamId?: string;
}): Promise<
  | { success: true; data: { userId: string } }
  | { success: false; error: string }
> {
  const adminClient = await createAdminClient();
  const supabase = await createClient();
  const profilesQuery = new ProfilesQuery();

  try {
    // Create auth user (OTP-based, no password)
    const { data: authUser, error: authError } =
      await adminClient.auth.admin.createUser({
        email: data.email.toLowerCase().trim(),
        email_confirm: true,
      });

    if (authError || !authUser.user) {
      return {
        success: false,
        error: authError?.message || 'Failed to create auth user',
      };
    }

    const userId = authUser.user.id;

    // Create profile
    const profileResult = await profilesQuery.create({
      id: userId,
      email: data.email.toLowerCase().trim(),
      first_name: data.firstName.trim(),
      last_name: data.lastName.trim(),
      journey_phase: 'discovery',
    });

    if (!profileResult.success) {
      // Clean up auth user if profile creation fails
      await adminClient.auth.admin.deleteUser(userId);
      return {
        success: false,
        error: profileResult.error,
      };
    }

    // Add to organization if provided
    if (data.organizationId) {
      const { error: orgError } = await supabase
        .from('organization_members')
        .insert({
          organization_id: data.organizationId,
          user_id: userId,
          role: 'member',
          is_active: true,
        });

      if (orgError) {
        return {
          success: false,
          error: `Failed to add user to organization: ${orgError.message}`,
        };
      }
    }

    // Add to team if provided
    if (data.teamId) {
      const { error: teamError } = await supabase
        .from('team_membership')
        .insert({
          team_id: data.teamId,
          user_id: userId,
        });

      if (teamError) {
        return {
          success: false,
          error: `Failed to add user to team: ${teamError.message}`,
        };
      }
    }

    return {
      success: true,
      data: { userId },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create user',
    };
  }
}
