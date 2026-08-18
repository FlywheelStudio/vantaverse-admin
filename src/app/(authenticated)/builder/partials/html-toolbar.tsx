'use client';

import { Icon } from '@/components/medvanta';
import {
  HtmlActionsMenu,
  type HtmlActionsMenuItem,
} from '@/components/medvanta/shell/HtmlActionsMenu';

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

function parseLegacyMenuItems(text: string): HtmlActionsMenuItem[] {
  return text
    .split(' · ')
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part, index) => ({
      id: `legacy-${index}`,
      label: part,
      disabled: true,
    }));
}

export interface HtmlMoreButtonProps {
  items?: HtmlActionsMenuItem[];
  tooltip?: string;
}

/** HTML `moreBtn()` overflow menu — delegates to {@link HtmlActionsMenu}. */
export function HtmlMoreButton({ items, tooltip }: HtmlMoreButtonProps): React.ReactElement {
  const menuItems = items ?? (tooltip ? parseLegacyMenuItems(tooltip) : []);
  return <HtmlActionsMenu items={menuItems} size="md" variant="icon" />;
}

export interface HtmlRowMenuProps {
  items?: HtmlActionsMenuItem[];
  tooltip?: string;
}

/** HTML `rowMenu()` for table row overflow actions — delegates to {@link HtmlActionsMenu}. */
export function HtmlRowMenu({ items, tooltip }: HtmlRowMenuProps): React.ReactElement {
  const menuItems = items ?? (tooltip ? parseLegacyMenuItems(tooltip) : []);
  return <HtmlActionsMenu items={menuItems} size="sm" />;
}
