'use server';

import { createClient } from '@/lib/supabase/core/server';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';
import { ProfilesQuery } from '@/lib/supabase/queries/profiles';
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

  return next || '/';
}

/**
 * Sign in with OTP (email)
 * Checks if user is admin before sending OTP
 */
export async function serverSignInWithMagicLink(email: string) {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if email belongs to an admin user using query class
    const organizationMembers = new OrganizationMembers();
    const adminCheck = await organizationMembers.isUserAdminByEmail(
      normalizedEmail,
      'service_role',
    );

    if (!adminCheck.success) {
      redirect(`/login?error=${encodeURIComponent(adminCheck.error)}`);
    }

    if (!adminCheck.data) {
      redirect(
        `/login?error=${encodeURIComponent('Access denied. Admin access required.')}`,
      );
    }

    // User is admin, send OTP
    const supabase = await createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: false,
      },
    });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    // Redirect to same page with success message and email
    redirect(
      `/login?message=${encodeURIComponent('Check your email for the verification code')}&email=${encodeURIComponent(normalizedEmail)}&otpSent=true`,
    );
  } catch (error) {
    // Re-throw redirect errors (Next.js uses them internally)
    // Next.js redirect() throws an error with digest property containing 'NEXT_REDIRECT'
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof (error as { digest?: unknown }).digest === 'string' &&
      (error as { digest: string }).digest.includes('NEXT_REDIRECT')
    ) {
      throw error;
    }
    console.error('OTP send error:', error);
    redirect(
      `/login?error=${encodeURIComponent('An error occurred. Please try again.')}`,
    );
  }
}

/**
 * Verify OTP code
 * Checks if user is admin before verifying OTP
 */
export async function serverVerifyOtp(email: string, token: string) {
  const normalizedEmail = email.toLowerCase().trim();

  try {
    // Check if email belongs to an admin user using query class
    const organizationMembers = new OrganizationMembers();
    const adminCheck = await organizationMembers.isUserAdminByEmail(
      normalizedEmail,
      'service_role',
    );

    if (!adminCheck.success) {
      redirect(`/login?error=${encodeURIComponent(adminCheck.error)}`);
    }

    if (!adminCheck.data) {
      redirect(
        `/login?error=${encodeURIComponent('Access denied. Admin access required.')}`,
      );
    }

    // Verify OTP
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token,
      type: 'email',
    });

    if (error) {
      redirect(`/login?error=${encodeURIComponent(error.message)}`);
    }

    if (data.user) {
      // Get the next URL from cookie
      const next = await serverGetNext();
      redirect(next);
    } else {
      redirect(`/login?error=${encodeURIComponent('Verification failed')}`);
    }
  } catch (error) {
    // Re-throw redirect errors (Next.js uses them internally)
    // Next.js redirect() throws an error with digest property containing 'NEXT_REDIRECT'
    if (
      error &&
      typeof error === 'object' &&
      'digest' in error &&
      typeof (error as { digest?: unknown }).digest === 'string' &&
      (error as { digest: string }).digest.includes('NEXT_REDIRECT')
    ) {
      throw error;
    }
    console.error('OTP verify error:', error);
    redirect(
      `/login?error=${encodeURIComponent('An error occurred. Please try again.')}`,
    );
  }
}

/**
 * Get the authenticated user's profile
 */
export async function getAuthProfile() {
  const query = new ProfilesQuery();
  return query.getAuthProfile();
}
