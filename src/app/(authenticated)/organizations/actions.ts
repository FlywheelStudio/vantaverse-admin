'use server';

import { OrganizationsQuery } from '@/lib/supabase/queries/organizations';
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
export async function createOrganization(name: string) {
  const query = new OrganizationsQuery();
  return query.create(name);
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
