import Link from 'next/link';
import { Icon } from '../actions/Icon';

export interface AppBarCrumb {
  label: string;
  href?: string;
}

interface AppBarStructureProps {
  ribbon: React.ReactNode;
  titleSlot: React.ReactNode;
  actions?: React.ReactNode;
}

/** Shared `.abar` markup for sync AppBar and cached AppBarChrome. */
export function AppBarStructure({
  ribbon,
  titleSlot,
  actions,
}: AppBarStructureProps): React.ReactElement {
  return (
    <header className="abar">
      <nav className="ribbon" aria-label="Breadcrumb">{ribbon}</nav>
      <div className="abar-row">
        <div className="abar-id">{titleSlot}</div>
        {actions ? <div className="abar-acts">{actions}</div> : null}
      </div>
    </header>
  );
}

/** Breadcrumb ribbon markup for AppBar / CachedAppBar. */
export function renderAppBarRibbon(crumbs: AppBarCrumb[]): React.ReactElement {
  return (
    <>
      {crumbs.map((crumb, index) => {
        const isLast = index === crumbs.length - 1;
        const isHome = crumb.href === '/';

        return (
          <span key={`${crumb.label}-${index}`} className="inline-flex items-center">
            {index > 0 ? (
              <span className="rib-sep" aria-hidden>
                <Icon name="ChevronRight" size={12} />
              </span>
            ) : null}
            {isLast ? (
              <span className="rib-cur">{crumb.label}</span>
            ) : crumb.href ? (
              <Link
                href={crumb.href}
                className={isHome ? 'rib-home rib-l' : 'rib-l'}
              >
                {isHome ? <Icon name="Home" size={14} /> : crumb.label}
              </Link>
            ) : (
              <span className="rib-l">{crumb.label}</span>
            )}
          </span>
        );
      })}
    </>
  );
}

/** Sync AppBar skeleton for Suspense fallbacks (instant paint). */
export function AppBarSkeletonSync(): React.ReactElement {
  return (
    <AppBarStructure
      ribbon={<span className="rib-cur" aria-hidden> </span>}
      titleSlot={<h1 aria-hidden> </h1>}
    />
  );
}
