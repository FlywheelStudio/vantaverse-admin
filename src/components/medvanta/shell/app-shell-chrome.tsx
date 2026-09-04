import { SideNav } from './SideNav';

interface AppShellChromeProps {
  main: React.ReactNode;
}

/** Cached `.app` frame + SideNav; main column streams via slot. */
export async function AppShellChrome({
  main,
}: AppShellChromeProps): Promise<React.ReactElement> {
  'use cache';

  return (
    <div className="app" style={{ minHeight: '100vh', height: '100vh' }}>
      <SideNav />
      {main}
    </div>
  );
}
