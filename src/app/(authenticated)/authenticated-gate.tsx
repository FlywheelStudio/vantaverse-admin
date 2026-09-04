import { forbidden, redirect } from 'next/navigation';
import { AppShell } from '@/components/medvanta/shell/AppShell';
import { getAuthProfile } from './auth/actions';

interface AuthenticatedGateProps {
  children: React.ReactNode;
}

/**
 * Server auth gate for authenticated routes. Wrapped in Suspense by the parent layout
 * so Cache Components can prerender the static shell while profile loads.
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

  return <AppShell>{children}</AppShell>;
}
