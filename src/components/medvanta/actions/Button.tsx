'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '../utils/cn';
import { Icon } from './Icon';

const buttonVariants = cva(
  'inline-flex items-center justify-center font-semibold rounded-[var(--radius-pill)] transition-transform active:scale-[0.97] disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
  {
    variants: {
      variant: {
        primary:
          'bg-[var(--primary)] text-[var(--text-inverse)] hover:bg-[var(--primary-hover)]',
        accent:
          'bg-[var(--accent)] text-[var(--text-inverse)] hover:bg-[var(--accent-hover)]',
        secondary:
          'bg-transparent border border-[var(--border-default)] text-[var(--text-strong)] hover:bg-[var(--bg-subtle)]',
        ghost:
          'bg-transparent text-[var(--text-body)] hover:bg-[var(--bg-subtle)]',
        danger:
          'bg-[var(--danger)] text-[var(--text-inverse)] hover:opacity-90',
      },
      size: {
        sm: 'h-8 px-3.5 text-[length:var(--text-sm)] gap-1.5',
        md: 'h-10 px-[18px] text-[length:var(--text-md)] gap-2',
        lg: 'h-12 px-6 text-[length:var(--text-base)] gap-2.5',
      },
    },
    defaultVariants: { variant: 'primary', size: 'md' },
  },
);

export type ButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & {
    iconLeft?: string;
    iconRight?: string;
    fullWidth?: boolean;
    loading?: boolean;
  };

/** Primary action control. Pill-shaped per MedVanta brand. */
export function Button({
  children,
  variant,
  size,
  iconLeft,
  iconRight,
  fullWidth,
  loading,
  disabled,
  className,
  type = 'button',
  ...rest
}: ButtonProps): React.ReactElement {
  const iconSize = size === 'sm' ? 16 : size === 'lg' ? 20 : 18;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={cn(buttonVariants({ variant, size }), fullWidth && 'w-full', className)}
      {...rest}
    >
      {loading ? (
        <Icon name="LoaderCircle" size={iconSize} className="animate-spin" />
      ) : iconLeft ? (
        <Icon name={iconLeft} size={iconSize} />
      ) : null}
      {children}
      {!loading && iconRight ? <Icon name={iconRight} size={iconSize} /> : null}
    </button>
  );
}
