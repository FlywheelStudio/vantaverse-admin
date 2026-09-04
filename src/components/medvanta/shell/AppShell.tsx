import { SideNav } from './SideNav';

interface AppShellProps {
  children: React.ReactNode;
}

/** HTML `.app` shell: fixed side nav + scrollable main column. */
export async function AppShell({
  children,
}: AppShellProps): Promise<React.ReactElement> {
  'use cache';

  return (
    <div className="app" style={{ minHeight: '100vh', height: '100vh' }}>
      <SideNav />
      <div className="main">{children}</div>
    </div>
  );
}
