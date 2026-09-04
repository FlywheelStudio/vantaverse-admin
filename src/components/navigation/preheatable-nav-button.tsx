'use client';

import { useRouter } from 'next/navigation';

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

/** Sidebar nav row that prefetches route + optional queries on hover/focus. */
export function PreheatableNavButton({
  href,
  active = false,
  preheatQueries,
  disabled = false,
  title,
  className,
  children,
}: PreheatableNavButtonProps): React.ReactElement {
  const router = useRouter();
  const { getPreheatHandlers } = usePreheat();
  const preheatHandlers = getPreheatHandlers(href, preheatQueries);

  const handleClick = (): void => {
    if (disabled) {
      return;
    }

    router.push(href);
  };

  return (
    <button
      type="button"
      className={className}
      aria-current={active ? 'page' : undefined}
      disabled={disabled}
      title={title}
      onClick={handleClick}
      {...preheatHandlers}
    >
      {children}
    </button>
  );
}
