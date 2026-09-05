'use client';

import {
  AppBarStructure,
  type AppBarCrumb,
  renderAppBarRibbon,
} from './app-bar-structure';

interface AppBarProps {
  crumbs: AppBarCrumb[];
  /** When omitted, only the breadcrumb ribbon renders (no title row). */
  title?: string;
  subtitle?: React.ReactNode;
  actions?: React.ReactNode;
  /** Mark shown beside the title (e.g. group logo). */
  leading?: React.ReactNode;
}

/** HTML `.abar` header: ribbon breadcrumbs + optional title row (client-safe). */
export function AppBar({
  crumbs,
  title,
  subtitle,
  actions,
  leading,
}: AppBarProps): React.ReactElement {
  const ribbon = renderAppBarRibbon(crumbs);
  const heading =
    title != null ? (
      <>
        <h1>{title}</h1>
        {subtitle ? <div className="abar-sub">{subtitle}</div> : null}
      </>
    ) : null;
  const titleSlot =
    heading == null
      ? null
      : leading != null ? (
          <div className="row" style={{ gap: 12, alignItems: 'center' }}>
            {leading}
            <div style={{ minWidth: 0 }}>{heading}</div>
          </div>
        ) : (
          heading
        );

  return (
    <AppBarStructure
      ribbon={ribbon}
      titleSlot={titleSlot}
      actions={actions}
    />
  );
}
