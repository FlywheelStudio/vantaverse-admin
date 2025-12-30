'use server';

import { createClient } from '@/lib/supabase/core/server';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';
/**
 * Sign in with google
 */
export async function serverSignInWithGoogle() {
  // Get the origin from the headers
  const origin = (await headers()).get('origin');

  // Create the supabase client
  const supabase = await createClient();

  // Sign in with google
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${origin}/auth/callback`,
      queryParams: {
        prompt: 'consent',
        access_type: 'offline',
        response_type: 'code',
      },
      scopes: ['openid', 'email', 'profile'].join(' '),
    },
  });

  // If there is an error, throw it
  if (error) {
    redirect(`/auth/sign-in?error=${error.message}`);
  }

  // Redirect to the url
  redirect(data.url);
}

/**
 * Save the next url to the cookie
 */
export async function serverSaveNext(next: string) {
  const cookieStore = await cookies();
  cookieStore.set('next', next, {
    expires: Date.now() + 24 * 60 * 60 * 1000,
    httpOnly: true,
  });
}

/**
 * Get the next url from the cookie
 */
export async function serverGetNext() {
  const cookieStore = await cookies();
  const next = cookieStore.get('next')?.value;

  if (next) {
    cookieStore.delete('next');
  }

  return next || '/dashboard';
}
