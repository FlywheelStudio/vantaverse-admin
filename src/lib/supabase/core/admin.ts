'use server';

import { createClient } from '@supabase/supabase-js';

/**
 * Create an admin Supabase client using service_role key
 * This client bypasses RLS and should only be used in server actions
 * Never expose this client to the client-side code
 */
export async function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}
