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
}

/** HTML `.abar` header: ribbon breadcrumbs + optional title row (client-safe). */
export function AppBar({
  crumbs,
  title,
  subtitle,
  actions,
}: AppBarProps): React.ReactElement {
  const ribbon = renderAppBarRibbon(crumbs);
  const titleSlot =
    title != null ? (
      <>
        <h1>{title}</h1>
        {subtitle ? <div className="abar-sub">{subtitle}</div> : null}
      </>
    ) : null;

  return (
    <AppBarStructure
      ribbon={ribbon}
      titleSlot={titleSlot}
      actions={actions}
    />
  );
}
