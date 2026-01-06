import { createClient } from '@/lib/supabase/core/server';
import { NextResponse } from 'next/server';
import { serverGetNext } from '../actions';
import { OrganizationMembers } from '@/lib/supabase/queries/organization-members';

const errorMessage = 'An error occurred during sign in. Please try again.';

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);

  const code = searchParams.get('code');
  const next = await serverGetNext();

  if (code) {
    const supabase = await createClient();

    // Exchange the code for a session
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (error) {
      // Redirect to the sign in page with the error message
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(error.message)}`, origin),
      );
    }

    // Verify user is admin
    const userId = data.session?.user?.id;
    if (!userId) {
      return NextResponse.redirect(
        new URL(`/?error=${encodeURIComponent(errorMessage)}`, origin),
      );
    }

    const organizationMembers = new OrganizationMembers();
    const adminCheck = await organizationMembers.isUserAdminById(userId);

    if (!adminCheck.success || !adminCheck.data) {
      // Sign out the user and redirect with error
      await supabase.auth.signOut();
      return NextResponse.redirect(
        new URL(
          `/?error=${encodeURIComponent('Access denied. Admin access required.')}`,
          origin,
        ),
      );
    }

    // User is admin, redirect to dashboard
    return NextResponse.redirect(new URL(next, origin));
  }

  // If there's no code, redirect to sign in with default error
  return NextResponse.redirect(
    new URL(`/?error=${encodeURIComponent(errorMessage)}`, origin),
  );
}
