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

export interface HtmlActionsMenuProps {
  items: HtmlActionsMenuItem[];
  size?: 'sm' | 'md';
  variant?: 'icon' | 'button';
  label?: string;
  ariaLabel?: string;
  triggerClassName?: string;
}

/** HTML `moreBtn` / `rowMenu` overflow actions dropdown. */
export function HtmlActionsMenu({
  items,
  size = 'md',
  variant = 'icon',
  label,
  ariaLabel,
  triggerClassName,
}: HtmlActionsMenuProps): React.ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            size === 'sm'
              ? 'ib ib-sm'
              : variant === 'button'
                ? 'btn btn-sec btn-sm'
                : 'ib ib-sec',
            triggerClassName,
          )}
          aria-label={ariaLabel ?? 'More actions'}
        >
          <Icon name="Ellipsis" size={size === 'sm' ? 17 : 18} />
          {variant === 'button' && label ? label : null}
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
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
