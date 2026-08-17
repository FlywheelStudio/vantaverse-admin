'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';
import { Icon } from './Icon';

const iconButtonVariants = cva(
  'inline-flex items-center justify-center border transition-colors disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
  {
    variants: {
      variant: {
        ghost:
          'bg-transparent text-[var(--text-body)] border-transparent hover:bg-[var(--bg-subtle)]',
        secondary:
          'bg-[var(--surface-card)] text-[var(--text-strong)] border-[var(--border-default)] hover:bg-[var(--bg-subtle)]',
        primary:
          'bg-[var(--primary)] text-[var(--text-inverse)] border-transparent hover:bg-[var(--primary-hover)]',
        accent:
          'bg-[var(--accent)] text-[var(--text-inverse)] border-transparent hover:bg-[var(--accent-hover)]',
      },
      size: {
        sm: 'h-8 w-8',
        md: 'h-10 w-10',
        lg: 'h-12 w-12',
      },
      shape: {
        circle: 'rounded-[var(--radius-pill)]',
        rounded: 'rounded-[var(--radius-sm)]',
      },
    },
    defaultVariants: { variant: 'ghost', size: 'md', shape: 'circle' },
  },
);

export type IconButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof iconButtonVariants> & {
    icon: string;
    label: string;
  };

/** Square/circular button holding a single Lucide glyph. */
export function IconButton({
  icon,
  variant,
  size,
  shape,
  label,
  disabled,
  className,
  type = 'button',
  ...rest
}: IconButtonProps): React.ReactElement {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;

  return (
    <button
      type={type}
      aria-label={label}
      disabled={disabled}
      className={cn(iconButtonVariants({ variant, size, shape }), className)}
      {...rest}
    >
      <Icon name={icon} size={iconSize} />
    </button>
  );
}
