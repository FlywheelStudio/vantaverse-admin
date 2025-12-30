import { createClient } from "@supabase/supabase-js";

/**
 * Create an anonymous Supabase client for public data access
 * This client doesn't use cookies and can be used in static rendering
 */
export function createAnonymousClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    );
}
