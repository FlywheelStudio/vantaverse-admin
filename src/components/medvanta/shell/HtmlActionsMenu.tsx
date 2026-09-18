'use client';

import { Icon } from '@/components/medvanta';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

export interface HtmlActionsMenuItem {
  id: string;
  label: string;
  danger?: boolean;
  disabled?: boolean;
  onSelect?: () => void;
}

interface HtmlActionsMenuProps {
  items: HtmlActionsMenuItem[];
  /** `icon` = ellipsis-only (rowMenu / moreBtn). `button` = labeled pill. */
  variant?: 'icon' | 'button';
  /**
   * Icon-button chrome from the HTML prototype.
   * - `ghost` → `.ib.ib-sm` (rowMenu)
   * - `sec` → `.ib.ib-sec` (moreBtn)
   */
  tone?: 'ghost' | 'sec';
  label?: string;
  ariaLabel?: string;
  triggerClassName?: string;
  contentClassName?: string;
  align?: 'start' | 'center' | 'end';
}

/** HTML `moreBtn` / `rowMenu` overflow actions dropdown. */
export function HtmlActionsMenu({
  items,
  variant = 'icon',
  tone = 'ghost',
  label,
  ariaLabel,
  triggerClassName,
  contentClassName,
  align = 'end',
}: HtmlActionsMenuProps): React.ReactElement {
  const triggerClasses =
    variant === 'button'
      ? cn('btn btn-sec btn-sm', triggerClassName)
      : cn('ib', tone === 'sec' ? 'ib-sec' : 'ib-sm', triggerClassName);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={triggerClasses}
          aria-label={ariaLabel ?? 'More actions'}
        >
          <Icon name="Ellipsis" size={tone === 'sec' ? 18 : 17} />
          {variant === 'button' && label ? label : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align={align} className={cn('min-w-[180px]', contentClassName)}>
        {items.map((item) => (
          <DropdownMenuItem
            key={item.id}
            disabled={item.disabled || !item.onSelect}
            variant={item.danger ? 'destructive' : 'default'}
            onSelect={() => item.onSelect?.()}
          >
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
