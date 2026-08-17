'use client';

import { Icon } from '@/components/medvanta';

export interface HtmlTableFooterProps {
  summary: React.ReactNode;
  page: number;
  pageCount: number;
  onPageChange: (page: number) => void;
}

/** HTML `.cf` table footer with `.pg` pagination controls. */
export function HtmlTableFooter({
  summary,
  page,
  pageCount,
  onPageChange,
}: HtmlTableFooterProps): React.ReactElement {
  const safePageCount = Math.max(pageCount, 1);
  const canPrev = page > 1;
  const canNext = page < safePageCount;

  return (
    <div className="cf">
      <span>{summary}</span>
      <span className="sp pg">
        <button
          type="button"
          disabled={!canPrev}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
        >
          <Icon name="ChevronLeft" size={16} />
        </button>
        <button type="button" className="on" aria-current="page">
          {page}
        </button>
        <button
          type="button"
          disabled={!canNext}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
        >
          <Icon name="ChevronRight" size={16} />
        </button>
      </span>
    </div>
  );
}
