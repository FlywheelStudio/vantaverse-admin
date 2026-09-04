import type { SupabaseClient } from '@supabase/supabase-js';

import { createAnonymousClient as createRepoAnonymousClient } from '@/lib/supabase/core/anonymous';
import type { Database } from '@/lib/supabase/database.types';

import type { ClientStrategy } from './defineQuery';
import type { DalError } from './errors';
import { unknownError } from './errors';

type ResolveClientResult =
  | { success: true; client: SupabaseClient<Database> }
  | { success: false; error: DalError };

/** One module instance — creating per-query triggers GoTrue multi-client warnings. */
let anonymousClient: SupabaseClient<Database> | undefined;

function resolveAnonymousClient(): ResolveClientResult {
  if (anonymousClient) {
    return { success: true, client: anonymousClient };
  }

  anonymousClient = createRepoAnonymousClient() as SupabaseClient<Database>;
  return { success: true, client: anonymousClient };
}

async function resolveAdminClient(): Promise<ResolveClientResult> {
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

  try {
    const { createAdminClient } = await import('@/lib/supabase/core/admin');
    const client = await createAdminClient();
    return { success: true, client: client as SupabaseClient<Database> };
  } catch (cause) {
    return {
      success: false,
      error: unknownError(
        cause instanceof Error
          ? cause.message
          : 'Failed to create admin Supabase client',
        cause,
      ),
    };
  }
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
      return resolveAnonymousClient();
    case 'admin':
      return resolveAdminClient();
    case 'authenticated':
    default:
      return createAuthenticatedClient();
  }
}
