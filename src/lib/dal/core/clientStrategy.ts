import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';

import type { Database } from '@/lib/supabase/database.types';

import type { ClientStrategy } from './defineQuery';
import type { DalError } from './errors';
import { unknownError } from './errors';

type ResolveClientResult =
  | { success: true; client: SupabaseClient<Database> }
  | { success: false; error: DalError };

function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function getAnonKey(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

function missingEnvError(name: string): DalError {
  return unknownError(`Missing required environment variable: ${name}`);
}

/** One browser/module instance — creating per-query triggers GoTrue multi-client warnings. */
let anonymousClient: SupabaseClient<Database> | undefined;

function createAnonymousClient(): ResolveClientResult {
  if (anonymousClient) {
    return { success: true, client: anonymousClient };
  }

  const url = getSupabaseUrl();
  const anonKey = getAnonKey();

  if (!url) {
    return {
      success: false,
      error: missingEnvError('NEXT_PUBLIC_SUPABASE_URL'),
    };
  }

  if (!anonKey) {
    return {
      success: false,
      error: missingEnvError('NEXT_PUBLIC_SUPABASE_ANON_KEY'),
    };
  }

  anonymousClient = createSupabaseClient<Database>(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  return { success: true, client: anonymousClient };
}

async function createAdminClient(): Promise<ResolveClientResult> {
  if (typeof window !== 'undefined') {
    return {
      success: false,
      error: {
        kind: 'auth',
        code: 'FORBIDDEN',
        message: 'Admin client is only available on the server',
      },
    };
  }

  const url = getSupabaseUrl();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url) {
    return {
      success: false,
      error: missingEnvError('NEXT_PUBLIC_SUPABASE_URL'),
    };
  }

  if (!serviceRoleKey) {
    return {
      success: false,
      error: unknownError(
        'Admin client requires SUPABASE_SERVICE_ROLE_KEY on the server',
      ),
    };
  }

  return {
    success: true,
    client: createSupabaseClient<Database>(url, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }),
  };
}

async function createAuthenticatedClient(): Promise<ResolveClientResult> {
  // Keep this module free of `next/headers` so Client Components can import
  // `query` / `toQueryOptions`. On the server, inject the cookie client:
  //   import { createClient } from "@/lib/supabase/core/server"
  //   await query(def, ...args, { client: await createClient() })
  if (typeof window !== 'undefined') {
    const { supabase } = await import('@/lib/supabase/core/client');
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return {
        success: false,
        error: {
          kind: 'auth',
          code: 'UNAUTHENTICATED',
          message: error.message,
        },
      };
    }

    if (!data.session) {
      return {
        success: false,
        error: {
          kind: 'auth',
          code: 'UNAUTHENTICATED',
          message: 'No authenticated session',
        },
      };
    }

    return { success: true, client: supabase };
  }

  return {
    success: false,
    error: unknownError(
      'Authenticated client on the server requires an injected Supabase client from @/lib/supabase/core/server',
    ),
  };
}

/**
 * Resolve the Supabase client for a DAL call.
 * Injected `client` always wins; otherwise uses {@link ClientStrategy}.
 * Authenticated on the server must be injected (this module never imports
 * `lib/supabase/core/server`).
 */
export async function resolveClient(
  strategy: ClientStrategy = 'authenticated',
  injected?: SupabaseClient<Database>,
): Promise<ResolveClientResult> {
  if (injected) {
    return { success: true, client: injected };
  }

  switch (strategy) {
    case 'anonymous':
      return createAnonymousClient();
    case 'admin':
      return createAdminClient();
    case 'authenticated':
    default:
      return createAuthenticatedClient();
  }
}
