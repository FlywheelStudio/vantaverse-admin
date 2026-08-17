import type { ShellNavId } from './nav';
import { SideNav } from './SideNav';

export interface AppShellProps {
  active: ShellNavId;
  children: React.ReactNode;
}

/** HTML `.app` shell: fixed side nav + scrollable main column. */
export function AppShell({ active, children }: AppShellProps): React.ReactElement {
  return (
    <div className="app" style={{ minHeight: '100vh', height: '100vh' }}>
      <SideNav active={active} />
      <div className="main">{children}</div>
    </div>
  );
}
