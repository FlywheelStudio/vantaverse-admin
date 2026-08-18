'use client';

import * as DialogPrimitive from '@radix-ui/react-dialog';
import { cn } from '../utils/cn';
import { Icon } from '../actions/Icon';

interface DialogProps {
  open?: boolean;
  title?: React.ReactNode;
  children?: React.ReactNode;
  footer?: React.ReactNode;
  onClose?: () => void;
  width?: number;
  className?: string;
  style?: React.CSSProperties;
}

/** Centered modal with scrim, header, body, and footer slot. */
export function Dialog({
  open = true,
  title,
  children,
  footer,
  onClose,
  width = 480,
  className,
  style,
}: DialogProps): React.ReactElement {
  const handleOpenChange = (nextOpen: boolean): void => {
    if (!nextOpen) onClose?.();
  };

  return (
    <DialogPrimitive.Root open={open} onOpenChange={handleOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-[1000] bg-[color-mix(in_oklch,var(--navy-950)_45%,transparent)] backdrop-blur-[2px]" />
        <DialogPrimitive.Content
          className={cn(
            'fixed top-1/2 left-1/2 z-[1000] w-full max-w-[calc(100%-48px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[var(--radius-xl)] bg-[var(--surface-card)] shadow-[var(--shadow-xl)] outline-none',
            className,
          )}
          style={{ maxWidth: width, ...style }}
        >
          <div className="flex items-center justify-between px-6 pt-5">
            {title ? (
              <DialogPrimitive.Title className="text-[length:var(--text-xl)] font-[var(--fw-bold)] text-[var(--text-strong)]">
                {title}
              </DialogPrimitive.Title>
            ) : (
              <DialogPrimitive.Title className="sr-only">Dialog</DialogPrimitive.Title>
            )}
            {onClose ? (
              <DialogPrimitive.Close
                type="button"
                aria-label="Close"
                className="rounded-[var(--radius-pill)] border-0 bg-transparent p-1 text-[var(--text-muted)] hover:text-[var(--text-body)] focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]"
              >
                <Icon name="X" size={20} />
              </DialogPrimitive.Close>
            ) : null}
          </div>
          {children ? (
            <div className="px-6 pt-3.5 pb-5 text-[length:var(--text-md)] leading-[var(--lh-normal)] text-[var(--text-body)]">
              {children}
            </div>
          ) : null}
          {footer ? (
            <div className="flex justify-end gap-2.5 border-t border-[var(--border-subtle)] bg-[var(--slate-50)] px-6 py-4">
              {footer}
            </div>
          ) : null}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
