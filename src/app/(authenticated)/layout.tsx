import { Suspense } from 'react';
import { AuthenticatedGate } from './authenticated-gate';

/**
 * Server layout: require `profiles_admins` + active org admin membership.
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <Suspense fallback={null}>
      <AuthenticatedGate>{children}</AuthenticatedGate>
    </Suspense>
  );
}
