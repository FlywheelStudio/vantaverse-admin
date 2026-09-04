import { Suspense } from 'react';
import { CachedAppBarSkeleton } from '@/components/medvanta/shell/app-bar-chrome';
import { AppBarSkeletonSync } from '@/components/medvanta/shell/app-bar-structure';

/** Main-column placeholder while auth or route segment data resolves (chrome stays mounted). */
export function AuthenticatedMainFallback(): React.ReactElement {
  return (
    <>
      <Suspense fallback={<AppBarSkeletonSync />}>
        <CachedAppBarSkeleton />
      </Suspense>
      <div className="body" aria-busy="true">
        <div className="card" style={{ minHeight: 240 }} />
      </div>
    </>
  );
}
