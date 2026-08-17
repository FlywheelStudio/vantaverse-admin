'use client';

import { cn } from '../utils/cn';
import { Icon } from '../actions/Icon';

export interface PaginationProps {
  page?: number;
  pageCount?: number;
  onChange?: (page: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Page controls with prev/next and current page indicator. */
export function Pagination({
  page = 1,
  pageCount = 10,
  onChange,
  className,
  style,
}: PaginationProps): React.ReactElement {
  const canPrev = page > 1;
  const canNext = page < pageCount;

  const handlePrev = (): void => {
    if (canPrev) onChange?.(page - 1);
  };

  const handleNext = (): void => {
    if (canNext) onChange?.(page + 1);
  };

  return (
    <div
      className={cn('inline-flex items-center gap-2', className)}
      style={style}
      role="navigation"
      aria-label="Pagination"
    >
      <button
        type="button"
        onClick={handlePrev}
        disabled={!canPrev}
        aria-label="Previous page"
        className={cn(
          'inline-flex h-9 items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--border-default)] px-3.5',
          'text-[length:var(--text-sm)] font-[var(--fw-medium)] text-[var(--text-body)]',
          'transition-colors duration-[var(--dur-fast)]',
          'hover:bg-[var(--bg-subtle)]',
          'focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        <Icon name="ChevronLeft" size={16} />
        Previous
      </button>
      <span
        className={cn(
          'inline-flex h-9 min-w-[7rem] items-center justify-center rounded-[var(--radius-pill)] px-4',
          'bg-[var(--primary-soft)] text-[length:var(--text-sm)] font-[var(--fw-semibold)] text-[var(--primary)]',
        )}
        aria-live="polite"
      >
        Page {page} of {pageCount}
      </span>
      <button
        type="button"
        onClick={handleNext}
        disabled={!canNext}
        aria-label="Next page"
        className={cn(
          'inline-flex h-9 items-center gap-1 rounded-[var(--radius-pill)] border border-[var(--border-default)] px-3.5',
          'text-[length:var(--text-sm)] font-[var(--fw-medium)] text-[var(--text-body)]',
          'transition-colors duration-[var(--dur-fast)]',
          'hover:bg-[var(--bg-subtle)]',
          'focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
          'disabled:cursor-not-allowed disabled:opacity-50',
        )}
      >
        Next
        <Icon name="ChevronRight" size={16} />
      </button>
    </div>
  );
}
