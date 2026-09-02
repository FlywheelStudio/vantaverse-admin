'use client';

import {
  HtmlActionsMenu,
  type HtmlActionsMenuItem,
} from '@/components/medvanta/shell/HtmlActionsMenu';

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

interface HtmlMoreButtonProps {
  items?: HtmlActionsMenuItem[];
  tooltip?: string;
}

/** HTML `moreBtn()` overflow menu — delegates to {@link HtmlActionsMenu}. */
export function HtmlMoreButton({ items, tooltip }: HtmlMoreButtonProps): React.ReactElement {
  const menuItems = items ?? (tooltip ? parseLegacyMenuItems(tooltip) : []);
  return <HtmlActionsMenu items={menuItems} variant="icon" />;
}

interface HtmlRowMenuProps {
  items?: HtmlActionsMenuItem[];
  tooltip?: string;
}

/** HTML `rowMenu()` for table row overflow actions — delegates to {@link HtmlActionsMenu}. */
export function HtmlRowMenu({ items, tooltip }: HtmlRowMenuProps): React.ReactElement {
  const menuItems = items ?? (tooltip ? parseLegacyMenuItems(tooltip) : []);
  return <HtmlActionsMenu items={menuItems} />;
}
