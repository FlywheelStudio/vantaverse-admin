'use client';

import Link from 'next/link';

import {
  usePreheat,
  type PreheatQueryTarget,
} from '@/hooks/use-preheat';

interface PreheatableNavButtonProps {
  href: string;
  active?: boolean;
  preheatQueries?: readonly PreheatQueryTarget[];
  disabled?: boolean;
  title?: string;
  className?: string;
  children: React.ReactNode;
}

/**
 * Sidebar nav row as `<Link>` so App Router prefetch + client cache apply.
 * Hover/focus still warms TanStack queries via `usePreheat`.
 */
export function PreheatableNavButton({
  href,
  active = false,
  preheatQueries,
  disabled = false,
  title,
  className,
  children,
}: PreheatableNavButtonProps): React.ReactElement {
  const { getPreheatHandlers } = usePreheat();
  const preheatHandlers = getPreheatHandlers(href, preheatQueries);

  if (disabled) {
    return (
      <span
        className={className}
        title={title}
        aria-disabled="true"
        aria-current={active ? 'page' : undefined}
      >
        {children}
      </span>
    );
  }

  return (
    <Link
      href={href}
      prefetch
      className={className}
      aria-current={active ? 'page' : undefined}
      title={title}
      {...preheatHandlers}
    >
      {children}
    </Link>
  );
}
