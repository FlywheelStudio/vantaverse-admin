'use server';

import { AdminsQuery } from '@/lib/supabase/queries/admins';

/**
 * List admins via `list_admins_filtered`.
 */
export async function getAdminsFiltered(
  params: Parameters<AdminsQuery['getListFiltered']>[0] = {},
) {
  const query = new AdminsQuery();
  return query.getListFiltered(params);
}

/**
 * Facet counts via `get_admin_filter_counts`.
 */
export async function getAdminFilterCounts() {
  const query = new AdminsQuery();
  return query.getFilterCounts();
}

/**
 * Load one admin profile by id.
 */
export async function getAdminProfileById(id: string) {
  const query = new AdminsQuery();
  return query.getById(id);
}
