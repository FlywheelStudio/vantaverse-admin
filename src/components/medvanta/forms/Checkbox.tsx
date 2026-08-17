'use client';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { cn } from '../utils/cn';
import { Icon } from '../actions/Icon';

export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  label?: string;
  disabled?: boolean;
  onChange?: (checked: boolean) => void;
  className?: string;
  style?: React.CSSProperties;
}

/** Labeled checkbox, brand-cyan when checked. */
export function Checkbox({
  checked,
  defaultChecked,
  label,
  disabled = false,
  onChange,
  className,
  style,
}: CheckboxProps): React.ReactElement {
  return (
    <label
      className={cn(
        'inline-flex items-center gap-2.5',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer',
        className,
      )}
      style={style}
    >
      <CheckboxPrimitive.Root
        checked={checked}
        defaultChecked={defaultChecked}
        disabled={disabled}
        onCheckedChange={(state) => onChange?.(state === true)}
        className={cn(
          'inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-[var(--radius-xs)] border-[1.5px] border-[var(--border-strong)] bg-[var(--surface-card)] transition-[background,border-color] duration-[var(--dur-fast)]',
          'data-[state=checked]:border-[var(--accent)] data-[state=checked]:bg-[var(--accent)]',
          'focus-visible:outline-none focus-visible:shadow-[var(--shadow-focus)]',
          'disabled:cursor-not-allowed disabled:opacity-60',
        )}
      >
        <CheckboxPrimitive.Indicator className="flex items-center justify-center">
          <Icon
            name="Check"
            size={14}
            className="text-[var(--text-inverse)]"
            strokeWidth={3}
          />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label ? (
        <span className="text-[length:var(--text-md)] text-[var(--text-body)]">
          {label}
        </span>
      ) : null}
    </label>
  );
}
