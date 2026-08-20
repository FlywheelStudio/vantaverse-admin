'use client';

import { Icon } from '../actions/Icon';
import { cn } from '../utils/cn';

const toneStyles = {
  neutral: 'bg-[var(--slate-100)] text-[var(--slate-700)]',
  accent: 'bg-[var(--cyan-100)] text-[var(--cyan-800)]',
} as const;

interface TagProps {
  children?: React.ReactNode;
  onRemove?: () => void;
  tone?: keyof typeof toneStyles;
  className?: string;
  style?: React.CSSProperties;
}

/** Removable label chip for filters / tokens. */
export function Tag({
  children,
  onRemove,
  tone = 'neutral',
  className,
  style,
}: TagProps): React.ReactElement {
  const toneClass = toneStyles[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-[var(--radius-pill)] py-1 pl-3 pr-1.5 text-[length:var(--text-sm)] font-[var(--fw-medium)]',
        toneClass,
        className,
      )}
      style={style}
    >
      {children}
      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove"
          className="inline-flex cursor-pointer rounded-full border-none bg-transparent p-0.5 opacity-60 transition-opacity hover:opacity-100"
        >
          <Icon name="X" size={13} strokeWidth={2.5} />
        </button>
      ) : null}
    </span>
  );
}
