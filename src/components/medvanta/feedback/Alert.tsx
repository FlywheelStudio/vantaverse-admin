'use client';

import { cn } from '../utils/cn';
import { Icon } from '../actions/Icon';

export interface AlertProps {
  kind?: 'info' | 'success' | 'warning' | 'danger';
  title?: React.ReactNode;
  children?: React.ReactNode;
  onClose?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

const kindConfig = {
  info: {
    icon: 'Info',
    container:
      'bg-[var(--cyan-50)] border-[var(--cyan-200)]',
    iconClass: 'text-[var(--cyan-800)]',
  },
  success: {
    icon: 'CircleCheck',
    container:
      'bg-[var(--success-soft)] border-[color-mix(in_oklch,var(--success)_30%,white)]',
    iconClass: 'text-[var(--success)]',
  },
  warning: {
    icon: 'TriangleAlert',
    container:
      'bg-[var(--warning-soft)] border-[color-mix(in_oklch,var(--warning)_30%,white)]',
    iconClass: 'text-[var(--warning)]',
  },
  danger: {
    icon: 'CircleAlert',
    container:
      'bg-[var(--danger-soft)] border-[color-mix(in_oklch,var(--danger)_30%,white)]',
    iconClass: 'text-[var(--danger)]',
  },
} as const;

/** Inline status banner for info, success, warning, or danger messages. */
export function Alert({
  kind = 'info',
  title,
  children,
  onClose,
  className,
  style,
}: AlertProps): React.ReactElement {
  const config = kindConfig[kind];

  return (
    <div
      role="alert"
      className={cn(
        'flex gap-3 rounded-[var(--radius-md)] border px-4 py-3.5',
        config.container,
        className,
      )}
      style={style}
    >
      <Icon
        name={config.icon}
        size={20}
        className={cn('mt-px shrink-0', config.iconClass)}
      />
      <div className="min-w-0 flex-1">
        {title ? (
          <div
            className={cn(
              'text-[length:var(--text-md)] font-[var(--fw-bold)] text-[var(--text-strong)]',
              children ? 'mb-0.5' : undefined,
            )}
          >
            {title}
          </div>
        ) : null}
        {children ? (
          <div className="text-[length:var(--text-sm)] text-[var(--text-body)]">
            {children}
          </div>
        ) : null}
      </div>
      {onClose ? (
        <button
          type="button"
          onClick={onClose}
          aria-label="Dismiss"
          className="shrink-0 border-0 bg-transparent p-0 text-[var(--text-muted)] hover:text-[var(--text-body)]"
        >
          <Icon name="X" size={16} />
        </button>
      ) : null}
    </div>
  );
}
