'use server';

import { OrganizationsQuery } from '@/lib/supabase/queries/organizations';
import { SupabaseStorage } from '@/lib/supabase/storage';
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
