import Link from 'next/link';
import { Icon } from '../actions/Icon';

export interface AppBarCrumb {
  label: string;
  href?: string;
}

export interface AppBarProps {
  crumbs: AppBarCrumb[];
  title: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
}

/** HTML `.abar` header: ribbon breadcrumbs + title row. */
export function AppBar({
  crumbs,
  title,
  subtitle,
  actions,
}: AppBarProps): React.ReactElement {
  return (
    <header className="abar">
      <nav className="ribbon" aria-label="Breadcrumb">
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
      </nav>
      <div className="abar-row">
        <div className="abar-id">
          <h1>{title}</h1>
          {subtitle ? <div className="abar-sub">{subtitle}</div> : null}
        </div>
        {actions ? <div className="abar-acts">{actions}</div> : null}
      </div>
    </header>
  );
}
