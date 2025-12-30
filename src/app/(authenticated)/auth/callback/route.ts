import { createClient } from '@/lib/supabase/core/server';
import { NextResponse } from 'next/server';
import { serverGetNext } from '../actions';

const errorMessage = 'An error occurred during sign in. Please try again.';

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const next = await serverGetNext();

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }

    // Redirect to the sign in page with the error message
    return NextResponse.redirect(
      new URL(
        `/auth/sign-in?error=${encodeURIComponent(error.message)}`,
        origin,
      ),
    );
  }

  // If there's no code, redirect to sign in with default error
  return NextResponse.redirect(
    new URL(`/auth/sign-in?error=${encodeURIComponent(errorMessage)}`, origin),
  );
}
