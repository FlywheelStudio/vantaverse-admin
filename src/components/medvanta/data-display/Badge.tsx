import { cn } from '../utils/cn';

const toneStyles = {
  neutral: 'bg-[var(--slate-100)] text-[var(--slate-700)]',
  brand: 'bg-[var(--navy-100)] text-[var(--navy-700)]',
  accent: 'bg-[var(--cyan-100)] text-[var(--cyan-800)]',
  success: 'bg-[var(--success-soft)] text-[var(--success)]',
  warning: 'bg-[var(--warning-soft)] text-[var(--warning)]',
  danger: 'bg-[var(--danger-soft)] text-[var(--danger)]',
} as const;

interface BadgeProps {
  children?: React.ReactNode;
  tone?: keyof typeof toneStyles;
  dot?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

/** Small status pill. */
export function Badge({
  children,
  tone = 'neutral',
  dot = false,
  className,
  style,
}: BadgeProps): React.ReactElement {
  const toneClass = toneStyles[tone];

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-[var(--radius-pill)] px-2.5 py-[3px] text-[length:var(--text-xs)] font-[var(--fw-semibold)] leading-[1.4]',
        toneClass,
        className,
      )}
      style={style}
    >
      {dot ? (
        <span
          className="h-1.5 w-1.5 shrink-0 rounded-full bg-current"
          aria-hidden
        />
      ) : null}
      {children}
    </span>
  );
}
