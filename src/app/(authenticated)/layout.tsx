'use client';

import { usePathname } from 'next/navigation';
import { AppShell, navIdFromPathname } from '@/components/medvanta/shell';

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  const pathname = usePathname();

  return <AppShell active={navIdFromPathname(pathname)}>{children}</AppShell>;
}
