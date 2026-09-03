import type { SupabaseClient } from '@supabase/supabase-js';
import { z } from 'zod';

import { defineQuery } from '@/lib/dal';
import type { Database } from '@/lib/supabase/database.types';

const organizationOptionSchema = z.object({
  id: z.uuid(),
  name: z.string(),
});

const organizationOptionListSchema = z.array(organizationOptionSchema);

export type OrganizationOption = z.infer<typeof organizationOptionSchema>;

export const organizationSearchKeys = {
  all: ['organization-search'] as const,
  search: (query: string, limit: number) =>
    [...organizationSearchKeys.all, query, limit] as const,
};

const DEFAULT_SEARCH_LIMIT = 20;

async function fetchOrganizations(
  client: SupabaseClient<Database>,
  query: string,
  limit: number,
): Promise<{
  data: OrganizationOption[] | null;
  error: { message: string } | null;
}> {
  let request = client
    .from('organizations')
    .select('id, name')
    .eq('is_active', true)
    .limit(limit);

  const trimmed = query.trim();
  if (trimmed) {
    request = request.ilike('name', `%${trimmed}%`);
  }

  const { data, error } = await request.order('name', { ascending: true });

  if (error) return { data: null, error };
  return { data: data ?? [], error: null };
}

/**
 * Search active organizations by name (RLS-scoped) for the dashboard
 * group selector. Debounced server-side search — call from the browser only.
 */
export const searchOrganizations = defineQuery({
  key: organizationSearchKeys.search,
  schema: organizationOptionListSchema,
  execute: (client, query: string, limit = DEFAULT_SEARCH_LIMIT) =>
    fetchOrganizations(client, query, limit),
});
