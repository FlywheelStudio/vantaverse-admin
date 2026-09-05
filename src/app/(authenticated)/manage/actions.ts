'use server';

import { query, type DalResult } from '@/lib/dal';
import { createClient } from '@/lib/supabase/core/server';
import {
  getAdminByIdQuery,
  getAdminFilterCountsQuery,
  listAdminsFilteredQuery,
  type ListAdminsFilteredInput,
} from '@/lib/supabase/queries/admins';
import type { AdminFilterCounts, AdminProfile } from '@/lib/supabase/schemas/admins';
import type { PaginatedResult } from '@/lib/supabase/queries/exercise-templates';
import type { SupabaseError, SupabaseSuccess } from '@/lib/supabase/result';

function toSupabaseResult<T>(
  result: DalResult<T>,
): SupabaseSuccess<T> | SupabaseError {
  const [err, data] = result;
  if (err) {
    return { success: false, error: err.message };
  }
  return { success: true, data };
}

/**
 * List admins via `list_admins_filtered`.
 */
export async function getAdminsFiltered(
  params: ListAdminsFilteredInput = {},
): Promise<SupabaseSuccess<PaginatedResult<AdminProfile>> | SupabaseError> {
  const client = await createClient();
  return toSupabaseResult(
    await query(listAdminsFilteredQuery, params, { client }),
  );
}

/**
 * Facet counts via `get_admin_filter_counts`.
 */
export async function getAdminFilterCounts(): Promise<
  SupabaseSuccess<AdminFilterCounts> | SupabaseError
> {
  const client = await createClient();
  return toSupabaseResult(await query(getAdminFilterCountsQuery, { client }));
}

/**
 * Load one admin profile by id.
 */
export async function getAdminProfileById(
  id: string,
): Promise<SupabaseSuccess<AdminProfile> | SupabaseError> {
  const client = await createClient();
  return toSupabaseResult(await query(getAdminByIdQuery, id, { client }));
}
