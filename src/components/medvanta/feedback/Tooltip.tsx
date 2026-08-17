'use client';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import { cn } from '../utils/cn';

export interface TooltipProps {
  label: React.ReactNode;
  placement?: 'top' | 'bottom' | 'left' | 'right';
  children?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/** Hover label wrapping any trigger element. */
export function Tooltip({
  label,
  placement = 'top',
  children,
  className,
  style,
}: TooltipProps): React.ReactElement {
  return (
    <TooltipPrimitive.Provider delayDuration={200}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>
          {children}
        </TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side={placement}
            sideOffset={8}
            className={cn(
              'z-[900] max-w-xs whitespace-nowrap rounded-[var(--radius-sm)] bg-[var(--navy-900)] px-2.5 py-1.5 text-[length:var(--text-xs)] font-[var(--fw-medium)] text-[var(--white)] shadow-[var(--shadow-md)]',
              className,
            )}
            style={style}
          >
            {label}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
