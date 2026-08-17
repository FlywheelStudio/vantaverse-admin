'use client';

import * as ProgressPrimitive from '@radix-ui/react-progress';
import { cn } from '../utils/cn';

export interface ProgressBarProps {
  value?: number;
  max?: number;
  tone?: 'accent' | 'brand' | 'success' | 'warning';
  showLabel?: boolean;
  height?: number;
  className?: string;
  style?: React.CSSProperties;
}

const toneColors = {
  accent: 'var(--accent)',
  brand: 'var(--primary)',
  success: 'var(--success)',
  warning: 'var(--warning)',
} as const;

/** Determinate horizontal progress indicator. */
export function ProgressBar({
  value = 0,
  max = 100,
  tone = 'accent',
  showLabel = false,
  height = 8,
  className,
  style,
}: ProgressBarProps): React.ReactElement {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));

  return (
    <div
      className={cn('flex items-center gap-2.5', className)}
      style={style}
    >
      <ProgressPrimitive.Root
        value={pct}
        max={100}
        className="flex-1 overflow-hidden rounded-[var(--radius-pill)] bg-[var(--slate-200)]"
        style={{ height }}
      >
        <ProgressPrimitive.Indicator
          className="h-full w-full rounded-[var(--radius-pill)] transition-[transform] duration-[var(--dur-slow)] ease-[var(--ease-out)]"
          style={{
            transform: `translateX(-${100 - pct}%)`,
            backgroundColor: toneColors[tone],
          }}
        />
      </ProgressPrimitive.Root>
      {showLabel ? (
        <span className="min-w-[34px] text-right text-[length:var(--text-xs)] font-[var(--fw-semibold)] tabular-nums text-[var(--text-muted)]">
          {Math.round(pct)}%
        </span>
      ) : null}
    </div>
  );
}
