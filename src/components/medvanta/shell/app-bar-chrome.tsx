import {
  AppBarStructure,
} from './app-bar-structure';

interface AppBarChromeProps {
  ribbon: React.ReactNode;
  titleSlot: React.ReactNode;
  actions?: React.ReactNode;
}

/** Cached `.abar` shell — dynamic ribbon/title/actions render in composable slots. */
async function AppBarChrome({
  ribbon,
  titleSlot,
  actions,
}: AppBarChromeProps): Promise<React.ReactElement> {
  'use cache';

  return (
    <AppBarStructure ribbon={ribbon} titleSlot={titleSlot} actions={actions} />
  );
}

/** Cached AppBar skeleton for route/auth main-column fallbacks. */
export async function CachedAppBarSkeleton(): Promise<React.ReactElement> {
  'use cache';

  return (
    <AppBarChrome
      ribbon={<span className="rib-cur" aria-hidden> </span>}
      titleSlot={<h1 aria-hidden> </h1>}
    />
  );
}
