'use server';

import { OrganizationsQuery } from '@/lib/supabase/queries/organizations';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
import { SupabaseStorage } from '@/lib/supabase/storage';
import { createClient } from '@/lib/supabase/core/server';
import type { Organization } from '@/lib/supabase/schemas/organizations';

/**
 * Get all organizations
 */
export async function getOrganizations() {
  const query = new OrganizationsQuery();
  return query.getList();
}

/**
 * Create a new organization
 */
export async function createOrganization(
  name: string,
  description?: string | null,
) {
  const query = new OrganizationsQuery();
  return query.create(name, description);
}

/**
 * Update an organization
 */
export async function updateOrganization(
  id: string,
  data: Partial<Organization>,
) {
  const query = new OrganizationsQuery();
  return query.update(id, data);
}

/**
 * Upload organization picture
 */
export async function uploadOrganizationPicture(
  organizationId: string,
  fileBase64: string,
  oldPictureUrl?: string | null,
) {
  // Validate file type
  const base64Header = fileBase64.substring(0, 30);
  const isJpeg =
    base64Header.includes('data:image/jpeg') ||
    base64Header.includes('data:image/jpg');
  const isPng = base64Header.includes('data:image/png');

  if (!isJpeg && !isPng) {
    return {
      success: false as const,
      error: 'Invalid file type. Only JPEG and PNG images are allowed.',
    };
  }

  const storage = new SupabaseStorage();
  const extension = isJpeg ? 'jpg' : 'png';
  const path = `${organizationId}/picture.${extension}`;
  const contentType = isJpeg ? 'image/jpeg' : 'image/png';

  // Delete old picture if it exists
  if (oldPictureUrl) {
    // Extract path from URL
    const urlParts = oldPictureUrl.split('/');
    const oldPath = urlParts.slice(-2).join('/'); // Get {orgId}/picture.{ext}
    await storage.delete('organization_assets', oldPath);
  }

  // Upload new picture
  const result = await storage.upload({
    bucket: 'organization_assets',
    path,
    body: fileBase64,
    contentType,
    upsert: true,
    getPublicUrl: true,
  });

  if (!result.success) {
    return result;
  }

  return {
    success: true as const,
    data: result.data.publicUrl,
  };
}

/**
 * Update organization picture URL
 */
export async function updateOrganizationPicture(
  organizationId: string,
  pictureUrl: string | null,
) {
  const query = new OrganizationsQuery();
  return query.update(organizationId, { picture_url: pictureUrl });
}

/**
 * Delete an organization
 */
export async function deleteOrganization(id: string) {
  const query = new OrganizationsQuery();
  return query.delete(id);
}

/**
 * Get all profiles with their memberships
 */
export async function getAllProfilesWithMemberships() {
  const query = new ProfilesQuery();
  return query.getAllWithMemberships();
}

/**
 * Get current member user IDs for an organization
 */
export async function getOrganizationMemberUserIds(organizationId: string) {
  const query = new OrganizationMembers();
  return query.getMemberUserIds(organizationId);
}

/**
 * Get current physiologist for an organization
 */
export async function getCurrentPhysiologist(organizationId: string) {
  const query = new OrganizationMembers();
  return query.getCurrentPhysiologist(organizationId);
}

/**
 * Update organization members (add and remove)
 */
export async function updateOrganizationMembers(
  organizationId: string,
  userIds: string[],
) {
  const membersQuery = new OrganizationMembers();
  const supabase = await createClient();

  // Get current member user IDs
  const currentResult = await membersQuery.getMemberUserIds(organizationId);
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

  // Add new members (stored as 'patient' role in database)
  if (toAdd.length > 0) {
    const { error: insertError } = await supabase
      .from('organization_members')
      .insert(
        toAdd.map((user_id) => ({
          organization_id: organizationId,
          user_id,
          role: 'patient',
          is_active: true,
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
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
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

/**
 * Assign or replace physiologist for an organization
 * Only one physiologist per organization - replaces existing if one exists
 */
export async function assignPhysiologist(
  organizationId: string,
  userId: string,
) {
  const membersQuery = new OrganizationMembers();
  const supabase = await createClient();

  // Get current physiologist
  const currentPhysiologistResult =
    await membersQuery.getCurrentPhysiologist(organizationId);
  if (!currentPhysiologistResult.success) {
    return currentPhysiologistResult;
  }

  const currentPhysiologist = currentPhysiologistResult.data;

  // If there's an existing physiologist and it's a different user, remove the old one
  if (currentPhysiologist && currentPhysiologist.userId !== userId) {
    const { error: deleteError } = await supabase
      .from('organization_members')
      .delete()
      .eq('organization_id', organizationId)
      .eq('user_id', currentPhysiologist.userId)
      .eq('role', 'admin');

    if (deleteError) {
      return {
        success: false as const,
        error: `Failed to remove existing physiologist: ${deleteError.message}`,
      };
    }
  }

  // Check if the new user is already a member with a different role
  const { data: existingMember } = await supabase
    .from('organization_members')
    .select('id, role')
    .eq('organization_id', organizationId)
    .eq('user_id', userId)
    .maybeSingle();

  if (existingMember) {
    // Update existing membership to admin role (physiologist is stored as admin)
    const { error: updateError } = await supabase
      .from('organization_members')
      .update({ role: 'admin', is_active: true })
      .eq('id', existingMember.id);

    if (updateError) {
      return {
        success: false as const,
        error: `Failed to update member to physiologist: ${updateError.message}`,
      };
    }

    return {
      success: true as const,
      data: { replaced: currentPhysiologist !== null },
    };
  }

  // Insert new physiologist membership (stored as admin role)
  const { error: insertError } = await supabase
    .from('organization_members')
    .insert({
      organization_id: organizationId,
      user_id: userId,
      role: 'admin',
      is_active: true,
    });

  if (insertError) {
    return {
      success: false as const,
      error: `Failed to assign physiologist: ${insertError.message}`,
    };
  }

  return {
    success: true as const,
    data: { replaced: currentPhysiologist !== null },
  };
}
