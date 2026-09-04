import { AppShellChrome } from './app-shell-chrome';
import { MainColumnChrome } from './main-column-chrome';

interface AppShellProps {
  children: React.ReactNode;
}

/** HTML `.app` shell: fixed side nav + scrollable main column. */
export async function AppShell({
  children,
}: AppShellProps): Promise<React.ReactElement> {
  return (
    <AppShellChrome
      main={<MainColumnChrome>{children}</MainColumnChrome>}
    />
  );
}
