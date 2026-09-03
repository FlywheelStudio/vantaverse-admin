import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '../database.types';

export interface DisplayProfile {
  id: string;
  avatar_url: string | null;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  description?: string | null;
}

type DbClient = SupabaseClient<Database>;

const displayProfileSelect =
  'id, avatar_url, first_name, last_name, email, description' as const;

/**
 * Resolve display PII for user ids after dual-role FKs → `auth.users`.
 * Patients: `profiles`. Admins: `profiles_admins`. Prefer admin row when both exist.
 */
export async function resolveDisplayProfilesByIds(
  supabase: DbClient,
  userIds: string[],
): Promise<Map<string, DisplayProfile>> {
  const map = new Map<string, DisplayProfile>();
  const uniqueIds = [...new Set(userIds.filter(Boolean))];
  if (uniqueIds.length === 0) {
    return map;
  }

  const [{ data: patients }, { data: admins, error: adminsError }] =
    await Promise.all([
      supabase.from('profiles').select(displayProfileSelect).in('id', uniqueIds),
      supabase
        .from('profiles_admins')
        .select(displayProfileSelect)
        .in('id', uniqueIds),
    ]);

  for (const row of patients ?? []) {
    map.set(row.id, {
      id: row.id,
      avatar_url: row.avatar_url,
      first_name: row.first_name,
      last_name: row.last_name,
      email: row.email,
      description: row.description,
    });
  }

  if (!adminsError) {
    for (const admin of admins ?? []) {
      map.set(admin.id, {
        id: admin.id,
        avatar_url: admin.avatar_url,
        first_name: admin.first_name,
        last_name: admin.last_name,
        email: admin.email,
        description: admin.description,
      });
    }
  }

  return map;
}
