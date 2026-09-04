import { forbidden, redirect } from 'next/navigation';
import { getAuthProfile } from './auth/actions';

interface AuthenticatedGateProps {
  children: React.ReactNode;
}

/**
 * Server auth gate for authenticated routes. Parent layout mounts AppShell outside this
 * component so SideNav stays visible while profile auth resolves.
 */
export async function AuthenticatedGate({
  children,
}: AuthenticatedGateProps): Promise<React.ReactElement> {
  const profile = await getAuthProfile();

  if (!profile.success) {
    if (profile.status === 401 || profile.error === 'Unauthenticated') {
      redirect('/login');
    }
    forbidden();
  }

  return <>{children}</>;
}
