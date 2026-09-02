'use client';

import { usePathname } from 'next/navigation';
import { AppShell, navIdFromPathname } from '@/components/medvanta/shell';

interface AuthenticatedShellProps {
  children: React.ReactNode;
}

/**
 * Client shell for authenticated routes (nav + chrome).
 * Auth gate runs in the server parent layout.
 */
export function AuthenticatedShell({
  children,
}: AuthenticatedShellProps): React.ReactElement {
  const pathname = usePathname();

  return <AppShell active={navIdFromPathname(pathname)}>{children}</AppShell>;
}
