import { Suspense } from 'react';
import { AppShell } from '@/components/medvanta/shell/AppShell';
import { AuthenticatedGate } from './authenticated-gate';
import { AuthenticatedMainFallback } from './authenticated-main-fallback';

/**
 * Server layout: cached shell chrome mounts first; auth gate suspends only the main column.
 */
export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <AppShell>
      <Suspense fallback={<AuthenticatedMainFallback />}>
        <AuthenticatedGate>{children}</AuthenticatedGate>
      </Suspense>
    </AppShell>
  );
}
