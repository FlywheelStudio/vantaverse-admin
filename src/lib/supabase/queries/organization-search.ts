'use client';

import { supabase } from '@/lib/supabase/core/client';

export type OrganizationOption = { id: string; name: string };

/**
 * Search active organizations by name (RLS-scoped) for the dashboard
 * group selector. Debounced server-side search — call from the browser only.
 */
export async function searchOrganizations(
  query: string,
  limit = 20,
): Promise<OrganizationOption[]> {
  let request = supabase
    .from('organizations')
    .select('id, name')
    .eq('is_active', true)
    .limit(limit);

  const trimmed = query.trim();
  if (trimmed) {
    request = request.ilike('name', `%${trimmed}%`);
  }

  const { data, error } = await request.order('name', { ascending: true });

  if (error) return [];
  return data ?? [];
}
