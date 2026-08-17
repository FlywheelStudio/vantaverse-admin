'use client';

import { useState } from 'react';
import { cn } from '../utils/cn';

export interface CardProps {
  children?: React.ReactNode;
  padding?: number;
  interactive?: boolean;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Surface container with optional hover lift. */
export function Card({
  children,
  padding = 20,
  interactive = false,
  onClick,
  className,
  style,
}: CardProps): React.ReactElement {
  const [hover, setHover] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => interactive && setHover(false)}
      className={cn(
        'rounded-[var(--radius-sm)] border border-[var(--border-subtle)] bg-[var(--surface-card)] transition-[box-shadow,transform] duration-[var(--dur-base)]',
        interactive && 'cursor-pointer',
        hover ? 'shadow-[var(--shadow-md)] -translate-y-0.5' : 'shadow-[var(--shadow-sm)]',
        className,
      )}
      style={{ padding, ...style }}
    >
      {children}
    </div>
  );
}

export interface CardHeaderProps {
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}

/** Title + subtitle + optional action slot for Card. */
export function CardHeader({
  title,
  subtitle,
  action,
  className,
  style,
}: CardHeaderProps): React.ReactElement {
  return (
    <div
      className={cn('mb-4 flex items-start justify-between gap-3', className)}
      style={style}
    >
      <div>
        <div className="text-[length:var(--text-lg)] font-[var(--fw-bold)] text-[var(--text-strong)]">
          {title}
        </div>
        {subtitle ? (
          <div className="mt-0.5 text-[length:var(--text-sm)] text-[var(--text-muted)]">
            {subtitle}
          </div>
        ) : null}
      </div>
      {action}
    </div>
  );
}
