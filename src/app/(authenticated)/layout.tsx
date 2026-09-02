import { forbidden, redirect } from 'next/navigation';
import { getAuthProfile } from './auth/actions';
import { AuthenticatedShell } from './authenticated-shell';

/**
 * Server layout: require `profiles_admins` + active org admin membership.
 */
export default async function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const profile = await getAuthProfile();

  if (!profile.success) {
    if (profile.status === 401 || profile.error === 'Unauthenticated') {
      redirect('/login');
    }
    forbidden();
  }

  return <AuthenticatedShell>{children}</AuthenticatedShell>;
}
