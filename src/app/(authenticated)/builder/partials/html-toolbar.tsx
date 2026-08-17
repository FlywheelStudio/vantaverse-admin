'use client';

import { Icon } from '@/components/medvanta';

export interface HtmlFiltersButtonProps {
  activeCount?: number;
}

/** Disabled HTML `filtersBtn()` placeholder — filter panel is out of scope. */
export function HtmlFiltersButton({
  activeCount = 0,
}: HtmlFiltersButtonProps): React.ReactElement {
  return (
    <button type="button" className="btn btn-sec" disabled title="Filters placeholder">
      <Icon name="Funnel" size={16} />
      Filters
      {activeCount > 0 ? (
        <span className="bdg bdg-b" style={{ padding: '0 6px', fontSize: 10 }}>
          {activeCount}
        </span>
      ) : null}
    </button>
  );
}

export interface HtmlMoreButtonProps {
  tooltip: string;
}

/** Disabled HTML `moreBtn()` overflow menu placeholder. */
export function HtmlMoreButton({ tooltip }: HtmlMoreButtonProps): React.ReactElement {
  return (
    <div className="tip">
      <button type="button" className="ib ib-sec" disabled aria-label="More actions">
        <Icon name="Ellipsis" size={18} />
      </button>
      <span className="tt">{tooltip}</span>
    </div>
  );
}

export interface HtmlRowMenuProps {
  tooltip: string;
}

/** Disabled HTML `rowMenu()` for table row overflow actions. */
export function HtmlRowMenu({ tooltip }: HtmlRowMenuProps): React.ReactElement {
  return (
    <div className="tip">
      <button type="button" className="ib ib-sm" disabled aria-label="More actions">
        <Icon name="Ellipsis" size={17} />
      </button>
      <span className="tt">{tooltip}</span>
    </div>
  );
}
